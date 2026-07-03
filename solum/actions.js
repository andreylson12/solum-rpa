(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.actions) return;

  const Actions = {
    esperar(ms){
      return new Promise(r=>setTimeout(r, ms));
    },

    normalizar(t){
      return String(t || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
    },

    visivel(el){
      return !!(el && el.offsetParent !== null);
    },

    async esperarElemento(selector, tempo=10000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const el = document.querySelector(selector);
        if(el && this.visivel(el)) return el;
        await this.esperar(200);
      }

      throw new Error('Elemento não encontrado: ' + selector);
    },

    async esperarHabilitar(selector, tempo=15000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const el = document.querySelector(selector);

        if(el && !el.disabled){
          return el;
        }

        await this.esperar(300);
      }

      throw new Error('Campo não habilitou: ' + selector);
    },

    async esperarOpcoes(selector, minimo=2, tempo=15000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const el = document.querySelector(selector);

        if(el && el.options && el.options.length >= minimo){
          return el;
        }

        await this.esperar(300);
      }

      throw new Error('Opções não carregaram: ' + selector);
    },

    setValor(el, valor){
      el.focus();
      el.value = '';
      el.dispatchEvent(new Event('input', {bubbles:true}));

      el.value = valor || '';
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
      el.blur();
    },

    async preencherSelector(selector, valor){
      const el = await this.esperarElemento(selector);
      this.setValor(el, valor);
      SOLUM.engine.log('Campo preenchido: ' + selector, 'ok');
      await this.esperar(200);
      return true;
    },

    async selecionarSelector(selector, texto){
      const el = await this.esperarElemento(selector);

      if(el.disabled){
        await this.esperarHabilitar(selector);
      }

      if(el.tagName === 'SELECT'){
        await this.esperarOpcoes(selector, 2);
      }

      const alvo = this.normalizar(texto);

      if(el.tagName === 'SELECT'){
        const opts = [...el.options];

        const achou = opts.find(o=>{
          const txt = this.normalizar(o.textContent);
          return txt.includes(alvo) || alvo.includes(txt);
        });

        if(!achou){
          throw new Error('Opção não encontrada: ' + texto);
        }

        el.value = achou.value;
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
        el.dispatchEvent(new Event('blur', {bubbles:true}));

        SOLUM.engine.log('Selecionado: ' + texto, 'ok');
        await this.esperar(500);
        return true;
      }

      this.setValor(el, texto);
      await this.esperar(500);

      const opcoes = [...document.querySelectorAll(
        '.ng-option, .select2-results__option, li, .dropdown-item'
      )].filter(o=>this.visivel(o));

      const opcao = opcoes.find(o=>{
        const txt = this.normalizar(o.innerText || o.textContent);
        return txt.includes(alvo) || alvo.includes(txt);
      });

      if(opcao){
        opcao.click();
        SOLUM.engine.log('Selecionado via busca: ' + texto, 'ok');
        await this.esperar(500);
        return true;
      }

      SOLUM.engine.log('Campo pesquisável preenchido, mas opção não confirmada: ' + texto, 'info');
      return false;
    },

    async clicarPorTexto(texto){
      const alvo = this.normalizar(texto);

      const el = [...document.querySelectorAll('button, a, span, div')]
        .filter(e=>this.visivel(e))
        .find(e=>this.normalizar(e.innerText || e.textContent) === alvo);

      if(!el){
        throw new Error('Botão/texto não encontrado: ' + texto);
      }

      el.click();
      SOLUM.engine.log('Clique por texto: ' + texto, 'ok');
      await this.esperar(300);
      return true;
    },

    buscarCampoPorLabel(label){
      const alvo = this.normalizar(label);

      const labels = [...document.querySelectorAll('label, span, div')]
        .filter(e=>this.visivel(e))
        .filter(e=>{
          const txt = this.normalizar(e.innerText || e.textContent);
          return txt === alvo || txt.includes(alvo);
        });

      for(const l of labels){
        const container =
          l.closest('.form-group') ||
          l.closest('.row') ||
          l.parentElement;

        if(!container) continue;

        const campo = container.querySelector('input, select, textarea');
        if(campo && this.visivel(campo)) return campo;
      }

      return null;
    },

    async preencherLabel(label, valor){
      const campo = this.buscarCampoPorLabel(label);

      if(!campo){
        throw new Error('Campo não encontrado por label: ' + label);
      }

      this.setValor(campo, valor);
      SOLUM.engine.log('Campo preenchido: ' + label, 'ok');
      await this.esperar(200);
      return true;
    },

    async selecionarLabel(label, texto){
      const campo = this.buscarCampoPorLabel(label);

      if(!campo){
        throw new Error('Campo não encontrado por label: ' + label);
      }

      if(campo.id){
        return await this.selecionarSelector('#' + campo.id, texto);
      }

      return await this.selecionarElemento(campo, texto, label);
    },

    async selecionarElemento(el, texto, label=''){
      const alvo = this.normalizar(texto);

      if(el.tagName === 'SELECT'){
        const opts = [...el.options];

        const achou = opts.find(o=>{
          const txt = this.normalizar(o.textContent);
          return txt.includes(alvo) || alvo.includes(txt);
        });

        if(!achou){
          throw new Error('Opção não encontrada: ' + texto);
        }

        el.value = achou.value;
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
        SOLUM.engine.log('Selecionado: ' + (label || texto), 'ok');
        await this.esperar(300);
        return true;
      }

      this.setValor(el, texto);
      await this.esperar(500);
      return true;
    }
  };

  SOLUM.actions = Actions;
})();
