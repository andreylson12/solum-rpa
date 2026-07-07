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
      SOLUM.engine.log('Produtor pelo BP: ' + bpProdutor, 'info');

      await this.abrirNovaNotaFiscal();

      await SOLUM.select.selecionarProdutor(bpProdutor);
      await SOLUM.select.selecionarFazendaPorIE(xml.inscricaoEstadual);
      await SOLUM.select.selecionarModelo55();

      await this.preencherChave(xml.chave);
      await this.consultarChave();

      SOLUM.engine.log('Consulta da NF finalizada.', 'ok');

      await this.salvar();

      const abriuPesoValor = await this.tentarConfirmarPesoValor(xml);

      if(!abriuPesoValor){
        SOLUM.engine.log('Modal de peso/valor não abriu. Indo para confirmação final.', 'info');
      }

      await this.confirmarSalvarNota();

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
        if(this.telaNFAberta()) return true;
        await SOLUM.actions.esperar(300);
      }

      throw new Error('Tela Nova Nota Fiscal não abriu.');
    },

    async preencherChave(chave){
      const campo = document.querySelector('#chave');
      if(!campo) throw new Error('Campo Chave da NF não encontrado.');

      await this.setValor(campo, chave);
      SOLUM.engine.log('Chave preenchida.', 'ok');
    },

    async consultarChave(){
      const campo = document.querySelector('#chave');
      if(!campo) throw new Error('Campo Chave não encontrado.');

      const container = campo.parentElement;

      const lupa =
        container.querySelector('button') ||
        container.querySelector('i')?.closest('button') ||
        campo.closest('div')?.querySelector('button, i, span');

      if(!lupa) throw new Error('Lupa da chave não encontrada.');

      lupa.click();

      SOLUM.engine.log('Lupa da chave clicada.', 'ok');

      await SOLUM.actions.esperar(3000);
    },

    async salvar(){
      const botao = await this.esperarBotaoTexto('SALVAR', 10000);
      if(!botao) throw new Error('Botão Salvar da NF não encontrado.');

      botao.click();

      SOLUM.engine.log('Salvar NF clicado.', 'ok');

      await SOLUM.actions.esperar(1000);
    },

    async tentarConfirmarPesoValor(xml){
      try{
        await this.confirmarPesoValor(xml);
        return true;
      }catch(e){
        SOLUM.engine.log(e.message, 'info');
        return false;
      }
    },

    async confirmarPesoValor(xml){
      const modal = await this.esperarModalConfirmacaoValores();

      const inputs = [...modal.querySelectorAll('input')]
        .filter(i => i.offsetParent !== null);

      const campoPeso = inputs[0];
      const campoValor = inputs[1];

      if(!campoPeso || !campoValor){
        throw new Error('Campos Peso/Valor do modal não encontrados.');
      }

      const peso = this.obterPesoCorreto(xml);
      const valor = this.obterValorCorreto(xml);

      if(!peso) throw new Error('Peso da NF não encontrado para confirmação.');
      if(!valor) throw new Error('Valor da NF não encontrado para confirmação.');

      await this.setValor(campoPeso, peso);
      await this.setValor(campoValor, valor);

      SOLUM.engine.log('Peso do modal preenchido: ' + campoPeso.value, 'ok');
      SOLUM.engine.log('Valor do modal preenchido: ' + campoValor.value, 'ok');

      const confirmar = [...modal.querySelectorAll('button')]
        .filter(b => b.offsetParent !== null)
        .find(b => this.normalizar(b.innerText || b.textContent).includes('CONFIRMAR'));

      if(!confirmar){
        throw new Error('Botão Confirmar do modal não encontrado.');
      }

      confirmar.click();

      SOLUM.engine.log('Confirmar peso/valor clicado.', 'ok');

      await SOLUM.actions.esperar(1500);

      return true;
    },

    async esperarModalConfirmacaoValores(tempo=15000){
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

      throw new Error('Modal de Confirmação de Valores não apareceu.');
    },

    obterPesoCorreto(xml){
      const campoTela = document.querySelector('#pesoNF');
      const pesoTela = String(campoTela?.value || '').trim();

      if(pesoTela){
        return this.limparPeso(pesoTela);
      }

      return this.limparPeso(xml.peso);
    },

    obterValorCorreto(xml){
      const campoTela = document.querySelector('#valorTotal');
      const valorTela = String(campoTela?.value || '').trim();

      if(valorTela && valorTela !== 'R$ 0,00'){
        return this.limparValor(valorTela);
      }

      return this.limparValor(xml.valorTotal);
    },

    limparPeso(peso){
      return String(peso || '')
        .replace(/[^\d.,]/g, '')
        .trim();
    },

    limparValor(valor){
      let v = String(valor || '')
        .replace(/[^\d.,]/g, '')
        .trim();

      if(!v) return '';

      if(v.includes(',') && v.includes('.')){
        return v;
      }

      if(v.includes('.') && !v.includes(',')){
        const n = Number(v);
        if(!isNaN(n)){
          return n.toFixed(2).replace('.', ',');
        }
      }

      return v;
    },

    async confirmarSalvarNota(){
      const inicio = Date.now();

      while(Date.now() - inicio < 15000){
        const botoes = [...document.querySelectorAll('button, a, span, div')]
          .filter(e => e.offsetParent !== null)
          .filter(e => !e.closest('#solum-rpa'));

        const sim = botoes.find(e => {
          const txt = this.normalizar(e.innerText || e.textContent || '');
          return txt === 'SIM';
        });

        if(sim){
          const clicavel = sim.closest('button,a') || sim;

          clicavel.click();

          SOLUM.engine.log('Confirmação final SIM clicada.', 'ok');

          await SOLUM.actions.esperar(1500);
          return true;
        }

        await SOLUM.actions.esperar(300);
      }

      SOLUM.engine.log('Confirmação final SIM não apareceu.', 'info');
      return false;
    },

    async esperarBotaoTexto(texto, tempo=10000){
      const alvo = this.normalizar(texto);
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const botao = [...document.querySelectorAll('button, a, span, div')]
          .filter(b => b.offsetParent !== null)
          .filter(b => !b.closest('#solum-rpa'))
          .find(b => {
            const t = this.normalizar(b.innerText || b.textContent || '');
            return t === alvo || t.includes(alvo);
          });

        if(botao){
          return botao.closest('button,a') || botao;
        }

        await SOLUM.actions.esperar(300);
      }

      return null;
    },

    async setValor(campo, valor){
      campo.scrollIntoView({block:'center'});
      campo.focus();
      campo.click();

      const texto = String(valor || '');

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
      campo.dispatchEvent(new Event('change', {bubbles:true}));

      await SOLUM.actions.esperar(100);

      if(setter){
        setter.call(campo, texto);
      }else{
        campo.value = texto;
      }

      campo.dispatchEvent(new InputEvent('input', {
        bubbles:true,
        inputType:'insertText',
        data:texto
      }));

      campo.dispatchEvent(new Event('change', {bubbles:true}));
      campo.dispatchEvent(new Event('blur', {bubbles:true}));

      await SOLUM.actions.esperar(300);
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
