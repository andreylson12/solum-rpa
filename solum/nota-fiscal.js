(function(){
  window.SOLUM = window.SOLUM || {};
  delete SOLUM.notaFiscal;

  const NotaFiscal = {

    rodando:false,
    pesoConfirmacao:'',
    valorConfirmacao:'',

    async executar(){
      if(this.rodando){
        SOLUM.engine.log('Nota Fiscal já está em execução.', 'info');
        return false;
      }

      this.rodando = true;

      try{
        const xml = SOLUM.context?.dados?.xml || SOLUM.engine.estado.dados.xml || {};
        const planilha = SOLUM.context?.dados?.planilha || SOLUM.engine.estado.dados.planilha || {};

        if(!xml.chave){
          alert('XML da nota fiscal não foi lido.');
          return false;
        }

        const bpProdutor = this.obterBPProdutor(planilha);
        if(!bpProdutor) throw new Error('BP do produtor não encontrado na planilha.');

        SOLUM.engine.log('Iniciando NF ' + (xml.numero || xml.nf || ''), 'info');

        await this.abrirNovaNotaFiscal();
        await SOLUM.select.selecionarProdutor(bpProdutor);
        SOLUM.engine.log('Produtor selecionado.', 'ok');

        await SOLUM.select.selecionarFazendaPorIE(xml.inscricaoEstadual);
        SOLUM.engine.log('Fazenda selecionada.', 'ok');

        await SOLUM.select.selecionarModelo55();
        SOLUM.engine.log('Modelo 55 selecionado.', 'ok');

        await this.preencherChave(xml.chave);
        await this.clicarLupaChave();

        await this.esperarNotaCarregada();
        await this.esperarSalvarHabilitado();

        this.guardarPesoValor();

        await this.clicarSalvar();
        await this.preencherConfirmacaoValores(xml);
        await this.clicarConfirmarValores();
        await this.clicarSimFinal();

        SOLUM.engine.log('Nota Fiscal salva com sucesso.', 'ok');
        return true;

      }finally{
        this.rodando = false;
      }
    },

    obterBPProdutor(planilha){
      return String(
        planilha.bp ||
        planilha.primeiro?.bp ||
        planilha.resultados?.[0]?.bp ||
        ''
      ).replace(/\D/g, '');
    },

    async abrirNovaNotaFiscal(){
      if(this.telaNFAberta()){
        SOLUM.engine.log('Tela NF já está aberta.', 'ok');
        return true;
      }

      const btn = this.botaoPorTextoClasse('Nova Nota Fiscal', 'btn-novo-sesar');
      if(!btn) throw new Error('Botão Nova Nota Fiscal não encontrado.');

      btn.click();
      SOLUM.engine.log('Nova Nota Fiscal clicado.', 'ok');

      const abriu = await this.esperar(() => this.telaNFAberta(), 15000);
      if(!abriu) throw new Error('Tela Nova Nota Fiscal não abriu.');

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
      if(!campo) throw new Error('Campo chave não encontrado.');

      await this.setValor(campo, chave);
      SOLUM.engine.log('Chave preenchida.', 'ok');
    },

    async clicarLupaChave(){
      const campo = document.querySelector('#chave');
      if(!campo) throw new Error('Campo chave não encontrado.');

      const grupo = campo.parentElement;

      const lupa =
        grupo.querySelector('button') ||
        grupo.querySelector('i')?.closest('button') ||
        grupo.querySelector('i, span');

      if(!lupa) throw new Error('Lupa da chave não encontrada.');

      lupa.click();
      SOLUM.engine.log('Lupa da chave clicada.', 'ok');
    },

    async esperarNotaCarregada(){
      const ok = await this.esperar(() => {
        const serie = document.querySelector('#serie')?.value;
        const numero = document.querySelector('#numeroNF')?.value;
        const protocolo = document.querySelector('#numeroProtocolo')?.value;
        const emissao = document.querySelector('#emissao')?.value;
        const cfop = document.querySelector('#cfopId')?.value;
        const peso = document.querySelector('#pesoNF')?.value;
        const valor = document.querySelector('#valorTotal')?.value;
        const autenticacao = document.querySelector('#dataAutenticacao')?.value;

        return !!(
          serie &&
          numero &&
          protocolo &&
          emissao &&
          cfop &&
          peso &&
          valor &&
          valor !== 'R$ 0,00' &&
          autenticacao
        );
      }, 30000);

      if(!ok) throw new Error('NF não carregou todos os dados.');

      SOLUM.engine.log('Dados da NF carregados.', 'ok');
      await SOLUM.actions.esperar(800);
    },

    async esperarSalvarHabilitado(){
      const ok = await this.esperar(() => {
        const btn = this.botaoSalvarNF();

        return !!(
          btn &&
          !btn.disabled &&
          !String(btn.className || '').includes('disabled')
        );
      }, 15000);

      if(!ok) throw new Error('Botão Salvar não habilitou.');

      SOLUM.engine.log('Salvar habilitado.', 'ok');
    },

    guardarPesoValor(){
      const pesoTela = document.querySelector('#pesoNF')?.value;
      const valorTela = document.querySelector('#valorTotal')?.value;

      this.pesoConfirmacao = this.limparPeso(pesoTela);
      this.valorConfirmacao = this.limparValor(valorTela);

      SOLUM.engine.log('Peso guardado para confirmação: ' + this.pesoConfirmacao, 'info');
      SOLUM.engine.log('Valor guardado para confirmação: ' + this.valorConfirmacao, 'info');

      if(!this.pesoConfirmacao){
        throw new Error('Peso da tela não encontrado antes de salvar.');
      }

      if(!this.valorConfirmacao){
        throw new Error('Valor da tela não encontrado antes de salvar.');
      }
    },

    botaoSalvarNF(){
      return [...document.querySelectorAll('button')]
        .filter(b => b.offsetParent !== null)
        .filter(b => !b.closest('#solum-rpa'))
        .find(b =>
          this.normalizar(b.innerText || b.textContent) === 'SALVAR' &&
          String(b.className || '').includes('button-sesar-verde-escuro')
        );
    },

    async clicarSalvar(){
      const btn = this.botaoSalvarNF();
      if(!btn) throw new Error('Botão Salvar da NF não encontrado.');

      btn.click();
      SOLUM.engine.log('Salvar clicado.', 'ok');

      const abriu = await this.esperar(() => {
        const peso = document.querySelector('#confirmacaoPeso');
        const valor = document.querySelector('#confirmacaoValor');
        const confirmar = document.querySelector('button.botaoConfirmacao');

        return !!(
          peso &&
          valor &&
          peso.offsetParent !== null &&
          valor.offsetParent !== null &&
          confirmar &&
          confirmar.offsetParent !== null
        );
      }, 15000);

      if(!abriu) throw new Error('Confirmação de valores não abriu.');

      SOLUM.engine.log('Modal de confirmação de valores aberto.', 'ok');
    },

    async preencherConfirmacaoValores(xml){
      const campoPeso = document.querySelector('#confirmacaoPeso');
      const campoValor = document.querySelector('#confirmacaoValor');

      if(!campoPeso || campoPeso.offsetParent === null){
        throw new Error('Campo confirmacaoPeso não encontrado.');
      }

      if(!campoValor || campoValor.offsetParent === null){
        throw new Error('Campo confirmacaoValor não encontrado.');
      }

      const peso =
        this.pesoConfirmacao ||
        this.limparPeso(xml.qCom || xml.qTrib || xml.pesoL || xml.peso);

      const valor =
        this.valorConfirmacao ||
        this.limparValor(xml.valorTotal);

      if(!peso) throw new Error('Peso para confirmação não encontrado.');
      if(!valor) throw new Error('Valor para confirmação não encontrado.');

      await this.setValor(campoPeso, peso);
      await this.setValor(campoValor, valor);

      SOLUM.engine.log('Peso confirmado: ' + campoPeso.value, 'ok');
      SOLUM.engine.log('Valor confirmado: ' + campoValor.value, 'ok');
    },

    async clicarConfirmarValores(){
      const btn = document.querySelector('button.botaoConfirmacao');

      if(!btn || btn.offsetParent === null){
        throw new Error('Botão Confirmar valores não encontrado.');
      }

      btn.click();
      SOLUM.engine.log('Confirmar valores clicado.', 'ok');

      const apareceuSim = await this.esperar(() => {
        const sim = document.querySelector('button.swal2-confirm');
        return sim && sim.offsetParent !== null;
      }, 15000);

      if(!apareceuSim) throw new Error('Confirmação final SIM não apareceu.');
    },

    async clicarSimFinal(){
      const sim = document.querySelector('button.swal2-confirm');

      if(!sim || sim.offsetParent === null){
        throw new Error('Botão SIM final não encontrado.');
      }

      sim.click();
      SOLUM.engine.log('SIM final clicado.', 'ok');

      await SOLUM.actions.esperar(1500);
    },

    botaoPorTextoClasse(texto, classe){
      const alvo = this.normalizar(texto);

      return [...document.querySelectorAll('button')]
        .filter(b => b.offsetParent !== null)
        .filter(b => !b.closest('#solum-rpa'))
        .find(b => {
          const t = this.normalizar(b.innerText || b.textContent);
          const c = String(b.className || '');
          return t === alvo && (!classe || c.includes(classe));
        });
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
   limparPeso(v){
   return String(v || '')
    .replace(/[^\d]/g, '')
    .trim();
    
      return p;
    },

    limparValor(v){
      return String(v || '')
        .replace('R$', '')
        .replace(/\s+/g, '')
        .trim();
    },

    async esperar(fn, tempo=10000){
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        try{
          if(fn()) return true;
        }catch(e){}

        await SOLUM.actions.esperar(300);
      }

      return false;
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
