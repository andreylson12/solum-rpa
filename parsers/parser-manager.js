(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.parsers) return;

  const ParserManager = {
    lista: [],

    registrar(parser){
      if(!parser || !parser.nome || typeof parser.identificar !== 'function' || typeof parser.extrair !== 'function'){
        throw new Error('Parser inválido.');
      }

      this.lista.push(parser);
      SOLUM.engine.log('Parser registrado: ' + parser.nome, 'ok');
    },

    identificar(texto){
      for(const parser of this.lista){
        try{
          if(parser.identificar(texto)){
            SOLUM.engine.log('Parser selecionado: ' + parser.nome, 'ok');
            return parser;
          }
        }catch(e){
          SOLUM.engine.log('Erro no parser ' + parser.nome, 'erro');
        }
      }

      SOLUM.engine.log('Nenhum parser específico encontrado. Usando genérico.', 'info');
      return null;
    },

    extrair(texto){
      const parser = this.identificar(texto);

      if(parser){
        return parser.extrair(texto);
      }

      return {
        transportadora: 'NÃO IDENTIFICADA',
        motorista: '',
        cpfMotorista: '',
        placaCavalo: '',
        placaCarreta1: '',
        placaCarreta2: '',
        uf: '',
        tipoVeiculo: '',
        textoOriginal: texto
      };
    }
  };

  SOLUM.parsers = ParserManager;
})();
