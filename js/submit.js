document.addEventListener("DOMContentLoaded", function () {
  const submitButton = document.getElementById('submitButton');
  const printButton = document.getElementById('printButton');

  submitButton.addEventListener("click", async function (e) {
    e.preventDefault();

    // Required fields
    const requiredIds = ['studentName', 'flightDate', 'certificateType', 'flightRules', 'airplaneType'];
    for (const id of requiredIds) {
      const el = document.getElementById(id);
      if (!el || !el.value) {
        alert("Please fill in all required fields in Section 1.");
        el?.focus();
        return;
      }
    }

    const cert = document.getElementById('certificateType').value;
    const instructor = document.getElementById('instructorName').value;
    if ((cert === "Discovery Flight" || cert.startsWith("Student Pilot")) && !instructor) {
      alert("Please select an Instructor for Discovery/Student Pilot flights.");
      document.getElementById('instructorName').focus();
      return;
    }

    const riskText = document.getElementById('riskScoreText')?.textContent || "Unknown";
    const studentName = document.getElementById("studentName").value;
    const flightDate = document.getElementById("flightDate").value;

    // Placeholder W&B status
    const wbStatus = "✅ W&B OK";

    // Generate PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    const addLine = (label, val) => {
      doc.text(`${label}: ${val}`, 10, y);
      y += 8;
    };

    doc.text("Flight Risk Assessment Tool Submission", 10, y); y += 10;
    addLine("Student", studentName);
    addLine("Date", flightDate);
    addLine("Certificate", cert);
    addLine("Flight Rules", document.getElementById("flightRules").value);
    addLine("Airplane", document.getElementById("airplaneType").value);
    addLine("Instructor", instructor || "N/A");
    addLine("Passenger 1", document.getElementById("passenger1").value);
    addLine("Passenger 2", document.getElementById("passenger2").value);
    y += 4;
    doc.text("Risk Summary:", 10, y); y += 8;
    doc.text(riskText, 10, y); y += 10;
    doc.text("W&B Check:", 10, y); y += 8;
    doc.text(wbStatus, 10, y);

    // Download PDF
    doc.save(`FRAT_${studentName}_${flightDate}.pdf`);

    // Email
    const emailTo = "mgutierrez.dfe@gmail.com";
    const subject = `FRAT Submission – ${studentName} (${flightDate})`;
    const bodyLines = [
      `Flight Risk Assessment Submission`,
      ``,
      `🧑‍✈️ Student: ${studentName}`,
      `📅 Date: ${flightDate}`,
      `🎓 Certificate: ${cert}`,
      `📋 Risk: ${riskText}`,
      `⚖️ W&B: ${wbStatus}`,
      ``,
      `📎 PDF has been downloaded. Please attach it to this email.`,
      ``,
      `— End of Summary —`
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${body}`;

    window.location.href = mailtoLink;
  });

  printButton.addEventListener("click", function (e) {
    e.preventDefault();
    window.print();
  });
});
