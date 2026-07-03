(function(){
  if(window.SolumArquivos) return;

  const Arquivos = {
    escolher(){
      return new Promise(resolve=>{
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.xml,.xlsx,.xls,.xlsm,.csv,.pdf,image/*';
        input.onchange = () => resolve([...input.files]);
        input.click();
      });
    },

    classificar(file){
      const nome = file.name.toLowerCase();

      if(nome.endsWith('.xml')){
        return {tipo:'xml', confianca:100};
      }

      if(nome.endsWith('.xlsx') || nome.endsWith('.xls') || nome.endsWith('.xlsm') || nome.endsWith('.csv')){
        return {tipo:'planilha', confianca:100};
      }

      if(nome.includes('laudo') || nome.includes('classificacao') || nome.includes('classificação')){
        return {tipo:'laudo', confianca:90};
      }

      if(nome.includes('pesagem') || nome.includes('peso')){
        return {tipo:'pesagem', confianca:90};
      }

      return {tipo:'ordem', confianca:60};
    },

    async carregar(){
      SolumEngine.log('Selecionando arquivos...', 'info');

      const files = await this.escolher();

      const resultado = {
        xml:null,
        planilha:null,
        ordem:null,
        laudo:null,
        pesagem:null,
        extras:[]
      };

      for(const file of files){
        const info = await SolumClassificador.classificar(file);

        if(resultado[info.tipo] === null){
          resultado[info.tipo] = file;
          SolumEngine.log(`${info.tipo.toUpperCase()} identificado: ${file.name}`, 'ok');
        }else{
          resultado.extras.push(file);
          SolumEngine.log(`Arquivo extra: ${file.name}`, 'info');
        }
      }

      SolumEngine.estado.arquivos = resultado;
      SolumEngine.emitir('arquivos', resultado);

      SolumEngine.log('Classificação dos arquivos finalizada.', 'ok');

      return resultado;
    }
  };

  window.SolumArquivos = Arquivos;
})();
