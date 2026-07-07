(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.notaFiscal) return;

  const NotaFiscal = {

    async executar(){
      const xml = SOLUM.context?.dados?.xml || SOLUM.engine.estado.dados.xml || {};

      if(!xml.chave){
        alert('XML da nota fiscal não foi lido.');
        SOLUM.engine.log('XML da NF não encontrado.', 'erro');
        return false;
      }

      SOLUM.engine.log('Iniciando Nota Fiscal: NF ' + xml.numero, 'info');

      await this.abrirNovaNotaFiscal();

      await SOLUM.select.selecionarProdutor(xml.cpfCnpj);

      await SOLUM.select.selecionarFazendaPorIE(xml.inscricaoEstadual);

      await SOLUM.select.selecionarModelo55();

      await this.preencherChave(xml.chave);

      await this.consultarChave();

      SOLUM.engine.log('Consulta da NF finalizada.', 'ok');

      return true;
    },

    async abrirNovaNotaFiscal(){
      if(this.telaNF aberta()){
        SOLUM.engine.log('Tela Nova Nota Fiscal já está aberta.', 'ok');
        return true;
      }

      const botao = [...document.querySelectorAll('button')]
        .filter(b => b.offsetParent !== null)
        .find(b => this.normalizar(b.innerText || b.textContent).includes('NOVA NOTA FISCAL'));

      if(!botao){
        throw new Error('Botão Nova Nota Fiscal não encontrado.');
      }

      botao.click();
      SOLUM.engine.log('Clique em Nova Nota Fiscal.', 'ok');

      await this.esperarTelaNF();
      SOLUM.engine.log('Nova Nota Fiscal aberta.', 'ok');

      return true;
    },

    telaNF aberta(){
      return !!(
        document.querySelector('#fazenda') &&
        document.querySelector('#modeloNFId') &&
        document.querySelector('#chave')
      );
    },

    async esperarTelaNF(tempo=15000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        if(this.telaNF aberta()){
          return true;
        }

        await SOLUM.actions.esperar(300);
      }

      throw new Error('Tela Nova Nota Fiscal não abriu.');
    },

    async preencherChave(chave){
      const campo = document.querySelector('#chave');

      if(!campo){
        throw new Error('Campo Chave da NF não encontrado.');
      }

      campo.focus();
      campo.value = '';

      campo.dispatchEvent(new Event('input', {bubbles:true}));

      campo.value = chave;

      campo.dispatchEvent(new InputEvent('input', {
        bubbles:true,
        inputType:'insertText',
        data:chave
      }));

      campo.dispatchEvent(new Event('change', {bubbles:true}));

      SOLUM.engine.log('Chave preenchida.', 'ok');

      await SOLUM.actions.esperar(500);
    },

    async consultarChave(){
      const campo = document.querySelector('#chave');

      if(!campo){
        throw new Error('Campo Chave não encontrado.');
      }

      const container = campo.parentElement;

      const lupa =
        container.querySelector('button') ||
        container.querySelector('i')?.closest('button') ||
        campo.closest('div')?.querySelector('button, i, span');

      if(!lupa){
        throw new Error('Lupa da chave não encontrada.');
      }

      lupa.click();

      SOLUM.engine.log('Lupa da chave clicada.', 'ok');

      await SOLUM.actions.esperar(2500);
    },

    normalizar(t){
      return String(t || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

  };

  SOLUM.notaFiscal = NotaFiscal;
})();
