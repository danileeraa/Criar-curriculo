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

  window.ResumeExport = {
    async downloadPDF(element) {
      try {
        await ensureLibraries();
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('curriculo.pdf');
        showToast('PDF salvo com sucesso!', 'success');
      } catch (err) {
        showToast('Erro ao gerar PDF: ' + err.message, 'error');
      }
    },

    async downloadImage(element) {
      try {
        await ensureLibraries();
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = 'curriculo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Imagem salva com sucesso!', 'success');
      } catch (err) {
        showToast('Erro ao gerar imagem: ' + err.message, 'error');
      }
    },

    print(element) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write('<html><head>');
      doc.write('<link rel="stylesheet" href="css/style.css">');
      doc.write('<style>body{margin:0;padding:20px;font-family:Arial,sans-serif}</style>');
      doc.write('</head><body>');
      doc.write(element.innerHTML);
      doc.write('</body></html>');
      doc.close();
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    },

    async copyToClipboard(element) {
      try {
        await ensureLibraries();
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
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
