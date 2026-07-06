(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.enderecoRemessa) return;

  const EnderecoRemessa = {

    async executar(){
      const planilha = SOLUM.context?.dados?.planilha || SOLUM.engine.estado.dados.planilha || {};
      const bp = String(planilha.bpRemessa || planilha.primeiro?.bpRemessa || '').trim();

      if(!bp){
        alert('BP Remessa não encontrado na planilha.');
        SOLUM.engine.log('BP Remessa não encontrado na planilha.', 'erro');
        return false;
      }

      SOLUM.engine.log('Iniciando Endereço de Remessa: ' + bp, 'info');

      const campo = document.querySelector('#enderecoRemessa');
      if(!campo) throw new Error('Campo Endereço de Remessa não encontrado.');

      const container = campo.parentElement;

      const lupa =
        container.querySelector('button') ||
        container.querySelector('i')?.closest('button') ||
        container.querySelector('span') ||
        campo.closest('div')?.querySelector('button, i, span');

      if(!lupa) throw new Error('Lupa do Endereço de Remessa não encontrada.');

      lupa.click();
      SOLUM.engine.log('Lupa Endereço de Remessa aberta.', 'ok');

      await SOLUM.actions.esperar(800);

      const inputs = [...document.querySelectorAll('input')]
        .filter(i => i.offsetParent !== null);

      const inputBusca =
        inputs.find(i => (i.placeholder || '').toUpperCase().includes('CÓDIGO')) ||
        inputs.find(i => (i.placeholder || '').toUpperCase().includes('CODIGO')) ||
        inputs[inputs.length - 1];

      if(!inputBusca) throw new Error('Campo de pesquisa do BP não encontrado.');

      SOLUM.actions.setValor(inputBusca, bp + ' ');
      SOLUM.engine.log('BP pesquisado: ' + bp, 'ok');

      await SOLUM.actions.esperar(1500);

      const linha = await this.esperarLinhaBP(bp);

      const botaoSelecionar = this.buscarBotaoSelecionar(linha);

      if(botaoSelecionar){
        botaoSelecionar.click();
      }else{
        linha.click();
      }

      SOLUM.engine.log('BP selecionado: ' + bp, 'ok');

      await SOLUM.actions.esperar(1000);

      return true;
    },

    async esperarLinhaBP(bp, tempo=10000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const linhas = [...document.querySelectorAll('table tbody tr, table tr')]
          .filter(l => l.offsetParent !== null);

        const linha = linhas.find(l => {
          const txt = (l.innerText || l.textContent || '').replace(/\s+/g, ' ');
          return txt.includes(bp);
        });

        if(linha) return linha;

        await SOLUM.actions.esperar(300);
      }

      throw new Error('Nenhum resultado encontrado para BP: ' + bp);
    },

    buscarBotaoSelecionar(linha){
      const elementos = [...linha.querySelectorAll('button, a, i, span, input')]
        .filter(e => e.offsetParent !== null);

      const porTexto = elementos.find(e => {
        const txt = (e.innerText || e.textContent || e.title || e.value || '').toUpperCase();
        return txt.includes('SELECIONAR') || txt.includes('SELECT');
      });

      if(porTexto) return porTexto.closest('button,a') || porTexto;

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
