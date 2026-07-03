(function(){
  if(window.SolumEngine) return;

  const Engine = {
    versao: '0.1.0',

    estado: {
      etapa: 'inicial',
      arquivos: {},
      dados: {},
      erros: []
    },

    logs: [],
    eventos: {},

    log(mensagem, tipo='info'){
      const item = {
        hora: new Date().toLocaleTimeString(),
        tipo,
        mensagem
      };

      this.logs.push(item);
      console.log(`🤖 SOLUM RPA [${tipo}]`, mensagem);

      this.emitir('log', item);
      return item;
    },

    setEstado(chave, valor){
      this.estado[chave] = valor;
      this.emitir('estado', this.estado);
      this.log(`Estado atualizado: ${chave}`, 'ok');
    },

    getEstado(chave){
      return this.estado[chave];
    },

    on(evento, callback){
      if(!this.eventos[evento]) this.eventos[evento] = [];
      this.eventos[evento].push(callback);
    },

    emitir(evento, dados){
      const lista = this.eventos[evento] || [];
      lista.forEach(fn=>{
        try{
          fn(dados);
        }catch(e){
          console.error('Erro em evento:', evento, e);
        }
      });
    },

    iniciar(){
      this.log('Engine iniciado.', 'ok');
      this.setEstado('etapa', 'engine_iniciado');
    }
  };

  window.SolumEngine = Engine;
})();
