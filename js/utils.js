function getFlightCategoryFromMETAR(metar) {
  try {
    const visMatch = metar.match(/ (\d{1,2}) ?(?:\/(\d))?SM| (\d)\/(\d)SM/);
    let vis = null;
    if (visMatch) {
      if (visMatch[1]) {
        vis = parseInt(visMatch[1], 10);
        if (visMatch[2]) vis += parseInt(visMatch[2], 10) / parseInt(visMatch[2], 10 === 0 ? 1 : 1);
      } else if (visMatch[3] && visMatch[4]) {
        vis = parseInt(visMatch[3], 10) / parseInt(visMatch[4], 10);
      }
    }
    const ceilingMatch = [...metar.matchAll(/ (BKN|OVC)(\d{3})/g)];
    const ceilings = ceilingMatch.map(m => parseInt(m[2], 10) * 100);
    const lowestCeiling = Math.min(...ceilings);
    if ((lowestCeiling < 500) || (vis !== null && vis < 1)) return "lifr";
    if ((lowestCeiling >= 500 && lowestCeiling < 1000) || (vis !== null && vis >= 1 && vis < 3)) return "ifr";
    if ((lowestCeiling >= 1000 && lowestCeiling <= 3000) || (vis !== null && vis >= 3 && vis <= 5)) return "mvfr";
    if ((lowestCeiling > 3000 && vis !== null && vis > 5)) return "vfr";
  } catch (e) {
    console.warn("Unable to parse METAR:", metar);
  }
  return "unknown";
}

function shouldPulseFromWind(metar) {
  try {
    const windMatch = metar.match(/(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT/);
    if (!windMatch) return false;
    const windSpeed = parseInt(windMatch[2], 10);
    const gust = windMatch[4] ? parseInt(windMatch[4], 10) : 0;
    return windSpeed >= 16 || gust >= 16;
  } catch (e) {
    return false;
  }
}

function getFlightCategoryFromTAF(taf) {
  const lines = taf.split(/\n|<br>/);
  const todayUTC = new Date().getUTCDate().toString().padStart(2, "0");
  const forecastLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("K")) {
      forecastLines.push(trimmed);
      continue;
    }
    const fmMatch = trimmed.match(/^FM(\d{2})\d{4}/);
    if (fmMatch && fmMatch[1] === todayUTC) {
      forecastLines.push(trimmed);
      continue;
    }
    const tempoMatch = trimmed.match(/TEMPO\s+(\d{2})\d{2}\/(\d{2})\d{2}/);
    if (tempoMatch && (tempoMatch[1] === todayUTC || tempoMatch[2] === todayUTC)) {
      forecastLines.push(trimmed);
    }
  }

  const categories = forecastLines.map(getFlightCategoryFromMETAR).filter(cat =>
    ["lifr", "ifr", "mvfr", "vfr"].includes(cat)
  );

  const priority = { lifr: 4, ifr: 3, mvfr: 2, vfr: 1 };
  categories.sort((a, b) => priority[b] - priority[a]);

  return categories[0] || "unknown";
}

function shouldPulseFromTAF(taf) {
  const lines = taf.split(/\n|<br>/);
  const todayUTC = new Date().getUTCDate().toString().padStart(2, "0");
  return lines.some(line => {
    const match = line.match(/^FM(\d{2})\d{4}.*?(\d{3}|VRB)(\d{2,3})(G(\d{2,3}))?KT/);
    if (!match || match[1] !== todayUTC) return false;
    const wind = parseInt(match[3], 10);
    const gust = match[5] ? parseInt(match[5], 10) : 0;
    return wind >= 16 || gust >= 16;
  });
}

function hasConvectiveActivity(text) {
  const keywords = [
    /\bCB\b/, /\bCBMAM\b/, /\bTS\b/, /\bVCTS\b/, /\bLTG\b/, /\bTSNO\b/,
    /\+TS\b/, /\bTSRA\b/, /\bTSTORM\b/, /\+RA\b/, /\bFC\b/, /\bTORNADO\b/
  ];
  return keywords.some(rx => rx.test(text.toUpperCase()));
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
