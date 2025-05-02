// js/100_pdf.js
// ── 100.00 PDF MODULE (Optimized & Compressed) ──
// Mobile-first, dark-friendly, touch targets, JPEG map export, emoji & dlog notifications

// 📄 File loaded
dlog("📄 [PDF] js/100_pdf.js loaded");

;(async function() {
  // Chapter 1️⃣: Setup jsPDF
  dlog("1️⃣ [PDF] Chapter 1: Setting up jsPDF");
  const jsPDF = window.jspdf?.jsPDF || window.jspdf?.default?.jsPDF;
  if (typeof jsPDF !== 'function') {
    derr("❌ [PDF] jsPDF constructor not found");
    return;
  }

  // Chapter 2️⃣: Preload service icons
  dlog("2️⃣ [PDF] Chapter 2: Preloading service icons");
  async function loadDataURL(src) {
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  }
  const [googleIcon, appleIcon, wazeIcon] = await Promise.all([
    loadDataURL('images/location_card_icons/icons8-google-maps-100.png'),
    loadDataURL('images/location_card_icons/icons8-maps-100.png'),
    loadDataURL('images/location_card_icons/icons8-waze-100.png')
  ]);
  dlog("✅ 2️⃣ Chapter 2 complete: Icons loaded");

  // Chapter 3️⃣: Register initPDF listener
  dlog("3️⃣ [PDF] Chapter 3: Registering initPDF function");
  function initPDF() {
    dlog("🛠️ 3️⃣ initPDF(): Checking UI elements...");
    const btn   = document.getElementById('pdf-button');
    const mapEl = document.getElementById('map');
    if (!btn || !mapEl) {
      dwarn("⚠️ [PDF] Required #pdf-button or #map element missing");
      return;
    }

    // Chapter 4️⃣: Attach click handler
    dlog("🔗 4️⃣ Attaching click listener to PDF button");
    btn.addEventListener('click', async () => {
      dlog('⚙️ 4️⃣ Export triggered - beginning PDF generation');
      clearMessages(); displayStatus('📄 Generating Production Sheet…');

      // Chapter 5️⃣: Create document & layout
      dlog('📐 5️⃣ Creating jsPDF document and defining layout variables');
      const doc = new jsPDF({ orientation:'p', unit:'mm', format:'a4', compress:true });
      const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
      const m = 8; let y = m;
      const stampSize = 16, svcSize = 20, svcSpacing = svcSize + 6;
      const rowH = svcSize + 12;
      doc.setFillColor(43,43,43).rect(0,0,W,H,'F');
      dlog('✅ 5️⃣ Document initialized');

      // Chapter 6️⃣: Header & context
      dlog('🔖 6️⃣ Drawing header and context');
      doc.setFont('helvetica','bold').setFontSize(28).setTextColor('#F0F0F0')
         .text('Production Sheet', W/2, y+6, {align:'center'});
      y += 16;
      doc.setDrawColor('#555').setLineWidth(0.6).line(m,y,W-m,y);
      y += 10;
      doc.setFont('helvetica','normal').setFontSize(12).setTextColor('#DDD')
         .text('Job ID: ______', m, y)
         .text('Date: ______',  W/2, y, {align:'center'})
         .text('Team: ______', W-m, y, {align:'right'});
      y += 16;
      dlog('✅ 6️⃣ Header drawn');

      // Chapter 7️⃣: Map Overview label
      dlog('🗺️ 7️⃣ Adding "Map Overview" label');
      doc.setFont('helvetica','bold').setFontSize(16).setTextColor('#F0F0F0')
         .text('Map Overview', m, y);
      y += 12;

      // Chapter 8️⃣: Capture map screenshot
      dlog('📷 8️⃣ Capturing map via html2canvas');
      const zoomCtr = mapEl.querySelector('.leaflet-control-zoom');
      if (zoomCtr) zoomCtr.style.display = 'none';
      displayStatus('🗺️ Capturing map…');
      try {
        const canvas   = await html2canvas(mapEl, {useCORS:true, scale:1, backgroundColor:null});
        const jpegData = canvas.toDataURL('image/jpeg',0.75);
        const props    = doc.getImageProperties(jpegData);
        let boxW = W - 2*m, iW = boxW;
        let iH = props.height * iW / props.width;
        const maxH = (H - y - m) * 0.4;
        if (iH > maxH) { iH = maxH; iW = props.width * iH / props.height; }
        doc.addImage(jpegData,'JPEG', m + (boxW-iW)/2, y, iW, iH);
        y += iH + 16;
        dlog('✅ 8️⃣ Map added to PDF');
      } catch(err) {
        derr('❌ 8️⃣ Map capture error', err);
        displayError('❌ Map capture failed');
      } finally {
        if (zoomCtr) zoomCtr.style.display = '';
      }

      // Chapter 9️⃣: Saved locations
      dlog('📋 9️⃣ Adding saved locations');
      displayStatus('📋 Adding locations…');
      const cards = document.querySelectorAll('#saved-locations .location-card');
      if (!cards.length) {
        doc.setFontSize(16).setTextColor('#DDD').text('No saved locations.', m, y);
        y += 16;
      }
      for (const card of cards) {
        if (y > H - m - rowH*1.5) { doc.addPage(); y = m; }
        const iconY = y + (rowH-stampSize)/2;
        const textY = y + rowH/2 + 4;

        // Chapter 9.1: Stamp icon
        const stampImg = card.querySelector('.location-card-icon');
        if (stampImg) {
          doc.addImage(stampImg, 'PNG', m, iconY, stampSize, stampSize);
          dlog('   🔖 9.1 Stamp icon added');
        }

        // Chapter 9.2: Title & coords
        const title = card.querySelector('.location-title')?.textContent.trim()||'–';
        doc.setFont('helvetica','bold').setFontSize(20).setTextColor('#F0F0F0')
           .text(title, m+stampSize+6, textY);
        const coords = card.querySelectorAll('.row-text')[1]?.textContent.trim();
        if (coords) {
          doc.setFont('helvetica','normal').setFontSize(10).setTextColor('#DDD')
             .text(coords, m+stampSize+6, textY+8);
        }
        dlog('   🔹 9.2 Title & coords added');

        // Chapter 9.3: Service icons
        let x = W - m - svcSize;
        for (const [data,key] of [[wazeIcon,'waze'],[appleIcon,'maps'],[googleIcon,'google']]) {
          const link = card.querySelector(`a[href*="${key}"]`);
          if (link) {
            doc.addImage(data,'PNG', x, iconY, svcSize, svcSize);
            doc.link(x, iconY, svcSize, svcSize, {url: link.href});
            x -= svcSpacing;
          }
        }
        dlog('   🌐 9.3 Service icons added');

        // Divider
        y += rowH;
        doc.setDrawColor('#555').setLineWidth(0.5).line(m, y, W-m, y);
        y += 12;
      }
      dlog('✅ 9️⃣ Saved locations complete');

      // Chapter 🔟: Finalize & save
      dlog('🔟 [PDF] Finalizing and saving PDF');
      displayStatus('✅ Finalizing…');
      doc.save(`production_sheet_${Date.now()}.pdf`);
      dlog('🗸 🔟 PDF saved successfully');
      displayStatus('👍 Done!');
    });
    dlog('3️⃣ initPDF() listener attached');
  }

  // expose initPDF globally
  window.initPDF = initPDF;

  // Chapter ⓫: Auto-run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      dlog('⓫ [PDF] DOM ready, calling initPDF()');
      initPDF();
    });
  } else {
    dlog('⓫ [PDF] DOM already ready, calling initPDF()');
    initPDF();
  }
})();
