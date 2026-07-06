(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.notaFiscal) return;

  const NotaFiscal = {

    async executar(){
      const xml = SOLUM.context?.dados?.xml || SOLUM.engine.estado.dados.xml || {};

      if(!xml.chave){
        alert('XML da nota fiscal não foi lido.');
        SOLUM.engine.log('XML da NF não encontrado no contexto.', 'erro');
        return false;
      }

      SOLUM.engine.log('Iniciando Nota Fiscal: NF ' + xml.numero, 'info');

      await this.abrirNovaNotaFiscal();

      await this.preencherChave(xml.chave);

      await this.consultarChave();

      const ok = await this.verificarPreenchimento(xml);

      if(!ok){
        SOLUM.engine.log('SOLUM não preencheu a NF. Preenchendo manualmente pelo XML...', 'info');
        await this.preencherManual(xml);
      }else{
        SOLUM.engine.log('NF preenchida automaticamente pelo SOLUM.', 'ok');
      }

      await this.salvar();

      await this.confirmarPesoValor();

      SOLUM.engine.log('Nota Fiscal salva.', 'ok');

      return true;
    },

    async abrirNovaNotaFiscal(){
      const botao = await this.esperarPorTexto('Nova Nota Fiscal', 10000);

      if(!botao){
        throw new Error('Botão Nova Nota Fiscal não encontrado.');
      }

      botao.click();

      SOLUM.engine.log('Nova Nota Fiscal aberta.', 'ok');

      await SOLUM.actions.esperar(1000);
    },

    async preencherChave(chave){
      const campo =
        document.querySelector('input[placeholder*="chave" i]') ||
        [...document.querySelectorAll('input')]
          .find(i => (i.placeholder || '').toUpperCase().includes('CHAVE'));

      if(!campo){
        throw new Error('Campo Chave da NF não encontrado.');
      }

      await this.setValor(campo, chave);

      SOLUM.engine.log('Chave preenchida: ' + chave, 'ok');

      await SOLUM.actions.esperar(500);
    },

    async consultarChave(){
      const campo =
        document.querySelector('input[placeholder*="chave" i]') ||
        [...document.querySelectorAll('input')]
          .find(i => (i.placeholder || '').toUpperCase().includes('CHAVE'));

      if(!campo){
        throw new Error('Campo Chave não encontrado para consulta.');
      }

      const container = campo.parentElement;

      const lupa =
        container.querySelector('button') ||
        container.querySelector('i')?.closest('button') ||
        container.querySelector('span') ||
        campo.closest('div')?.querySelector('button, i, span');

      if(!lupa){
        throw new Error('Lupa da Chave da NF não encontrada.');
      }

      lupa.click();

      SOLUM.engine.log('Consulta da chave acionada.', 'ok');

      await SOLUM.actions.esperar(2000);
    },

    async verificarPreenchimento(xml){
      const numero = document.querySelector('#numero') ||
        document.querySelector('input[formcontrolname="numero"]') ||
        [...document.querySelectorAll('input')]
          .find(i => (i.placeholder || '').toUpperCase().includes('NUMERO'));

      const serie = document.querySelector('#serie') ||
        document.querySelector('input[formcontrolname="serie"]') ||
        [...document.querySelectorAll('input')]
          .find(i => (i.placeholder || '').toUpperCase().includes('SERIE'));

      const valorNumero = String(numero?.value || '').trim();
      const valorSerie = String(serie?.value || '').trim();

      return (
        valorNumero.includes(String(xml.numero || '').trim()) ||
        valorSerie.includes(String(xml.serie || '').trim())
      );
    },

    async preencherManual(xml){
      await this.preencherCampoPorPlaceholder('Número', xml.numero);
      await this.preencherCampoPorPlaceholder('Série', xml.serie);
      await this.preencherCampoPorPlaceholder('Protocolo', xml.protocolo);
      await this.preencherCampoPorPlaceholder('Peso', xml.peso);
      await this.preencherCampoPorPlaceholder('Valor Total', xml.valorTotal);
      await this.preencherCampoPorPlaceholder('Data Emissão', xml.dataEmissao);
      await this.preencherCampoPorPlaceholder('Data Autenticação', xml.dataEmissao);
    },

    async preencherCampoPorPlaceholder(nome, valor){
      if(!valor) return false;

      const alvo = this.normalizar(nome);

      const campo = [...document.querySelectorAll('input')]
        .filter(i => i.offsetParent !== null)
        .find(i => {
          const p = this.normalizar(i.placeholder || '');
          const id = this.normalizar(i.id || '');
          const name = this.normalizar(i.getAttribute('formcontrolname') || '');
          return p.includes(alvo) || id.includes(alvo) || name.includes(alvo);
        });

      if(!campo){
        SOLUM.engine.log('Campo não encontrado para NF: ' + nome, 'info');
        return false;
      }

      await this.setValor(campo, valor);

      SOLUM.engine.log('Campo NF preenchido: ' + nome, 'ok');

      await SOLUM.actions.esperar(200);

      return true;
    },

    async salvar(){
      const botao = await this.esperarPorTexto('Salvar', 10000);

      if(!botao){
        throw new Error('Botão Salvar da NF não encontrado.');
      }

      botao.click();

      SOLUM.engine.log('Salvar NF clicado.', 'ok');

      await SOLUM.actions.esperar(1200);
    },

    async confirmarPesoValor(){
      const sim = await this.esperarPorTexto('Sim', 5000);

      if(sim){
        sim.click();
        SOLUM.engine.log('Confirmação de peso/valor clicada.', 'ok');
        await SOLUM.actions.esperar(1500);
        return true;
      }

      const confirmar = await this.esperarPorTexto('Confirmar', 3000);

      if(confirmar){
        confirmar.click();
        SOLUM.engine.log('Confirmação da NF clicada.', 'ok');
        await SOLUM.actions.esperar(1500);
        return true;
      }

      SOLUM.engine.log('Nenhuma confirmação de NF apareceu.', 'info');

      return false;
    },

    async esperarPorTexto(texto, tempo=10000){
      const alvo = this.normalizar(texto);
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const elementos = [...document.querySelectorAll('button, a, span, div')]
          .filter(e => e.offsetParent !== null);

        const el = elementos.find(e=>{
          const t = this.normalizar(e.innerText || e.textContent || '');
          return t === alvo || t.includes(alvo);
        });

        if(el){
          return el.closest('button,a') || el;
        }

        await SOLUM.actions.esperar(300);
      }

      return null;
    },

    async setValor(campo, valor){
      campo.focus();

      campo.value = '';

      campo.dispatchEvent(new Event('input', {bubbles:true}));

      campo.value = String(valor || '');

      campo.dispatchEvent(new InputEvent('input', {
        bubbles:true,
        inputType:'insertText',
        data:String(valor || '')
      }));

      campo.dispatchEvent(new Event('change', {bubbles:true}));
      campo.dispatchEvent(new Event('blur', {bubbles:true}));

      await SOLUM.actions.esperar(200);
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
