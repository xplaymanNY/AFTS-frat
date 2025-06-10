document.addEventListener("DOMContentLoaded", function () {
  const riskContainer = document.getElementById('riskFactors');
  const riskScoreText = document.getElementById('riskScoreText');
  const riskProgressBar = document.getElementById('riskProgressBar');
  const clearFRATButton = document.getElementById('clearFRATButton');

  let lastPillIndex = 0;

  function getRiskData() {
    return window.riskData; // Assumes riskData is declared in a <script> tag or preload
  }

  function getGroupDataForFRAT() {
    const cert = document.getElementById('certificateType').value;
    const rules = document.getElementById('flightRules').value;
    const isRenter = document.getElementById('renterWithoutInstruction').checked;
    const isInstrumentRated = document.getElementById('instrumentRated').checked || cert === "Airline Transport Pilot";
    const hasInstructor = document.getElementById('instructorName').value !== "";
    if (!cert) return {};

    const baseKey = getRiskData()[cert] ? cert : "Student Pilot (Local Flight)";
    const groups = deepClone(getRiskData()[baseKey] || {});

    // Merge optional groups
    if (isRenter && getRiskData()["Renter without Instruction"]) {
      for (const grp in getRiskData()["Renter without Instruction"]) {
        groups[grp] = (groups[grp] || []).concat(getRiskData()["Renter without Instruction"][grp]);
      }
    }

    const allowBAA = isInstrumentRated || (rules === "IFR" && hasInstructor);
    if (getRiskData()["Instrument Rated"]) {
      const restrictedCerts = [
        "Discovery Flight",
        "Student Pilot (Local Flight)",
        "Student Pilot (Cross-Country Flight)",
        "Airline Transport Pilot"
      ];
      const allowIRPilotGroup = isInstrumentRated && !restrictedCerts.includes(cert);
      for (const grp in getRiskData()["Instrument Rated"]) {
        if (grp === "Pilot" && !allowIRPilotGroup) continue;
        if (grp === "Best Available Approach" && !allowBAA) continue;
        groups[grp] = (groups[grp] || []).concat(getRiskData()["Instrument Rated"][grp]);
      }
    }

    // De-dupe
    for (const grp in groups) {
      const seen = new Set();
      groups[grp] = groups[grp].filter(item => {
        const key = item.label;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (rules !== "VFR") delete groups["VFR Flight Plan"];
    if (rules !== "IFR") delete groups["IFR Flight Plan"];
    if (!allowBAA) delete groups["Best Available Approach"];

    return groups;
  }

  function renderRiskFactors() {
    const cert = document.getElementById('certificateType').value;
    if (!cert) {
      riskContainer.innerHTML = "";
      return;
    }
    const groups = getGroupDataForFRAT();
    const leftCol = document.createElement("div");
    const rightCol = document.createElement("div");
    leftCol.className = "risk-column";
    rightCol.className = "risk-column";

    const groupToColumn = {
      "Pilot": "left",
      "Flight Conditions": "left",
      "Airport": "left",
      "VFR Flight Plan": "right",
      "IFR Flight Plan": "right",
      "Best Available Approach": "right"
    };

    for (const group in groups) {
      const groupWrapper = document.createElement("div");
      groupWrapper.className = "group-wrapper";

      const header = document.createElement("div");
      header.className = "group-header";
      header.textContent = group;

      const itemWrap = document.createElement("div");
      itemWrap.className = "item-wrapper";

      groups[group].forEach((risk, idx) => {
        const row = document.createElement("div");
        row.className = "item-row";
        const id = `${group.replace(/\s/g, '')}-${idx}`;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = id;
        const riskLabel = document.createElement("label");
        riskLabel.htmlFor = id;
        riskLabel.textContent = risk.label;
        const valueDisplay = document.createElement("span");
        valueDisplay.textContent = "(0)";
        checkbox.addEventListener("change", updateRiskSummary);

        row.appendChild(checkbox);
        row.appendChild(riskLabel);
        row.appendChild(valueDisplay);
        itemWrap.appendChild(row);

        setTimeout(() => {
          row.classList.add("visible");
        }, 100 * idx);
      });

      groupWrapper.appendChild(header);
      groupWrapper.appendChild(itemWrap);

      if (groupToColumn[group] === "right") {
        rightCol.appendChild(groupWrapper);
      } else {
        leftCol.appendChild(groupWrapper);
      }
    }

    riskContainer.innerHTML = "";
    riskContainer.appendChild(leftCol);
    riskContainer.appendChild(rightCol);
    setTimeout(updateRiskSummary, 0);
  }

  function getRiskThresholds() {
    const cert = document.getElementById('certificateType').value;
    const isInstrumentRated = document.getElementById('instrumentRated').checked || cert === "Airline Transport Pilot";

    if (cert === "Discovery Flight") return [2, 4, 5];
    if (cert.startsWith("Student Pilot")) return [12, 18, 19];
    if (cert === "Private Pilot" && isInstrumentRated) return [28, 34, 35];
    if (cert === "Private Pilot") return [18, 24, 25];
    return [28, 34, 35];
  }

  function updateRiskSummary() {
    const cert = document.getElementById('certificateType').value;
    const rules = document.getElementById('flightRules').value;
    const airplane = document.getElementById('airplaneType').value;
    const isDualInstruction = [...riskContainer.querySelectorAll("label")]
      .find(l => l.textContent.trim() === "Dual Instruction Flight")?.previousElementSibling?.checked || false;
    const [low, moderate, high] = getRiskThresholds();

    let score = 0;
    let hasUnmitigatedNoGo = false;

    const allRisks = Object.values(getGroupDataForFRAT()).flat();

    const checkboxes = riskContainer.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach(cb => {
      const row = cb.parentElement;
      const label = row.children[1]?.textContent?.trim() || "";
      const span = row.children[2];
      let valText = "(0)";
      let valColor = "";

      if (cb.checked) {
        const isNoGo = [
          "Personal Minimums Exceeded",
          "Missing Required Legal Documents and/or Endorsements",
          "Less Than 1 Hour of Fuel Reserves"
        ].includes(label);

        if (isNoGo) {
          const mitigated = isDualInstruction && label !== "Less Than 1 Hour of Fuel Reserves";
          if (!mitigated) {
            valText = "(NO-GO)";
            valColor = "red";
            hasUnmitigatedNoGo = true;
          }
        } else {
          const match = allRisks.find(r => r.label === label);
          if (match && typeof match.value === "number") {
            score += match.value;
            valText = (match.value > 0 ? "+" : "") + match.value;
            valText = `(${valText})`;
          }
        }
      }

      span.textContent = valText;
      span.style.color = valColor;
    });

    // Add 5 points if IFR in non-G1000 aircraft
    if (rules === "IFR" && ["C172S", "C172R", "C172P", "PA-44-180"].includes(airplane)) {
      score += 5;
    }

    // Final summary
    let pillIndex = 0;
    let levelText = "";
    let color = "";

    if (hasUnmitigatedNoGo) {
      levelText = "EXTREME RISK (NO-GO)";
      color = "red";
      pillIndex = 3;
    } else if (score <= low) {
      levelText = "LOW RISK";
      color = "green";
      pillIndex = 0;
    } else if (score <= moderate) {
      levelText = "MODERATE RISK";
      color = "orange";
      pillIndex = 1;
    } else if (score >= high && !isDualInstruction) {
      levelText = "HIGH RISK";
      color = "#e67e00";
      pillIndex = 2;
    } else {
      levelText = "MODERATE RISK (Dual)";
      color = "orange";
      pillIndex = 1;
    }

    score = Math.max(0, score);
    riskScoreText.textContent = `Total Risk Score: ${score} — ${levelText}`;
    riskScoreText.style.color = color;

    const stages = ["LOW", "MODERATE", "HIGH", "EXTREME"];
    riskProgressBar.innerHTML = "";
    stages.forEach((stage, i) => {
      const pill = document.createElement("div");
      pill.className = "pill";
      pill.textContent = stage;
      pill.style.borderColor = color;
      pill.style.color = i === pillIndex ? color : "#666";
      pill.style.background = i < pillIndex ? color : "#f9f9f9";
      if (i === pillIndex) pill.style.backgroundColor = "#fff";
      riskProgressBar.appendChild(pill);

      if (i < stages.length - 1) {
        const slash = document.createElement("div");
        slash.textContent = "/";
        slash.style.alignSelf = "center";
        slash.style.margin = "0 4px";
        slash.style.fontWeight = "bold";
        slash.style.color = "#ccc";
        riskProgressBar.appendChild(slash);
      }
    });

    lastPillIndex = pillIndex;
    tryEnableContinueToSection3();
  }

  function tryEnableContinueToSection3() {
    const button = document.getElementById("continueToSection3");
    if (!button) return;
    const riskText = riskScoreText?.textContent || "";
    button.disabled = riskText.includes("EXTREME") || !riskText;
  }

  // Listeners
  clearFRATButton.addEventListener("click", function (e) {
    e.preventDefault();
    const boxes = riskContainer.querySelectorAll("input[type='checkbox']");
    boxes.forEach(box => {
      box.checked = false;
      const span = box.parentElement.querySelector("span");
      if (span) {
        span.textContent = "(0)";
        span.style.color = "";
      }
    });
    updateRiskSummary();
  });

  ["certificateType", "flightRules", "renterWithoutInstruction", "instrumentRated"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", renderRiskFactors);
  });

  document.getElementById("airplaneType")?.addEventListener("change", updateRiskSummary);
  window.renderRiskFactors = renderRiskFactors;
});
