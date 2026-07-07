(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.notaFiscal) return;

  const NotaFiscal = {

    async executar(){
      const xml = SOLUM.context?.dados?.xml || SOLUM.engine.estado.dados.xml || {};
      const planilha = SOLUM.context?.dados?.planilha || SOLUM.engine.estado.dados.planilha || {};

      if(!xml.chave){
        alert('XML da nota fiscal não foi lido.');
        SOLUM.engine.log('XML da NF não encontrado.', 'erro');
        return false;
      }

      const bpProdutor = this.obterBPProdutor(planilha);

      if(!bpProdutor){
        throw new Error('BP do produtor não encontrado na planilha.');
      }

      SOLUM.engine.log('Iniciando Nota Fiscal: NF ' + xml.numero, 'info');
      SOLUM.engine.log('Produtor será pesquisado pelo BP: ' + bpProdutor, 'info');

      await this.abrirNovaNotaFiscal();

      await SOLUM.select.selecionarProdutor(bpProdutor);

      await SOLUM.select.selecionarFazendaPorIE(xml.inscricaoEstadual);

      await SOLUM.select.selecionarModelo55();

      await this.preencherChave(xml.chave);

      await this.consultarChave();

      SOLUM.engine.log('Consulta da NF finalizada.', 'ok');

      await this.salvar();

      await this.confirmarSalvarNota();

      await this.confirmarPesoValor(xml);

      SOLUM.engine.log('Nota Fiscal salva e confirmada.', 'ok');

      return true;
    },

    obterBPProdutor(planilha){
      return String(
        planilha.bp ||
        planilha.primeiro?.bp ||
        planilha.resultados?.[0]?.bp ||
        ''
      ).trim();
    },

    async abrirNovaNotaFiscal(){
      if(this.telaNFAberta()){
        SOLUM.engine.log('Tela Nova Nota Fiscal já está aberta.', 'ok');
        return true;
      }

      const botao = [...document.querySelectorAll('button')]
        .filter(b => b.offsetParent !== null)
        .filter(b => !b.closest('#solum-rpa'))
        .find(b => this.normalizar(b.innerText || b.textContent) === 'NOVA NOTA FISCAL');

      if(!botao){
        throw new Error('Botão Nova Nota Fiscal não encontrado.');
      }

      botao.scrollIntoView({block:'center'});
      botao.dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));
      botao.dispatchEvent(new MouseEvent('mouseup', {bubbles:true}));
      botao.click();

      SOLUM.engine.log('Clique em Nova Nota Fiscal.', 'ok');

      await this.esperarTelaNF();

      SOLUM.engine.log('Nova Nota Fiscal aberta.', 'ok');

      return true;
    },

    telaNFAberta(){
      return !!(
        document.querySelector('#fazenda') &&
        document.querySelector('#modeloNFId') &&
        document.querySelector('#chave')
      );
    },

    async esperarTelaNF(tempo=15000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        if(this.telaNFAberta()){
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

      await this.setValor(campo, chave);

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

    async salvar(){
      const botao = await this.esperarBotaoTexto('SALVAR', 10000);

      if(!botao){
        throw new Error('Botão Salvar da NF não encontrado.');
      }

      botao.click();

      SOLUM.engine.log('Salvar NF clicado.', 'ok');

      await SOLUM.actions.esperar(1000);
    },

    async confirmarSalvarNota(){
      const sim = await this.esperarBotaoTexto('SIM', 10000);

      if(!sim){
        throw new Error('Botão SIM da confirmação da NF não encontrado.');
      }

      sim.click();

      SOLUM.engine.log('Confirmação SIM clicada.', 'ok');

      await SOLUM.actions.esperar(1000);
    },

    async confirmarPesoValor(xml){
  const campos = await this.esperarCamposConfirmacaoPesoValor();

  const peso =
    this.formatarPeso(xml.peso || document.querySelector('#pesoNF')?.value);

  const valor =
    this.formatarValor(xml.valorTotal || document.querySelector('#valorTotal')?.value);

  await this.setValor(campos.peso, peso);
  await this.setValor(campos.valor, valor);

  SOLUM.engine.log('Peso da confirmação preenchido: ' + peso, 'ok');
  SOLUM.engine.log('Valor da confirmação preenchido: ' + valor, 'ok');

  const confirmar = [...document.querySelectorAll('button')]
    .filter(b => b.offsetParent !== null)
    .filter(b => !b.closest('#solum-rpa'))
    .find(b => this.normalizar(b.innerText || b.textContent).includes('CONFIRMAR'));

  if(!confirmar){
    throw new Error('Botão Confirmar não encontrado.');
  }

  confirmar.click();

  SOLUM.engine.log('Confirmar peso/valor clicado.', 'ok');

  await SOLUM.actions.esperar(1500);

  return true;

    },

    async esperarCamposConfirmacaoPesoValor(tempo=15000){
  const inicio = Date.now();

  while(Date.now() - inicio < tempo){
    const inputs = [...document.querySelectorAll('input')]
      .filter(i => i.offsetParent !== null);

    const peso = inputs.find(i =>
      String(i.id || '').toLowerCase().includes('confirmacaopeso') ||
      String(i.id || '').toLowerCase().includes('confirmacaopesonf') ||
      String(i.placeholder || '').toLowerCase().includes('peso')
    );

    const valor = inputs.find(i =>
      String(i.id || '').toLowerCase().includes('confirmacaovalor') ||
      String(i.placeholder || '').toLowerCase().includes('valor')
    );

    if(peso && valor){
      return {peso, valor};
    }

    await SOLUM.actions.esperar(300);
  }

  throw new Error('Campos de confirmação Peso/Valor não encontrados.');
},

    async esperarModalPesoValor(tempo=15000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const modais = [...document.querySelectorAll('div')]
          .filter(d => d.offsetParent !== null)
          .filter(d => {
            const txt = this.normalizar(d.innerText || d.textContent || '');
            return txt.includes('CONFIRMACAO DE VALORES') &&
                   txt.includes('PESO') &&
                   txt.includes('VALOR') &&
                   txt.includes('CONFIRMAR');
          });

        if(modais.length){
          return modais[0];
        }

        await SOLUM.actions.esperar(300);
      }

      throw new Error('Janela de confirmação de peso/valor não apareceu.');
    },

    async esperarBotaoTexto(texto, tempo=10000){
      const alvo = this.normalizar(texto);
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const botao = [...document.querySelectorAll('button')]
          .filter(b => b.offsetParent !== null)
          .filter(b => !b.closest('#solum-rpa'))
          .find(b => {
            const t = this.normalizar(b.innerText || b.textContent || '');
            return t === alvo || t.includes(alvo);
          });

        if(botao) return botao;

        await SOLUM.actions.esperar(300);
      }

      return null;
    },

    async setValor(campo, valor){
      campo.scrollIntoView({block:'center'});
      campo.focus();
      campo.click();

      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if(setter){
        setter.call(campo, '');
      }else{
        campo.value = '';
      }

      campo.dispatchEvent(new Event('input', {bubbles:true}));

      if(setter){
        setter.call(campo, String(valor || ''));
      }else{
        campo.value = String(valor || '');
      }

      campo.dispatchEvent(new InputEvent('input', {
        bubbles:true,
        inputType:'insertText',
        data:String(valor || '')
      }));

      campo.dispatchEvent(new Event('change', {bubbles:true}));
      campo.dispatchEvent(new Event('blur', {bubbles:true}));

      await SOLUM.actions.esperar(300);
    },

    formatarPeso(peso){
      let p = String(peso || '').trim();

      if(!p) return '';

      p = p.replace(',', '.');

      const n = Number(p);

      if(!isNaN(n)){
        return String(n).replace('.', ',');
      }

      return p;
    },

    formatarValor(valor){
      let v = String(valor || '').trim();

      if(!v) return '';

      v = v.replace(',', '.');

      const n = Number(v);

      if(!isNaN(n)){
        return n.toFixed(2).replace('.', ',');
      }

      return v;
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
