(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.context) return;

  SOLUM.context = {
    ticket:{},
    arquivos:{},
    textos:{},

    dados:{
      xml:{},
      planilha:{},
      ordem:{},
      laudo:{},
      pesagem:{}
    },

    validacao:{
      ordem:null,
      geral:null
    },

    reset(){
      this.ticket = {};
      this.arquivos = {};
      this.textos = {};
      this.dados = {
        xml:{},
        planilha:{},
        ordem:{},
        laudo:{},
        pesagem:{}
      };
      this.validacao = {
        ordem:null,
        geral:null
      };
    }
  };
})();
