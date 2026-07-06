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

    async esperar(ms){
      return new Promise(r => setTimeout(r, ms));
    },

    visivel(el){
      return !!(el && el.offsetParent !== null);
    },

    async clicarCampo(el){
      el.scrollIntoView({block:'center'});
      el.focus();
      el.click();
      await this.esperar(300);
    },

    async setValor(el, valor){
      await this.clicarCampo(el);

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

      await this.esperar(800);
    },

    opcoesVisiveis(){
      return [...document.querySelectorAll(
        '.ng-option, .select2-results__option, .dropdown-item, option, li, tr, div'
      )].filter(e => this.visivel(e));
    },

    async esperarOpcao(texto, tempo=10000){
      const alvo = this.normalizar(texto);
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const opcoes = this.opcoesVisiveis();

        const opcao = opcoes.find(o => {
          const txt = this.normalizar(o.innerText || o.textContent || '');
          return txt.includes(alvo) || alvo.includes(txt);
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

      if(!el){
        throw new Error('Campo select não encontrado.');
      }

      if(el.tagName === 'SELECT'){
        const alvo = this.normalizar(texto);

        const opt = [...el.options].find(o => {
          const txt = this.normalizar(o.textContent);
          return txt.includes(alvo) || alvo.includes(txt);
        });

        if(!opt){
          throw new Error('Opção não encontrada: ' + texto);
        }

        el.value = opt.value;
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
        el.dispatchEvent(new Event('blur', {bubbles:true}));

        await this.esperar(500);
        return true;
      }

      await this.setValor(el, texto);

      const opcao = await this.esperarOpcao(texto);

      if(!opcao){
        throw new Error('Opção não encontrada: ' + texto);
      }

      opcao.click();
      await this.esperar(700);

      return true;
    },

    async selecionarProdutor(bp){
      const alvo = String(bp || '').replace(/\D/g, '');

      const campo =
        document.querySelector('#produtor') ||
        document.querySelector('[formcontrolname="produtor"]') ||
        [...document.querySelectorAll('input')]
          .find(i => this.normalizar(i.placeholder).includes('PRODUTOR'));

      if(!campo){
        throw new Error('Campo Produtor não encontrado.');
      }

      await this.selecionarPorTexto(campo, alvo);

      SOLUM.engine.log('Produtor selecionado pelo BP: ' + alvo, 'ok');

      return true;
    },

    async selecionarFazendaPorIE(ie){
      const alvo = String(ie || '').replace(/\D/g, '');

      const campo =
        document.querySelector('#fazenda') ||
        document.querySelector('[formcontrolname="fazenda"]') ||
        [...document.querySelectorAll('select,input')]
          .find(i => this.normalizar(i.placeholder).includes('FAZENDA'));

      if(!campo){
        throw new Error('Campo Fazenda não encontrado.');
      }

      if(campo.tagName === 'SELECT'){
        await this.selecionarPorTexto(campo, alvo);
      }else{
        await this.selecionarPorTexto(campo, alvo);
      }

      SOLUM.engine.log('Fazenda selecionada pela IE: ' + alvo, 'ok');

      return true;
    },

    async selecionarModelo55(){
      const campo =
        document.querySelector('#modelo') ||
        document.querySelector('[formcontrolname="modelo"]') ||
        [...document.querySelectorAll('select,input')]
          .find(i => this.normalizar(i.placeholder).includes('MODELO'));

      if(!campo){
        throw new Error('Campo Modelo não encontrado.');
      }

      await this.selecionarPorTexto(campo, '55');

      SOLUM.engine.log('Modelo 55 selecionado.', 'ok');

      return true;
    }

  };

  SOLUM.select = Select;
})();
