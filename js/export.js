(function() {
  'use strict';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
  }

  async function ensureLibraries() {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }

  const EXPORT_PADDING = 24;

  function applyExportPadding(el, add) {
    if (add) {
      el.style.padding = EXPORT_PADDING + 'px';
      el.style.boxSizing = 'border-box';
    } else {
      el.style.padding = '';
      el.style.boxSizing = '';
    }
  }

  window.ResumeExport = {
    async downloadPDF(element) {
      try {
        await ensureLibraries();
        applyExportPadding(element, true);
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        applyExportPadding(element, false);
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 10;
        const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
        let heightLeft = pdfHeight;
        let position = margin;
        pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = margin - (pdfHeight - heightLeft);
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
        pdf.save('curriculo.pdf');
        showToast('PDF salvo com sucesso!', 'success');
      } catch (err) {
        showToast('Erro ao gerar PDF: ' + err.message, 'error');
      }
    },

    async downloadImage(element) {
      try {
        await ensureLibraries();
        applyExportPadding(element, true);
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        applyExportPadding(element, false);
        const link = document.createElement('a');
        link.download = 'curriculo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Imagem salva com sucesso!', 'success');
      } catch (err) {
        showToast('Erro ao gerar imagem: ' + err.message, 'error');
      }
    },

    async copyToClipboard(element) {
      try {
        await ensureLibraries();
        applyExportPadding(element, true);
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
        applyExportPadding(element, false);
        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            showToast('Currículo copiado para a área de transferência!', 'success');
          } catch {
            showToast('Não foi possível copiar a imagem.', 'error');
          }
        });
      } catch (err) {
        showToast('Erro: ' + err.message, 'error');
      }
    }
  };
})();
