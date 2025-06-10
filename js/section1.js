document.addEventListener("DOMContentLoaded", function () {
  const certDropdown = document.getElementById('certificateType');
  const instrumentCheckbox = document.getElementById('instrumentRated');
  const renterCheckbox = document.getElementById('renterWithoutInstruction');
  const flightRulesDropdown = document.getElementById('flightRules');
  const airplaneDropdown = document.getElementById('airplaneType');
  const instructorDropdown = document.getElementById('instructorName');
  const instructorLabelHuman = document.getElementById('instructorLabelHuman');
  const instrumentLabel = document.getElementById('instrumentLabel');
  const renterLabel = document.getElementById('renterLabel');
  const continueButton = document.getElementById("continueToSection2");

  const instructorWeights = {
    "Alexander Kresic": 150,
    "Alexey Ozerov": 175,
    "Christopher Darby": 200,
    "Dmitry Avdeev": 220,
    "Jay Saduakas": 175,
    "Josselyne Aguilar": 125,
    "Kyle Lacey": 265,
    "Mark Gutierrez": 205,
    "Murad Gabr": 140,
    "Roman Konyushenko": 180,
    "Sham Perera": 200,
    "Shavon Shirley": 140,
    "Sheena Masters": 130,
    "Tony Hwang": 190
  };

  const fuelARMs = {
    "C172P": 48.0,
    "C172R": 48.0,
    "C172S": 48.0,
    "C182T-G1000": 51.0,
    "PA-44-180": 95.0
  };

  const stationDiagramPaths = {
    "C172S": "https://raw.githubusercontent.com/xplaymanNY/AFTS-frat/main/images/stations/C172S_Stations.svg",
    "C172R": "https://raw.githubusercontent.com/xplaymanNY/AFTS-frat/main/images/stations/C172R_Stations.svg",
    "C172P": "https://raw.githubusercontent.com/xplaymanNY/AFTS-frat/main/images/stations/C172P_Stations.svg",
    "C182T-G1000": "https://raw.githubusercontent.com/xplaymanNY/AFTS-frat/main/images/stations/C182T_Stations.svg",
    "PA-44-180": "https://raw.githubusercontent.com/xplaymanNY/AFTS-frat/main/images/stations/PA44_Stations.svg"
  };

  const tailNumberData = {
    "C172P": [{ tail: "N52290", weight: 1485.60, moment: 58305.00, fuel: 40 }],
    "C172R": [{ tail: "N9741F", weight: 1654.00, moment: 64463.50, fuel: 53 }],
    "C172S": [
      { tail: "N272LP", weight: 1718.20, moment: 70569.00, fuel: 53 },
      { tail: "N677DM", weight: 1714.70, moment: 70581.25, fuel: 53 },
      { tail: "N938SA", weight: 1701.70, moment: 69808.35, fuel: 53 },
      { tail: "N5133K", weight: 1662.30, moment: 67011.84, fuel: 53 },
      { tail: "N3505T", weight: 1700.44, moment: 68605.90, fuel: 53 },
      { tail: "N107EL", weight: 1698.50, moment: 70868.00, fuel: 53 },
      { tail: "N5255R", weight: 1712.10, moment: 71669.35, fuel: 53 },
      { tail: "N2461P", weight: 1761.30, moment: 73413.00, fuel: 53 },
      { tail: "N816EP", weight: 1681.60, moment: 69046.50, fuel: 53 }
    ],
    "C182T-G1000": [{ tail: "N72MC", weight: 2024.52, moment: 78712.90, fuel: 87 }],
    "PA-44-180": [
      { tail: "N822BW", weight: 2513.90, moment: 215760.32, fuel: 108 },
      { tail: "N711AV", weight: 2628.50, moment: 228707.22, fuel: 108 }
    ]
  };

  function updateSection1Fields() {
    const cert = certDropdown.value;
    const rules = flightRulesDropdown.value;
    const airplane = airplaneDropdown.value;

    // Update Tail Number Dropdown
    const tailDropdown = document.getElementById("tailNumber");
    if (tailDropdown) {
      tailDropdown.innerHTML = `<option value="">Select Tail Number</option>`;
      const mappedType = airplane === "C172S-G1000" ? "C172S" : airplane;
      const tailOptions = tailNumberData[mappedType] || [];
      for (const entry of tailOptions) {
        const opt = document.createElement("option");
        opt.value = entry.tail;
        opt.textContent = entry.tail;
        tailDropdown.appendChild(opt);
      }
    }

    // Update Station Diagram
    const diagramImg = document.getElementById("stationDiagram");
    if (diagramImg && airplane) {
      const mappedType = airplane === "C172S-G1000" ? "C172S" : airplane;
      diagramImg.src = stationDiagramPaths[mappedType] || "";
    }

    const isInstrumentRated = instrumentCheckbox.checked || cert === "Airline Transport Pilot";
    const isRestricted = ["Discovery Flight", "Student Pilot (Local Flight)", "Student Pilot (Cross-Country Flight)"].includes(cert);
    const isATP = (cert === "Airline Transport Pilot");

    // Disable IFR for restricted certs
    if (isRestricted) {
      flightRulesDropdown.value = "VFR";
    }
    Array.from(flightRulesDropdown.options).forEach(opt => {
      if (opt.value === "IFR") opt.disabled = isRestricted;
    });
    flightRulesDropdown.title = isRestricted ? "IFR not permitted for this certificate type" : "";
    flightRulesDropdown.classList.toggle("disabled-block", isRestricted);

    // Instrument Rated toggle logic
    instrumentCheckbox.disabled = isRestricted || isATP;
    if (instrumentCheckbox.disabled) instrumentCheckbox.checked = false;
    instrumentLabel.classList.toggle("disabled-block", instrumentCheckbox.disabled);
    instrumentCheckbox.title = instrumentCheckbox.disabled ? "Not applicable for this certificate type" : "";

    // Renter toggle logic
    const renterDisabled = cert === "Discovery Flight";
    renterCheckbox.disabled = renterDisabled;
    if (renterDisabled) renterCheckbox.checked = false;
    renterLabel.classList.toggle("disabled-block", renterDisabled);
    renterCheckbox.title = renterDisabled ? "Discovery Flight must be dual instruction" : "";

    // Instructor logic
    const disableInstructor = renterCheckbox.checked && !cert.startsWith("Student Pilot");
    instructorDropdown.disabled = disableInstructor;
    instructorLabelHuman.classList.toggle("disabled-block", disableInstructor);
    instructorDropdown.title = disableInstructor ? "Instructor not required for renters" : "";

    const instructorRequired = cert === "Discovery Flight" || (rules === "IFR" && !isInstrumentRated);
    if (!disableInstructor) {
      if (instructorRequired) {
        instructorDropdown.setAttribute("required", "required");
        instructorLabelHuman.classList.add("required-asterisk");
      } else {
        instructorDropdown.removeAttribute("required");
        instructorLabelHuman.classList.remove("required-asterisk");
      }
    }

    // Prefill instructor weight
    const instName = instructorDropdown.value;
    const instWeight = instructorWeights[instName] || "";
    const wtInput = document.getElementById("instructorWeight");
    if (wtInput) wtInput.value = instWeight;
    const wtSpan = document.getElementById("displayInstructorWeight");
    if (wtSpan) wtSpan.textContent = instWeight ? Math.round(instWeight) : "—";

    tryEnableContinueButton();
  }

  function validateSection1Completion() {
    const cert = certDropdown.value;
    const rules = flightRulesDropdown.value;
    const instructor = instructorDropdown.value;
    const airplane = airplaneDropdown.value;
    const instructorRequired = !instructorDropdown.disabled;
    const instructorValid = !instructorRequired || instructor !== "";
    const isComplete = cert && rules && airplane && instructorValid;
    continueButton.disabled = !isComplete;
    return isComplete;
  }

  function tryEnableContinueButton() {
    const isComplete = validateSection1Completion();
    continueButton.disabled = !isComplete;
  }

  ["change", "input"].forEach(evt => {
    certDropdown.addEventListener(evt, updateSection1Fields);
    flightRulesDropdown.addEventListener(evt, updateSection1Fields);
    renterCheckbox.addEventListener(evt, updateSection1Fields);
    instrumentCheckbox.addEventListener(evt, updateSection1Fields);
    instructorDropdown.addEventListener(evt, updateSection1Fields);
    airplaneDropdown.addEventListener(evt, updateSection1Fields);
  });

  // Continue button logic
  continueButton.addEventListener("click", function () {
    const cert = certDropdown.value;
    const rules = flightRulesDropdown.value;
    const airplane = airplaneDropdown.value;
    const instructorRequired = !instructorDropdown.disabled;
    const instructorValid = !instructorRequired || instructorDropdown.value !== "";
    const formComplete = cert && rules && airplane && instructorValid;

    if (!formComplete) {
      alert("Please complete all required fields in Section 1 before continuing.");
      return;
    }

    const section2 = document.getElementById("section2");
    section2.classList.add("visible");
    setTimeout(() => section2.scrollIntoView({ behavior: "smooth", block: "start" }), 1200);
    renderRiskFactors?.();

    document.getElementById("continueToSection3").addEventListener("click", function () {
      const section3 = document.querySelector(".frat-section3");
      if (!section3) return;
      section3.classList.add("visible");
      setTimeout(() => {
        section3.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 1200);
    });
  });

  // Run on page load
  updateSection1Fields();
});
