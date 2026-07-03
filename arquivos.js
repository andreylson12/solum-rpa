(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.arquivos) return;

  const Arquivos = {
    escolher(){
      return new Promise(resolve=>{
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.xml,.xlsx,.xls,.xlsm,.csv,.pdf,image/*';
        input.onchange = ()=>resolve([...input.files]);
        input.click();
      });
    },

    async carregar(){
      SOLUM.engine.log('Selecionando arquivos...', 'info');

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
        const info = await SOLUM.classificador.classificar(file);

        if(resultado[info.tipo] === null){
          resultado[info.tipo] = file;
          SOLUM.engine.log(`${info.tipo.toUpperCase()} identificado: ${file.name} (${info.metodo})`, 'ok');
        }else{
          resultado.extras.push(file);
          SOLUM.engine.log(`Arquivo extra: ${file.name}`, 'info');
        }
      }

      SOLUM.engine.estado.arquivos = resultado;
      SOLUM.engine.emitir('arquivos', resultado);
      SOLUM.engine.log('Classificação dos arquivos finalizada.', 'ok');

      return resultado;
    }
  };

  SOLUM.arquivos = Arquivos;
})();
