(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.pipeline) return;

  const Pipeline = {
    etapas: [],

    registrar(nome, fn){
      this.etapas.push({ nome, fn });
    },

    async executar(){
      SOLUM.engine.log('Pipeline iniciado.', 'info');

      for(const etapa of this.etapas){
        try{
          SOLUM.engine.log('Executando etapa: ' + etapa.nome, 'info');
          await etapa.fn();
          SOLUM.engine.log('Etapa concluída: ' + etapa.nome, 'ok');
        }catch(e){
          SOLUM.engine.log('Erro na etapa ' + etapa.nome + ': ' + e.message, 'erro');
          throw e;
        }
      }

      SOLUM.engine.log('Pipeline finalizado.', 'ok');
    }
  };

  SOLUM.pipeline = Pipeline;
})();
