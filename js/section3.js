document.addEventListener("DOMContentLoaded", function () {
  // Prefill based on selected tail number
  document.getElementById("tailNumber").addEventListener("change", function () {
    const airplane = document.getElementById("airplaneType").value;
    const mappedType = airplane === "C172S-G1000" ? "C172S" : airplane;
    const selectedTail = this.value;
    const match = (window.tailNumberData?.[mappedType] || []).find(t => t.tail === selectedTail);
    if (match) {
      const fuelArm = window.fuelARMs?.[mappedType] || 48.0;
      const fuelWeight = match.fuel * 6;
      const fuelMoment = (fuelWeight * fuelArm) / 1000;
      document.getElementById("emptyWeight").value = Math.round(match.weight);
      document.getElementById("emptyMoment").value = (match.moment / 1000).toFixed(1);
      document.getElementById("fuelWeight").value = Math.round(fuelWeight);
      document.getElementById("fuelMoment").value = fuelMoment.toFixed(1);
    }
  });

  // Input formatting on blur
  const momentInputs = document.querySelectorAll("input[id$='Moment']");
  const weightInputs = document.querySelectorAll("input[id$='Weight']:not(#fuelWeight):not(#emptyWeight)");
  momentInputs.forEach(input => {
    input.addEventListener("blur", () => {
      const val = parseFloat(input.value);
      if (!isNaN(val)) input.value = val.toFixed(1);
    });
  });
  weightInputs.forEach(input => {
    input.addEventListener("blur", () => {
      const val = parseFloat(input.value);
      if (!isNaN(val)) input.value = Math.round(val);
    });
  });

  // Reference lines for manual CG estimator
  const chartInner = document.querySelector(".chart-inner");
  const chartImg = document.getElementById("loadingGraph");
  const vLine = document.getElementById("vLine");
  const hLine = document.getElementById("hLine");

  const svgBounds = {
    left: 113,
    right: 578,
    top: 27,
    bottom: 624
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function makeDraggable(line, axis, scaleX, scaleY) {
    let isDragging = false;
    const start = (e) => {
      if (e.target !== line) return;
      isDragging = true;
      document.body.style.cursor = "grabbing";
      e.preventDefault();
    };
    const move = (e) => {
      if (!isDragging) return;
      const evt = e.touches ? e.touches[0] : e;
      const rect = chartInner.getBoundingClientRect();
      if (axis === "x") {
        const x = evt.clientX - rect.left;
        const minX = svgBounds.left * scaleX;
        const maxX = svgBounds.right * scaleX;
        vLine.style.left = `${clamp(x, minX, maxX)}px`;
      } else {
        const y = evt.clientY - rect.top;
        const minY = svgBounds.top * scaleY;
        const maxY = svgBounds.bottom * scaleY;
        hLine.style.top = `${clamp(y, minY, maxY)}px`;
      }
    };
    const end = () => {
      isDragging = false;
      document.body.style.cursor = "";
    };
    line.addEventListener("mousedown", start);
    line.addEventListener("touchstart", start, { passive: false });
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("mouseup", end);
    window.addEventListener("touchend", end);
  }

  function initializeChartLines() {
    const imgRect = chartImg.getBoundingClientRect();
    const scaleX = imgRect.width / chartImg.naturalWidth;
    const scaleY = imgRect.height / chartImg.naturalHeight;
    const centerX = ((svgBounds.left + svgBounds.right) / 2) * scaleX;
    const centerY = ((svgBounds.top + svgBounds.bottom) / 2) * scaleY;
    vLine.style.left = `${centerX}px`;
    hLine.style.top = `${centerY}px`;
    vLine.style.display = "block";
    hLine.style.display = "block";
    makeDraggable(vLine, "x", scaleX, scaleY);
    makeDraggable(hLine, "y", scaleX, scaleY);
  }

  document.getElementById("resetRefLines").addEventListener("click", () => {
    if (!chartImg.complete) return;
    const imgRect = chartImg.getBoundingClientRect();
    const scaleX = imgRect.width / chartImg.naturalWidth;
    const scaleY = imgRect.height / chartImg.naturalHeight;
    const centerX = ((svgBounds.left + svgBounds.right) / 2) * scaleX;
    const centerY = ((svgBounds.top + svgBounds.bottom) / 2) * scaleY;
    vLine.style.left = `${centerX}px`;
    hLine.style.top = `${centerY}px`;
  });

  chartImg.addEventListener("load", initializeChartLines);
  if (chartImg.complete) {
    chartImg.dispatchEvent(new Event("load"));
  }

  // Charts: CG Envelope & Moment
  const ctx = document.getElementById('cgEnvelopePlot').getContext('2d');
  const ctx2 = document.getElementById('momentWeightPlot').getContext('2d');
  const cgChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'CG Envelope (C172S)',
          data: [
            { x: 35.0, y: 2200 }, { x: 35.0, y: 2350 },
            { x: 37.5, y: 2550 }, { x: 47.3, y: 2550 },
            { x: 46.0, y: 2350 }, { x: 41.0, y: 2200 },
            { x: 35.0, y: 2200 }
          ],
          borderColor: 'rgba(0, 128, 0, 0.5)',
          borderWidth: 2,
          showLine: true,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Your Takeoff CG',
          data: [],
          backgroundColor: 'red',
          pointRadius: 5
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { min: 30, max: 50, title: { display: true, text: 'CG (inches)' }},
        y: { min: 2000, max: 2600, title: { display: true, text: 'Takeoff Weight (lbs)' }}
      },
      plugins: { legend: { display: false } }
    }
  });

  window.momentChart = new Chart(ctx2, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: "Moment Limits",
          data: [{ x: 70.0, y: 2200 }, { x: 85.0, y: 2550 }],
          showLine: true,
          borderColor: 'rgba(0,0,255,0.3)',
          fill: false,
          pointRadius: 0
        },
        {
          label: "Your Takeoff Moment",
          data: [],
          backgroundColor: 'purple',
          pointRadius: 5
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { min: 60, max: 100, title: { display: true, text: "Moment (lb-in / 1000)" }},
        y: { min: 2000, max: 2600, title: { display: true, text: "Takeoff Weight (lbs)" }}
      },
      plugins: { legend: { display: false } }
    }
  });

  function updateCGDot() {
    const wt = parseFloat(document.getElementById("takeoffWeight").value);
    const cg = parseFloat(document.getElementById("takeoffCG").value);
    const moment = parseFloat(document.getElementById("takeoffMoment").value);

    const cgPoint = cgChart.data.datasets[1];
    if (!isNaN(wt) && !isNaN(cg)) {
      cgPoint.data = [{ x: cg, y: wt }];
      let lower = 0, upper = 0;
      if (wt <= 2200) { lower = 35.0; upper = 41.0; }
      else if (wt <= 2350) { lower = 35.0; upper = 46.0; }
      else if (wt <= 2550) { lower = 37.5; upper = 47.3; }
      cgPoint.backgroundColor = (cg >= lower && cg <= upper) ? 'green' : 'red';
    } else {
      cgPoint.data = [];
    }
    cgChart.update();

    const momentData = window.momentChart.data.datasets[1];
    if (!isNaN(moment) && !isNaN(wt)) {
      momentData.data = [{ x: moment, y: wt }];
    } else {
      momentData.data = [];
    }
    window.momentChart.update();
  }

  ["takeoffWeight", "takeoffCG", "takeoffMoment"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateCGDot);
  });
});
