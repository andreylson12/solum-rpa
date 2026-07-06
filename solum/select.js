(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.select) return;

  const Select = {

    normalizar(t){
      return String(t || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    },

    somenteNumeros(t){
      return String(t || '').replace(/\D/g, '');
    },

    esperar(ms){
      return new Promise(r => setTimeout(r, ms));
    },

    visivel(el){
      return !!(el && el.offsetParent !== null);
    },

    async setValor(el, valor){
      el.scrollIntoView({block:'center'});
      el.focus();
      el.click();

      el.value = '';
      el.dispatchEvent(new Event('input', {bubbles:true}));

      el.value = String(valor || '');

      el.dispatchEvent(new InputEvent('input', {
        bubbles:true,
        inputType:'insertText',
        data:String(valor || '')
      }));

      el.dispatchEvent(new KeyboardEvent('keyup', {
        bubbles:true,
        key:String(valor || '').slice(-1) || '0'
      }));

      el.dispatchEvent(new Event('change', {bubbles:true}));

      await this.esperar(500);
    },

    buscarCampoAposLabel(label){
      const alvo = this.normalizar(label);

      const labels = [...document.querySelectorAll('label, span, div')]
        .filter(e => this.visivel(e))
        .filter(e => this.normalizar(e.innerText || e.textContent) === alvo);

      if(!labels.length) return null;

      const labelEl = labels[0];

      const campos = [...document.querySelectorAll('input, select')]
        .filter(e => this.visivel(e));

      return campos.find(c =>
        labelEl.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING
      ) || null;
    },

    opcoesVisiveis(){
      return [...document.querySelectorAll(
        '.ng-option, .dropdown-item, li, option, tr, div, span'
      )].filter(e => this.visivel(e));
    },

    async esperarOpcao(texto, tempo=10000){
      const alvoNumeros = this.somenteNumeros(texto);
      const alvoTexto = this.normalizar(texto);
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const opcao = this.opcoesVisiveis().find(o=>{
          const bruto = o.innerText || o.textContent || '';
          const txt = this.normalizar(bruto);
          const nums = this.somenteNumeros(bruto);

          if(alvoNumeros && nums.includes(alvoNumeros)) return true;
          return txt.includes(alvoTexto) || alvoTexto.includes(txt);
        });

        if(opcao) return opcao;

        await this.esperar(300);
      }

      return null;
    },

    async selecionarPorTexto(campo, texto){
      const el = typeof campo === 'string'
        ? document.querySelector(campo)
        : campo;

      if(!el) throw new Error('Campo select não encontrado.');

      if(el.tagName === 'SELECT'){
        const alvoNumeros = this.somenteNumeros(texto);
        const alvoTexto = this.normalizar(texto);

        const opt = [...el.options].find(o=>{
          const bruto = o.textContent || '';
          const txt = this.normalizar(bruto);
          const nums = this.somenteNumeros(bruto);

          if(alvoNumeros && nums.includes(alvoNumeros)) return true;
          return txt.includes(alvoTexto) || alvoTexto.includes(txt);
        });

        if(!opt) throw new Error('Opção não encontrada: ' + texto);

        el.value = opt.value;
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
        el.dispatchEvent(new Event('blur', {bubbles:true}));

        await this.esperar(700);
        return true;
      }

      await this.setValor(el, texto);

      const opcao = await this.esperarOpcao(texto);

      if(!opcao) throw new Error('Opção não encontrada: ' + texto);

      const clicavel =
        opcao.closest('button,a,li,tr,.ng-option,.dropdown-item') ||
        opcao;

      clicavel.click();

      await this.esperar(1000);
      return true;
    },

    async selecionarProdutor(identificador){
      const alvo = this.somenteNumeros(identificador);

      const campo =
        document.querySelector('#produtor') ||
        document.querySelector('[formcontrolname="produtor"]') ||
        this.buscarCampoAposLabel('Produtor');

      if(!campo) throw new Error('Campo Produtor não encontrado.');

      SOLUM.engine.log('Pesquisando produtor: ' + alvo, 'info');

      await this.setValor(campo, alvo);

      const opcao = await this.esperarOpcao(alvo, 15000);

      if(!opcao){
        throw new Error('Produtor não apareceu na lista: ' + alvo);
      }

      const clicavel =
        opcao.closest('button,a,li,tr,.ng-option,.dropdown-item') ||
        opcao;

      clicavel.click();

      SOLUM.engine.log('Opção do produtor clicada: ' + alvo, 'ok');

      await this.esperarProdutorPreenchido(campo, alvo);

      SOLUM.engine.log('Produtor selecionado: ' + alvo, 'ok');

      await this.esperar(1200);
      return true;
    },

    async esperarProdutorPreenchido(campo, alvo, tempo=15000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const valor = this.somenteNumeros(campo.value || campo.innerText || campo.textContent || '');

        const fazenda = document.querySelector('#fazenda');
        const fazendaCarregou = fazenda && fazenda.options && fazenda.options.length > 0;

        if(valor.includes(alvo) || fazendaCarregou){
          return true;
        }

        await this.esperar(300);
      }

      SOLUM.engine.log('Produtor clicado, mas não confirmou preenchimento visual.', 'info');
      return false;
    },

    async selecionarFazendaPorIE(ie){
      const alvo = this.somenteNumeros(ie);

      const campo = document.querySelector('#fazenda');

      if(!campo) throw new Error('Campo Fazenda não encontrado.');

      const inicio = Date.now();

      while(Date.now() - inicio < 15000){
        if(campo.options && campo.options.length > 0){
          break;
        }
        await this.esperar(500);
      }

      if(!campo.options || campo.options.length === 0){
        throw new Error('Nenhuma fazenda carregou para o produtor.');
      }

      let opt = [...campo.options].find(o=>{
        const txt = this.somenteNumeros(o.textContent);
        return alvo && txt.includes(alvo);
      });

      if(!opt){
        SOLUM.engine.log('IE não encontrada na lista. Selecionando primeira fazenda disponível.', 'info');
        opt = [...campo.options].find(o => !o.disabled && String(o.value || '').trim() !== '');
      }

      if(!opt){
        throw new Error('Nenhuma opção válida de fazenda encontrada.');
      }

      campo.value = opt.value;
      campo.dispatchEvent(new Event('input', {bubbles:true}));
      campo.dispatchEvent(new Event('change', {bubbles:true}));
      campo.dispatchEvent(new Event('blur', {bubbles:true}));

      SOLUM.engine.log('Fazenda selecionada: ' + opt.textContent.trim(), 'ok');

      await this.esperar(1000);
      return true;
    },

    async selecionarModelo55(){
      const campo = document.querySelector('#modeloNFId');

      if(!campo) throw new Error('Campo Modelo NF não encontrado.');

      await this.selecionarPorTexto(campo, '55');

      SOLUM.engine.log('Modelo 55 selecionado.', 'ok');

      await this.esperar(800);
      return true;
    }

  };

  SOLUM.select = Select;
})();
