async function loadWeather() {
  const kcdwDiv = document.getElementById('wx-kcdw');
  const extraDiv = document.getElementById('wx-extra');
  const proxyUrl = "https://script.google.com/macros/s/AKfycbwLouFh4fZ6O1qV1n2fnI4VYCcujzBFuIIN3wrYscGnSlpjbdtvnU_x3ANHWTTN_4bw/exec";
  const stationIDs = "KCDW,KMMU,KTEB";

  kcdwDiv.innerHTML = "<pre>Fetching latest METARs and TAFs...</pre>";
  extraDiv.innerHTML = "";

  try {
    const response = await fetch(`${proxyUrl}?ids=${stationIDs}`);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    const text = await response.text();
    const blocks = text.trim().split(/\n(?=K[A-Z]{3} )/);
    const kcdw = blocks.find(b => b.startsWith("KCDW"));
    const others = blocks.filter(b => !b.startsWith("KCDW"));
    const kcdwCategory = getFlightCategoryFromMETAR(kcdw);
    const kcdwPulse = shouldPulseFromWind(kcdw) ? "pulse-border" : "";
    const kcdwConvective = hasConvectiveActivity(kcdw) ? "convective-flag" : "";

    kcdwDiv.innerHTML = `
      <div class="wx-line-block wx-${kcdwCategory}">
        <div class="wx-box ${[kcdwPulse, kcdwConvective].join(" ").trim()}">
          <pre>${kcdw.replace(/\n/g, "<br>")}</pre>
          ${kcdwConvective ? '<div class="convective-icon">⚡</div>' : ''}
        </div>
      </div>`;

    extraDiv.innerHTML = others.map(block => {
      const isTAF = block.startsWith("K") && block.includes("FM") && block.includes("/");
      const category = isTAF ? getFlightCategoryFromTAF(block) : getFlightCategoryFromMETAR(block);
      const pulse = (isTAF ? shouldPulseFromTAF(block) : shouldPulseFromWind(block)) ? "pulse-border" : "";
      const hasCB = hasConvectiveActivity(block);
      const convective = hasCB ? "convective-flag" : "";

      return `
        <div class="wx-line-block wx-${category}">
          <div class="wx-box ${[pulse, convective].join(' ').trim()}">
            <pre>${block.replace(/\n/g, "<br>")}</pre>
            ${hasCB ? '<div class="convective-icon">⚡</div>' : ''}
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    console.error("Weather fetch error:", err);
    kcdwDiv.innerHTML = "<pre>❌ Unable to fetch weather data.\nCheck console for details.</pre>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadWeather();
  const toggleBtn = document.getElementById("toggleWxButton");
  const extraDiv = document.getElementById("wx-extra");
  toggleBtn.addEventListener("click", () => {
    const isExpanded = extraDiv.classList.contains("expanded");
    extraDiv.classList.toggle("expanded");
    toggleBtn.textContent = isExpanded ? "Show Nearby Weather" : "Hide Nearby Weather";
  });
});
