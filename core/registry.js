(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.registry) return;

  const modulos = {};

  SOLUM.registry = {
    registrar(nome,obj){
      if(modulos[nome]) throw new Error('Módulo já registrado: ' + nome);
      modulos[nome] = obj;
      SOLUM.engine?.log?.('Módulo registrado: ' + nome, 'ok');
    },

    get(nome){
      if(!modulos[nome]) throw new Error('Módulo não encontrado: ' + nome);
      return modulos[nome];
    },

    listar(){
      return Object.keys(modulos);
    }
  };
})();
