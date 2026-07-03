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

      return texto;
    }
  };

  SOLUM.pdf = PDFReader;
})();
