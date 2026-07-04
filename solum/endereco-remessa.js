(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.enderecoRemessa) return;

  const EnderecoRemessa = {
    async executar(){
      const planilha = SOLUM.context?.dados?.planilha || SOLUM.engine.estado.dados.planilha || {};
      const bp = planilha.bpRemessa || planilha.enderecoRemessa || planilha.bp || '';

      if(!bp){
        alert('BP Remessa não encontrado na planilha.');
        SOLUM.engine.log('BP Remessa não encontrado na planilha.', 'erro');
        return false;
      }

      SOLUM.engine.log('Iniciando Endereço de Remessa: ' + bp, 'info');

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

      await SOLUM.actions.esperar(1000);

      const inputs = [...document.querySelectorAll('input')]
        .filter(i=>i.offsetParent !== null);

      const inputBusca = inputs.find(i=>{
        const p = (i.placeholder || '').toUpperCase();
        return p.includes('PESQUIS') || p.includes('BUSC') || p.includes('CÓDIGO') || p.includes('CODIGO');
      }) || inputs[inputs.length - 1];

      if(!inputBusca){
        throw new Error('Campo de pesquisa do BP não encontrado.');
      }

      SOLUM.actions.setValor(inputBusca, bp);
      SOLUM.engine.log('BP pesquisado: ' + bp, 'ok');

      await SOLUM.actions.esperar(800);

      const botoes = [...document.querySelectorAll('button, a')]
        .filter(b=>b.offsetParent !== null);

      const pesquisar = botoes.find(b=>{
        const t = (b.innerText || b.textContent || '').toUpperCase();
        return t.includes('PESQUISAR') || t.includes('BUSCAR') || t.includes('CONSULTAR');
      });

      if(pesquisar){
        pesquisar.click();
        SOLUM.engine.log('Pesquisa executada.', 'ok');
        await SOLUM.actions.esperar(1500);
      }

      const linhas = [...document.querySelectorAll('table tbody tr, table tr')]
        .filter(l=>l.offsetParent !== null && (l.innerText || '').includes(bp));

      if(!linhas.length){
        throw new Error('Nenhum resultado encontrado para BP: ' + bp);
      }

      const linha = linhas[0];

      const selecionar =
        linha.querySelector('button') ||
        linha.querySelector('a') ||
        linha.querySelector('input[type="radio"]') ||
        linha.querySelector('input[type="checkbox"]');

      if(selecionar){
        selecionar.click();
      }else{
        linha.click();
      }

      SOLUM.engine.log('BP selecionado: ' + bp, 'ok');
      await SOLUM.actions.esperar(800);

      return true;
    }
  };

  SOLUM.enderecoRemessa = EnderecoRemessa;
})();
