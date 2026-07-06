(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.enderecoRemessa) return;

  const EnderecoRemessa = {

    async executar(){
      const bp = this.obterBP();

      if(!bp){
        alert('BP Remessa não encontrado na planilha.');
        SOLUM.engine.log('BP Remessa não encontrado na planilha.', 'erro');
        return false;
      }

      SOLUM.engine.log('Iniciando Endereço de Remessa: ' + bp, 'info');

      await this.abrirLupa();

      const inputBusca = await this.localizarCampoPesquisa();

      await this.pesquisarBP(inputBusca, bp);

      const linha = await this.esperarLinhaBP(bp);

      await this.selecionarLinha(linha);

      SOLUM.engine.log('BP selecionado: ' + bp, 'ok');

      await SOLUM.actions.esperar(1000);

      return true;
    },

    obterBP(){
      const planilha =
        SOLUM.context?.dados?.planilha ||
        SOLUM.engine.estado.dados.planilha ||
        {};

      return String(
        planilha.bpRemessa ||
        planilha.primeiro?.bpRemessa ||
        ''
      ).trim();
    },

    async abrirLupa(){
      const campo = document.querySelector('#enderecoRemessa');

      if(!campo){
        throw new Error('Campo Endereço de Remessa não encontrado.');
      }

      const container = campo.parentElement;

      const lupa =
        container.querySelector('button') ||
        container.querySelector('i')?.closest('button') ||
        container.querySelector('span') ||
        campo.closest('div')?.querySelector('button, i, span');

      if(!lupa){
        throw new Error('Lupa do Endereço de Remessa não encontrada.');
      }

      lupa.click();

      SOLUM.engine.log('Lupa Endereço de Remessa aberta.', 'ok');

      await SOLUM.actions.esperar(800);
    },

    async localizarCampoPesquisa(){
      const inputs = [...document.querySelectorAll('input')]
        .filter(i => i.offsetParent !== null);

      const inputBusca =
        inputs.find(i => (i.placeholder || '').toUpperCase().includes('CÓDIGO')) ||
        inputs.find(i => (i.placeholder || '').toUpperCase().includes('CODIGO')) ||
        inputs.find(i => (i.placeholder || '').toUpperCase().includes('PESQUIS')) ||
        inputs.find(i => (i.placeholder || '').toUpperCase().includes('BUSC')) ||
        inputs[inputs.length - 1];

      if(!inputBusca){
        throw new Error('Campo de pesquisa do BP não encontrado.');
      }

      return inputBusca;
    },

    async pesquisarBP(input, bp){
      SOLUM.engine.log('Pesquisando BP sem espaço: ' + bp, 'info');

      await this.preencherCampo(input, bp);
      await SOLUM.actions.esperar(1200);

      let linha = await this.tentarEncontrarLinhaBP(bp);

      if(linha){
        SOLUM.engine.log('BP encontrado sem espaço.', 'ok');
        return true;
      }

      SOLUM.engine.log('BP não apareceu. Tentando com espaço...', 'info');

      await this.limparCampo(input);
      await this.preencherCampo(input, bp + ' ');
      await SOLUM.actions.esperar(1500);

      linha = await this.tentarEncontrarLinhaBP(bp);

      if(linha){
        SOLUM.engine.log('BP encontrado com espaço.', 'ok');
        return true;
      }

      throw new Error('Nenhum resultado encontrado para BP: ' + bp);
    },

    async preencherCampo(input, valor){
      input.focus();

      input.value = '';

      input.dispatchEvent(new Event('input', {bubbles:true}));

      input.value = valor;

      input.dispatchEvent(new InputEvent('input', {
        bubbles:true,
        inputType:'insertText',
        data:valor
      }));

      input.dispatchEvent(new KeyboardEvent('keyup', {
        bubbles:true,
        key:String(valor).slice(-1) || '0'
      }));

      input.dispatchEvent(new Event('change', {bubbles:true}));
    },

    async limparCampo(input){
      input.focus();

      input.value = '';

      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));

      await SOLUM.actions.esperar(300);
    },

    async tentarEncontrarLinhaBP(bp){
      const linhas = [...document.querySelectorAll('table tbody tr, table tr')]
        .filter(l => l.offsetParent !== null);

      return linhas.find(l => {
        const txt = (l.innerText || l.textContent || '').replace(/\s+/g, ' ');
        return txt.includes(bp);
      }) || null;
    },

    async esperarLinhaBP(bp, tempo=10000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const linha = await this.tentarEncontrarLinhaBP(bp);

        if(linha) return linha;

        await SOLUM.actions.esperar(300);
      }

      throw new Error('Nenhum resultado encontrado para BP: ' + bp);
    },

    async selecionarLinha(linha){
      const botao = this.buscarBotaoSelecionar(linha);

      if(botao){
        botao.click();
      }else{
        linha.click();
      }

      await SOLUM.actions.esperar(800);
    },

    buscarBotaoSelecionar(linha){
      const elementos = [...linha.querySelectorAll('button, a, i, span, input')]
        .filter(e => e.offsetParent !== null);

      const porTexto = elementos.find(e => {
        const txt = (
          e.innerText ||
          e.textContent ||
          e.title ||
          e.value ||
          ''
        ).toUpperCase();

        return txt.includes('SELECIONAR') || txt.includes('SELECT');
      });

      if(porTexto){
        return porTexto.closest('button,a') || porTexto;
      }

      return (
        linha.querySelector('button') ||
        linha.querySelector('a') ||
        linha.querySelector('input[type="radio"]') ||
        linha.querySelector('input[type="checkbox"]') ||
        elementos[0] ||
        null
      );
    }

  };

  SOLUM.enderecoRemessa = EnderecoRemessa;
})();
