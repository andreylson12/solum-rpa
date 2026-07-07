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

    camposVisiveis(){
      return [...document.querySelectorAll('input, select')]
        .filter(e => this.visivel(e));
    },

    campoProdutor(){
      const campos = this.camposVisiveis();

      const porId =
        document.querySelector('#produtor') ||
        document.querySelector('[formcontrolname="produtor"]');

      if(porId && this.visivel(porId)) return porId;

      const campoIndice17 = campos[17];

      if(campoIndice17 && campoIndice17.tagName === 'INPUT'){
        return campoIndice17;
      }

      throw new Error('Campo Produtor não encontrado no índice 17.');
    },

    async setValor(el, valor){
      el.scrollIntoView({block:'center'});
      el.focus();
      el.click();

      await this.esperar(200);

      el.value = '';
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));

      await this.esperar(200);

      el.value = String(valor || '');

      el.dispatchEvent(new InputEvent('input', {
        bubbles:true,
        inputType:'insertText',
        data:String(valor || '')
      }));

      el.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles:true,
        key:String(valor || '').slice(-1) || '0'
      }));

      el.dispatchEvent(new KeyboardEvent('keyup', {
        bubbles:true,
        key:String(valor || '').slice(-1) || '0'
      }));

      await this.esperar(1000);
    },

    opcoesProdutorVisiveis(){
      return [...document.querySelectorAll(
        '.ng-dropdown-panel .ng-option, .ng-option, .dropdown-menu .dropdown-item, .select2-results__option, ul li'
      )].filter(e => this.visivel(e));
    },

    async esperarOpcaoProdutor(alvo, tempo=15000){
      const alvoNumeros = this.somenteNumeros(alvo);
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const opcoes = this.opcoesProdutorVisiveis();

        const opcao = opcoes.find(o=>{
          const txt = o.innerText || o.textContent || '';
          const nums = this.somenteNumeros(txt);
          return alvoNumeros && nums.includes(alvoNumeros);
        });

        if(opcao) return opcao;

        await this.esperar(300);
      }

      return null;
    },

    async selecionarProdutor(identificador){
      const alvo = this.somenteNumeros(identificador);
      const campo = this.campoProdutor();

      SOLUM.engine.log('Pesquisando produtor: ' + alvo, 'info');

      await this.setValor(campo, alvo);

      const opcao = await this.esperarOpcaoProdutor(alvo, 15000);

      if(!opcao){
        throw new Error('Produtor não apareceu na lista: ' + alvo);
      }

      opcao.scrollIntoView({block:'center'});
      opcao.click();

      SOLUM.engine.log('Opção do produtor clicada: ' + alvo, 'ok');

      await this.esperar(1500);

      const fazenda = document.querySelector('#fazenda');

      if(fazenda && fazenda.options && fazenda.options.length > 0){
        SOLUM.engine.log('Fazendas carregadas após produtor.', 'ok');
      }else{
        SOLUM.engine.log('Produtor clicado. Aguardando fazendas...', 'info');
      }

      await this.esperar(1000);

      return true;
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

      const opcao = await this.esperarOpcaoProdutor(texto);

      if(!opcao) throw new Error('Opção não encontrada: ' + texto);

      opcao.click();

      await this.esperar(1000);
      return true;
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
        const nums = this.somenteNumeros(o.textContent);
        return alvo && nums.includes(alvo);
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
