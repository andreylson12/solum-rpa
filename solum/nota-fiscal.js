(function(){
  window.SOLUM = window.SOLUM || {};

  delete SOLUM.notaFiscal;

  const NotaFiscal = {

    executando:false,

    async executar(){
      if(this.executando){
        SOLUM.engine?.log?.('Nota Fiscal já está em execução. Aguarde finalizar.', 'info');
        return false;
      }

      this.executando = true;

      try{
        const xml =
          SOLUM.context?.dados?.xml ||
          SOLUM.engine?.estado?.dados?.xml ||
          {};

        const planilha =
          SOLUM.context?.dados?.planilha ||
          SOLUM.engine?.estado?.dados?.planilha ||
          {};

        if(!xml.chave){
          alert('XML da nota fiscal não foi lido.');
          SOLUM.engine?.log?.('XML da NF não encontrado.', 'erro');
          return false;
        }

        const bpProdutor = this.obterBPProdutor(planilha);
        if(!bpProdutor) throw new Error('BP do produtor não encontrado na planilha.');

        const ieProdutor =
          xml.inscricaoEstadual ||
          xml.ie ||
          xml.ieProdutor ||
          xml.inscricao ||
          '';

        SOLUM.engine?.log?.('Iniciando Nota Fiscal: NF ' + (xml.numero || xml.nf || ''), 'info');
        SOLUM.engine?.log?.('Produtor pelo BP: ' + bpProdutor, 'info');
        SOLUM.engine?.log?.('IE produtor usada: ' + ieProdutor, 'info');

        await this.abrirNovaNotaFiscal();
        await this.validarDependencias();

        await SOLUM.select.selecionarProdutor(bpProdutor);

        if(ieProdutor){
          await SOLUM.select.selecionarFazendaPorIE(ieProdutor);
        }else{
          SOLUM.engine?.log?.('IE do produtor não encontrada no XML.', 'erro');
        }

        await SOLUM.select.selecionarModelo55();

        await this.preencherChave(xml.chave);
        await this.consultarChaveComDuploClique();
        await this.esperarNotaCarregada();

        await this.salvar();
        await this.confirmarPesoValor(xml);
        await this.confirmarSalvarNota();

        SOLUM.engine?.log?.('Nota Fiscal salva e confirmada.', 'ok');
        return true;

      }catch(e){
        SOLUM.engine?.log?.('Erro na Nota Fiscal: ' + e.message, 'erro');
        console.error('Erro Nota Fiscal:', e);
        throw e;

      }finally{
        this.executando = false;
      }
    },

    async validarDependencias(){
      if(!SOLUM.actions?.esperar) throw new Error('Função SOLUM.actions.esperar não encontrada.');
      if(!SOLUM.select?.selecionarProdutor) throw new Error('Função SOLUM.select.selecionarProdutor não encontrada.');
      if(!SOLUM.select?.selecionarFazendaPorIE) throw new Error('Função SOLUM.select.selecionarFazendaPorIE não encontrada.');
      if(!SOLUM.select?.selecionarModelo55) throw new Error('Função SOLUM.select.selecionarModelo55 não encontrada.');
    },

    obterBPProdutor(planilha){
      return String(
        planilha.bp ||
        planilha.bpProdutor ||
        planilha.primeiro?.bp ||
        planilha.resultados?.[0]?.bp ||
        ''
      ).trim();
    },

    async abrirNovaNotaFiscal(){
      if(this.telaNFAberta()){
        SOLUM.engine?.log?.('Tela Nova Nota Fiscal já está aberta.', 'ok');
        return true;
      }

      const botao = [...document.querySelectorAll('button, a, span, div')]
        .filter(b => b.offsetParent !== null)
        .filter(b => !b.closest('#solum-rpa'))
        .find(b => {
          const txt = this.normalizar(b.innerText || b.textContent || '');
          return txt === 'NOVA NOTA FISCAL' || txt.includes('NOVA NOTA FISCAL');
        });

      if(!botao) throw new Error('Botão Nova Nota Fiscal não encontrado.');

      await this.cliqueReal(botao.closest('button,a') || botao);
      SOLUM.engine?.log?.('Clique em Nova Nota Fiscal.', 'ok');

      const ok = await this.esperar(() => this.telaNFAberta(), 15000);
      if(!ok) throw new Error('Tela Nova Nota Fiscal não abriu.');

      SOLUM.engine?.log?.('Nova Nota Fiscal aberta.', 'ok');
      return true;
    },

    telaNFAberta(){
      return !!(
        document.querySelector('#fazenda') &&
        document.querySelector('#modeloNFId') &&
        document.querySelector('#chave')
      );
    },

    async preencherChave(chave){
      const campo = document.querySelector('#chave');
      if(!campo) throw new Error('Campo Chave da NF não encontrado.');

      await this.setValor(campo, chave);
      SOLUM.engine?.log?.('Chave preenchida: ' + chave, 'ok');
    },

    async consultarChaveComDuploClique(){
      const campo = document.querySelector('#chave');
      if(!campo) throw new Error('Campo Chave não encontrado.');

      const container =
        campo.closest('.input-group') ||
        campo.closest('div') ||
        campo.parentElement;

      let lupa =
        container?.querySelector('button') ||
        container?.querySelector('i')?.closest('button') ||
        container?.querySelector('button, i, span, a');

      if(!lupa){
        lupa = [...document.querySelectorAll('button, a, i, span')]
          .filter(e => e.offsetParent !== null)
          .find(e => {
            const txt = this.normalizar(e.innerText || e.textContent || '');
            const title = this.normalizar(e.getAttribute?.('title') || '');
            const cls = String(e.className || '').toLowerCase();

            return (
              txt.includes('CONSULTAR') ||
              title.includes('CONSULTAR') ||
              title.includes('PESQUISAR') ||
              cls.includes('search') ||
              cls.includes('lupa') ||
              cls.includes('fa-search')
            );
          });
      }

      if(!lupa) throw new Error('Lupa da chave não encontrada.');

      const alvo = lupa.closest('button,a') || lupa;

      await this.duploCliqueReal(alvo);

      SOLUM.engine?.log?.('Duplo clique na lupa da chave realizado.', 'ok');

      await SOLUM.actions.esperar(1500);
    },

    async esperarNotaCarregada(){
      const ok = await this.esperar(() => {
        const serie = document.querySelector('#serie')?.value?.trim();
        const numero = document.querySelector('#numeroNF')?.value?.trim();
        const peso = document.querySelector('#pesoNF')?.value?.trim();
        const valor = document.querySelector('#valorTotal')?.value?.trim();

        const carregouBasico = !!(serie && numero);

        const carregouPesoValor = !!(
          peso &&
          valor &&
          valor !== 'R$ 0,00' &&
          valor !== '0,00'
        );

        return carregouBasico && carregouPesoValor;
      }, 45000);

      const dadosDebug = this.obterDebugNF();
      SOLUM.engine?.log?.('Debug NF carregada: ' + JSON.stringify(dadosDebug), 'info');

      if(!ok){
        throw new Error('NF não carregou peso/valor após duplo clique na lupa. Ver debug no log.');
      }

      SOLUM.engine?.log?.('Dados principais da NF carregados.', 'ok');
      await SOLUM.actions.esperar(1000);
    },

    obterDebugNF(){
      return {
        serie: document.querySelector('#serie')?.value || '',
        numeroNF: document.querySelector('#numeroNF')?.value || '',
        pesoNF: document.querySelector('#pesoNF')?.value || '',
        valorTotal: document.querySelector('#valorTotal')?.value || '',
        emissao: document.querySelector('#emissao')?.value || '',
        cfopId: document.querySelector('#cfopId')?.value || '',
        chave: document.querySelector('#chave')?.value || ''
      };
    },

    async salvar(){
      const botao = await this.esperarBotaoTexto('SALVAR', 12000);
      if(!botao) throw new Error('Botão Salvar da NF não encontrado.');

      await this.cliqueReal(botao);
      SOLUM.engine?.log?.('Salvar NF clicado.', 'ok');

      const abriu = await this.esperar(() => this.modalConfirmacaoValores(), 15000);

      if(!abriu){
        throw new Error('Após salvar, a Confirmação de Valores não abriu.');
      }

      SOLUM.engine?.log?.('Confirmação de valores aberta.', 'ok');
    },

    async confirmarPesoValor(xml){
      const modal = this.modalConfirmacaoValores();
      if(!modal) throw new Error('Modal de Confirmação de Valores não encontrado.');

      const inputs = [...modal.querySelectorAll('input')]
        .filter(i => i.offsetParent !== null);

      const campoPeso = inputs[0];
      const campoValor = inputs[1];

      if(!campoPeso || !campoValor){
        throw new Error('Campos Peso/Valor do modal não encontrados.');
      }

      const peso = this.obterPesoCorreto(xml);
      const valor = this.obterValorCorreto(xml);

      if(!peso) throw new Error('Peso da NF não encontrado.');
      if(!valor) throw new Error('Valor da NF não encontrado.');

      await this.setValor(campoPeso, peso);
      await this.setValor(campoValor, valor);

      SOLUM.engine?.log?.('Peso do modal preenchido: ' + campoPeso.value, 'ok');
      SOLUM.engine?.log?.('Valor do modal preenchido: ' + campoValor.value, 'ok');

      const confirmar = [...modal.querySelectorAll('button, a, span, div')]
        .filter(b => b.offsetParent !== null)
        .find(b => this.normalizar(b.innerText || b.textContent).includes('CONFIRMAR'));

      if(!confirmar) throw new Error('Botão Confirmar do modal não encontrado.');

      await this.cliqueReal(confirmar.closest('button,a') || confirmar);
      SOLUM.engine?.log?.('Confirmar peso/valor clicado.', 'ok');

      await SOLUM.actions.esperar(1000);
    },

    modalConfirmacaoValores(){
      return [...document.querySelectorAll('div')]
        .filter(d => d.offsetParent !== null)
        .find(d => {
          const txt = this.normalizar(d.innerText || d.textContent || '');
          return txt.includes('CONFIRMACAO DE VALORES') &&
                 txt.includes('PESO') &&
                 txt.includes('VALOR') &&
                 txt.includes('CONFIRMAR');
        }) || null;
    },

    async confirmarSalvarNota(){
      const sim = await this.esperarElemento(() => {
        return [...document.querySelectorAll('button, a, span, div')]
          .filter(e => e.offsetParent !== null)
          .filter(e => !e.closest('#solum-rpa'))
          .find(e => this.normalizar(e.innerText || e.textContent || '') === 'SIM');
      }, 15000);

      if(!sim) throw new Error('Botão SIM final não apareceu.');

      await this.cliqueReal(sim.closest('button,a') || sim);
      SOLUM.engine?.log?.('Confirmação final SIM clicada.', 'ok');

      await SOLUM.actions.esperar(1500);
    },

    obterPesoCorreto(xml){
      const pesoTela = String(document.querySelector('#pesoNF')?.value || '').trim();
      if(pesoTela) return this.limparPeso(pesoTela);

      return this.limparPeso(
        xml.peso ||
        xml.pesoNF ||
        xml.pesoLiquido ||
        xml.quantidade ||
        ''
      );
    },

    obterValorCorreto(xml){
      const valorTela = String(document.querySelector('#valorTotal')?.value || '').trim();

      if(valorTela && valorTela !== 'R$ 0,00'){
        return this.limparValor(valorTela);
      }

      return this.limparValor(
        xml.valorTotal ||
        xml.valor ||
        xml.total ||
        xml.vNF ||
        ''
      );
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

      if(v.includes(',') && v.includes('.')) return v;

      if(v.includes('.') && !v.includes(',')){
        const n = Number(v);
        if(!isNaN(n)) return n.toFixed(2).replace('.', ',');
      }

      return v;
    },

    async esperarBotaoTexto(texto, tempo=10000){
      return await this.esperarElemento(() => {
        const alvo = this.normalizar(texto);

        const el = [...document.querySelectorAll('button, a, span, div')]
          .filter(b => b.offsetParent !== null)
          .filter(b => !b.closest('#solum-rpa'))
          .find(b => {
            const t = this.normalizar(b.innerText || b.textContent || '');
            return t === alvo || t.includes(alvo);
          });

        return el ? (el.closest('button,a') || el) : null;
      }, tempo);
    },

    async duploCliqueReal(el){
      if(!el) throw new Error('Elemento para duplo clique não informado.');

      await this.cliqueReal(el);
      await SOLUM.actions.esperar(220);
      await this.cliqueReal(el);

      try{
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;

        el.dispatchEvent(new MouseEvent('dblclick', {
          bubbles:true,
          cancelable:true,
          clientX:x,
          clientY:y
        }));
      }catch(e){}
    },

    async cliqueReal(el){
      if(!el) throw new Error('Elemento para clique não informado.');

      el.scrollIntoView({block:'center'});
      await SOLUM.actions.esperar(200);

      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;

      const alvo = document.elementFromPoint(x, y) || el;

      alvo.dispatchEvent(new MouseEvent('mouseover', {bubbles:true, clientX:x, clientY:y}));
      alvo.dispatchEvent(new MouseEvent('mousemove', {bubbles:true, clientX:x, clientY:y}));
      alvo.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true, clientX:x, clientY:y}));
      alvo.dispatchEvent(new MouseEvent('mouseup', {bubbles:true, cancelable:true, clientX:x, clientY:y}));
      alvo.click();

      await SOLUM.actions.esperar(700);
    },

    async setValor(campo, valor){
      if(!campo) throw new Error('Campo para preencher não informado.');

      campo.scrollIntoView({block:'center'});
      campo.focus();
      campo.click();

      const texto = String(valor || '');

      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if(setter) setter.call(campo, '');
      else campo.value = '';

      campo.dispatchEvent(new Event('input', {bubbles:true}));
      campo.dispatchEvent(new Event('change', {bubbles:true}));

      await SOLUM.actions.esperar(100);

      if(setter) setter.call(campo, texto);
      else campo.value = texto;

      campo.dispatchEvent(new InputEvent('input', {
        bubbles:true,
        inputType:'insertText',
        data:texto
      }));

      campo.dispatchEvent(new Event('change', {bubbles:true}));
      campo.dispatchEvent(new Event('blur', {bubbles:true}));

      await SOLUM.actions.esperar(300);
    },

    async esperar(condicao, tempo=10000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        try{
          if(condicao()) return true;
        }catch(e){}

        await SOLUM.actions.esperar(300);
      }

      return false;
    },

    async esperarElemento(busca, tempo=10000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        try{
          const el = busca();
          if(el) return el;
        }catch(e){}

        await SOLUM.actions.esperar(300);
      }

      return null;
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

  SOLUM.engine?.log?.('Módulo Nota Fiscal atualizado: produtor, fazenda, modelo, chave, duplo clique na lupa, salvar, peso e valor.', 'ok');
})();
