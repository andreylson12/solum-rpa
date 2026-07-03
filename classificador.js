(function(){
  if(window.SolumClassificador) return;

  const Classificador = {
    porNome(file){
      const nome = file.name.toLowerCase();

      if(nome.endsWith('.xml')){
        return {tipo:'xml', confianca:100, metodo:'nome'};
      }

      if(nome.endsWith('.xlsx') || nome.endsWith('.xls') || nome.endsWith('.xlsm') || nome.endsWith('.csv')){
        return {tipo:'planilha', confianca:100, metodo:'nome'};
      }

      if(nome.includes('laudo') || nome.includes('classificacao') || nome.includes('classificação')){
        return {tipo:'laudo', confianca:90, metodo:'nome'};
      }

      if(nome.includes('pesagem') || nome.includes('balanca') || nome.includes('balança') || nome.includes('peso')){
        return {tipo:'pesagem', confianca:90, metodo:'nome'};
      }

      if(nome.includes('ordem') || nome.includes('oc') || nome.includes('carregamento')){
        return {tipo:'ordem', confianca:80, metodo:'nome'};
      }

      return {tipo:'desconhecido', confianca:0, metodo:'nome'};
    },

    async classificar(file){
      const r = this.porNome(file);

      if(r.tipo !== 'desconhecido'){
        return r;
      }

      return {tipo:'ordem', confianca:50, metodo:'fallback'};
    }
  };

  window.SolumClassificador = Classificador;
})();
