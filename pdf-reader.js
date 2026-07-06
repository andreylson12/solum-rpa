(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.pdf) return;

  const PDFReader = {

    async ler(file){
      if(!window.pdfjsLib){
        throw new Error('PDF.js não carregado.');
      }

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({data:buffer}).promise;

      let texto = '';
      const paginas = Math.min(pdf.numPages, 2);

      for(let i=1; i<=paginas; i++){
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        texto += content.items.map(x=>x.str).join(' ');
        texto += '\n';
      }

      if(texto.trim().length >= 80){
        return texto;
      }

      SOLUM.engine.log('PDF sem texto. Iniciando OCR: ' + file.name, 'info');

      const textoOCR = await this.ocrPDF(pdf);

      SOLUM.engine.log('OCR finalizado: ' + file.name, 'ok');

      return textoOCR;
    },

    async ocrPDF(pdf){
      if(!window.Tesseract){
        throw new Error('Tesseract não carregado.');
      }

      let textoFinal = '';
      const paginas = Math.min(pdf.numPages, 2);

      for(let i=1; i<=paginas; i++){
        const page = await pdf.getPage(i);

        const viewport = page.getViewport({
          scale: 2.5
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport
        }).promise;

        SOLUM.engine.log('OCR página ' + i + '...', 'info');

        const resultado = await Tesseract.recognize(
          canvas,
          'por',
          {
            logger: m=>{
              if(m.status === 'recognizing text'){
                const p = Math.round((m.progress || 0) * 100);
                console.log('OCR ' + p + '%');
              }
            }
          }
        );

        textoFinal += resultado.data.text + '\n';
      }

      return textoFinal;
    }

  };

  SOLUM.pdf = PDFReader;
})();
