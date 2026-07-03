(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.classificador) return;

  const Classificador = {
    normalizar(t){
      return String(t||'')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g,'')
        .replace(/\s+/g,' ')
        .trim();
    },

    async classificar(file){
      const nome = file.name.toLowerCase();

      if(nome.endsWith('.xml')) return {tipo:'xml', confianca:100, metodo:'extensao'};
      if(nome.endsWith('.xlsx') || nome.endsWith('.xls') || nome.endsWith('.xlsm') || nome.endsWith('.csv')){
        return {tipo:'planilha', confianca:100, metodo:'extensao'};
      }

      if(!nome.endsWith('.pdf')){
        return {tipo:'desconhecido', confianca:0, metodo:'desconhecido'};
      }

      let texto = '';
      try{
        texto = await SOLUM.pdf.ler(file);
      }catch(e){
        SOLUM.engine.log('Não consegui ler PDF: ' + file.name, 'erro');
      }

      const t = this.normalizar(texto + ' ' + nome);

      if(t.includes('UMIDADE') || t.includes('IMPUREZAS') || t.includes('CLASSIFICACAO')){
        return {tipo:'laudo', confianca:95, metodo:'conteudo'};
      }

      if(t.includes('PESO BRUTO') || t.includes('PESO LIQUIDO') || t.includes('PESAGEM') || t.includes('BALANCA')){
        return {tipo:'pesagem', confianca:95, metodo:'conteudo'};
      }

      if(t.includes('MOTORISTA') || t.includes('TRANSPORTADORA') || t.includes('CAVALO') || t.includes('ORDEM DE CARREGAMENTO')){
        return {tipo:'ordem', confianca:90, metodo:'conteudo'};
      }

      return {tipo:'ordem', confianca:50, metodo:'fallback'};
    }
  };

  SOLUM.classificador = Classificador;
})();
