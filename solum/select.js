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

      await this.esperar(800);
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
        '.ng-option, .dropdown-item, li, option, tr, div'
      )].filter(e => this.visivel(e));
    },

    async esperarOpcao(texto, tempo=10000){
      const alvo = this.normalizar(texto);
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const opcao = this.opcoesVisiveis().find(o=>{
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

      if(!el) throw new Error('Campo select não encontrado.');

      if(el.tagName === 'SELECT'){
        const alvo = this.normalizar(texto);

        const opt = [...el.options].find(o=>{
          const txt = this.normalizar(o.textContent);
          return txt.includes(alvo) || alvo.includes(txt);
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

      opcao.click();

      await this.esperar(1000);
      return true;
    },

    async selecionarProdutor(identificador){
      const alvo = String(identificador || '').replace(/\D/g, '');

      const campo =
        document.querySelector('#produtor') ||
        document.querySelector('[formcontrolname="produtor"]') ||
        this.buscarCampoAposLabel('Produtor');

      if(!campo) throw new Error('Campo Produtor não encontrado.');

      await this.selecionarPorTexto(campo, alvo);

      SOLUM.engine.log('Produtor selecionado: ' + alvo, 'ok');

      await this.esperar(1000);
      return true;
    },

    async selecionarFazendaPorIE(ie){
  const alvo = String(ie || '').replace(/\D/g, '');

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
    const txt = this.normalizar(o.textContent);
    return txt.includes(alvo);
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
}

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
