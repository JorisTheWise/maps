// js/100_pdf.js
dlog("📄 [PDF] js/100_pdf.js loaded");

function initPDF() {
  dlog("🔧 [PDF] initPDF() starting…");
  const btn       = document.getElementById("pdf-button");
  const loader    = document.getElementById("map-loading");
  const container = document.getElementById("mapImageContainer");

  if (!btn || !loader || !container) {
    dwarn("⚠️ [PDF] missing #pdf-button, #map-loading or #mapImageContainer; skipping setup");
    return;
  }

  btn.addEventListener("click", async () => {
    dlog("🖱️ [PDF] button clicked");
    clearMessages();
    displayStatus("📄 Generating PDF...");
    loader.style.display = "flex";

    try {
      const canvas = await html2canvas(container, {
        useCORS: true,
        scale: 2,
        backgroundColor: null
      });
      dlog("🖼️ [PDF] canvas rendered");

      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) {
        throw new Error("jsPDF not found");
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("map.pdf");
      dlog("💾 [PDF] PDF saved and download triggered");
      displayStatus("✅ PDF downloaded successfully! 💾");
    } catch (err) {
      derr("❌ [PDF] generation failed:", err);
      displayError("❌ PDF generation failed. 🤕");
    } finally {
      loader.style.display = "none";
    }
  });

  dlog("✅ [PDF] initPDF() complete");
}

window.initPDF = initPDF;
