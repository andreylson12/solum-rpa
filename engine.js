(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.engine) return;

  const Engine = {
    versao:'0.1.0',

    estado:{
      etapa:'inicial',
      arquivos:{},
      dados:{},
      erros:[]
    },

    logs:[],
    eventos:{},

    iniciar(){
      this.log('Engine iniciado.', 'ok');
      this.setEstado('etapa','engine_iniciado');
    },

    log(mensagem,tipo='info'){
      const item = {
        hora:new Date().toLocaleTimeString(),
        tipo,
        mensagem
      };

      this.logs.push(item);
      console.log(`🤖 SOLUM RPA [${tipo}]`, mensagem);
      this.emitir('log', item);
      return item;
    },

    setEstado(chave,valor){
      this.estado[chave] = valor;
      this.emitir('estado', this.estado);
    },

    getEstado(chave){
      return this.estado[chave];
    },

    on(evento,callback){
      if(!this.eventos[evento]) this.eventos[evento] = [];
      this.eventos[evento].push(callback);
    },

    emitir(evento,dados){
      (this.eventos[evento] || []).forEach(fn=>{
        try{ fn(dados); }
        catch(e){ console.error('Erro no evento:', evento, e); }
      });
    },

    async executar(acao, payload){
      if(acao === 'carregarArquivos'){
        return await SOLUM.arquivos.carregar();
      }

      if(acao === 'baixarArquivosTicket'){
  return await SOLUM.ticketDownloader.baixarTodos();
}

      throw new Error('Ação não registrada: ' + acao);
    }
  };

  SOLUM.engine = Engine;
})();
