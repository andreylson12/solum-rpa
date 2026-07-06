(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.pipeline) return;

  const Pipeline = {
    async executar(){
      SOLUM.engine.log('🚀 Iniciando troca de nota...', 'info');

      const validacao = SOLUM.context?.validacao?.ordem || SOLUM.engine.estado.validacaoOrdem;

      if(!validacao || !validacao.valido){
        alert('A ordem ainda não está validada. Carregue os arquivos primeiro.');
        SOLUM.engine.log('Pipeline bloqueado: ordem não validada.', 'erro');
        return false;
      }

      await SOLUM.primeiraTela.executar();

      await SOLUM.enderecoRemessa.executar();

      SOLUM.engine.log('✅ Primeira tela concluída.', 'ok');

      await SOLUM.ticket.gerar();

      SOLUM.engine.log('✅ Ticket gerado/confirmado.', 'ok');

      return true;
    }
  };

  SOLUM.pipeline = Pipeline;
})();
