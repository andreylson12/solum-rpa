(function(){
  if(window.SOLUM && window.SOLUM.loader) return;

  window.SOLUM = window.SOLUM || {};
  window.SOLUM_VERSAO = "0.1.0";

  const Loader = {
    base:null,
    carregar:null,

    async boot(config){
      this.base = config.base;
      this.carregar = config.carregar;

      await this.carregar('engine.js');
      await this.carregar('core/registry.js');
      await this.carregar('core/processo.js');

      SOLUM.engine.iniciar();
      SOLUM.engine.log('Loader iniciado.', 'ok');

      await this.carregar('config/primeira-tela.js');
      await this.carregar('ui.js');
      await this.carregar('classificador.js');
      await this.carregar('arquivos.js');
      await this.carregar('pdf-reader.js');
      await this.carregar('parsers/parser-manager.js');
      await this.carregar('parsers/futuro.js');
      await this.carregar('validators/ordem-validator.js');
      await this.carregar('solum/actions.js');
      await this.carregar('solum/inspector.js');
      await this.carregar('solum/preenchimento.js');
      await this.carregar('tickets/ticket-downloader.js');
      await this.carregar('solum/primeira-tela.js');
      await this.carregar('readers/xlsx-reader.js');

      await this.carregarPDFJS();

      SOLUM.ui.iniciar();

      SOLUM.engine.log('SOLUM RPA pronto para uso.', 'ok');
    },

    async carregarPDFJS(){
      if(window.pdfjsLib){
        SOLUM.engine.log('PDF.js já estava carregado.', 'ok');
        return;
      }

      const url = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      const codigo = await fetch(url).then(r=>r.text());
      eval(codigo);

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

      SOLUM.engine.log('PDF.js carregado.', 'ok');
    }
  };

  SOLUM.loader = Loader;
})();
