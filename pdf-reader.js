(function(){

if(window.SolumPDFReader) return;

const PDFReader = {
  async ler(file){
    if(!window.pdfjsLib){
      throw new Error("PDF.js não carregado.");
    }

    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: buffer
    }).promise;

    let texto = "";

    const paginas = Math.min(pdf.numPages, 2);

    for(let i = 1; i <= paginas; i++){
      const pagina = await pdf.getPage(i);
      const conteudo = await pagina.getTextContent();

      texto += conteudo.items
        .map(item => item.str)
        .join(" ");

      texto += "\n";
    }

    return texto;
  }
};

window.SolumPDFReader = PDFReader;

})();
