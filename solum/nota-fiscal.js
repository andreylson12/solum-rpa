(function(){
  window.SOLUM = window.SOLUM || {};
  delete SOLUM.notaFiscal;

  const NotaFiscal = {

    rodando:false,

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

        SOLUM.engine.log('Iniciando NF ' + xml.numero, 'info');

        await this.abrirNovaNotaFiscal();
        await SOLUM.select.selecionarProdutor(bpProdutor);
        await SOLUM.select.selecionarFazendaPorIE(xml.inscricaoEstadual);
        await SOLUM.select.selecionarModelo55();

        await this.preencherChave(xml.chave);
        await this.clicarLupaChave();

        await this.esperarNotaCarregada();
        await this.esperarSalvarHabilitado();

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
        return (
          document.querySelector('#serie')?.value &&
          document.querySelector('#numeroNF')?.value &&
          document.querySelector('#numeroProtocolo')?.value &&
          document.querySelector('#emissao')?.value &&
          document.querySelector('#cfopId')?.value &&
          document.querySelector('#pesoNF')?.value &&
          document.querySelector('#valorTotal')?.value &&
          document.querySelector('#valorTotal')?.value !== 'R$ 0,00' &&
          document.querySelector('#dataAutenticacao')?.value
        );
      }, 25000);

      if(!ok) throw new Error('NF não carregou todos os dados.');

      SOLUM.engine.log('Dados da NF carregados.', 'ok');
      await SOLUM.actions.esperar(800);
    },

    async esperarSalvarHabilitado(){
      const ok = await this.esperar(() => {
        const btn = this.botaoSalvarNF();
        return btn && !String(btn.className).includes('disabled');
      }, 15000);

      if(!ok) throw new Error('Botão Salvar não habilitou.');

      SOLUM.engine.log('Salvar habilitado.', 'ok');
    },

    botaoSalvarNF(){
      return [...document.querySelectorAll('button')]
        .filter(b => b.offsetParent !== null)
        .filter(b => !b.closest('#solum-rpa'))
        .find(b =>
          this.normalizar(b.innerText || b.textContent) === 'SALVAR' &&
          String(b.className).includes('button-sesar-verde-escuro')
        );
    },

    async clicarSalvar(){
      const btn = this.botaoSalvarNF();
      if(!btn) throw new Error('Botão Salvar da NF não encontrado.');

      btn.click();
      SOLUM.engine.log('Salvar clicado.', 'ok');

      const abriu = await this.esperar(() => !!this.modalConfirmacaoValores(), 15000);
      if(!abriu) throw new Error('Confirmação de valores não abriu.');
    },

   modalConfirmacaoValores(){
  return [...document.querySelectorAll('div')]
    .filter(d => d.offsetParent !== null)
    .find(d => {
      const txt = this.normalizar(d.innerText || d.textContent || '');
      const temBotao = d.querySelector('button.botaoConfirmacao');
      const inputs = d.querySelectorAll('input');
      return txt.includes('CONFIRMACAO DE VALORES') &&
             txt.includes('PESO') &&
             txt.includes('VALOR') &&
             temBotao &&
             inputs.length >= 2;
    }) || null;
},

async preencherConfirmacaoValores(xml){
  const modal = this.modalConfirmacaoValores();
  if(!modal) throw new Error('Modal de confirmação não encontrado.');

  const inputs = [...modal.querySelectorAll('input')]
    .filter(i => i.offsetParent !== null);

  const campoPeso = inputs[0];
  const campoValor = inputs[1];

  if(!campoPeso || !campoValor){
    throw new Error('Campos Peso/Valor não encontrados no modal.');
  }

  const peso = this.limparPeso(document.querySelector('#pesoNF')?.value || xml.peso);
  const valor = this.limparValor(document.querySelector('#valorTotal')?.value || xml.valorTotal);

  await this.setValor(campoPeso, peso);
  await this.setValor(campoValor, valor);

  SOLUM.engine.log('Peso confirmado: ' + campoPeso.value, 'ok');
  SOLUM.engine.log('Valor confirmado: ' + campoValor.value, 'ok');
}

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
        .replace(/[^\d.,]/g, '')
        .trim();
    },

    limparValor(v){
      return String(v || '')
        .replace(/[^\d.,]/g, '')
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
