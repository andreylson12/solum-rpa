(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.ticket) return;

  const Ticket = {

    async gerar(){
      SOLUM.engine.log('Iniciando geração do ticket...', 'info');

      await this.clicarGerarTicket();

      await this.confirmarSalvar();

      SOLUM.engine.log('Ticket enviado para geração.', 'ok');

      return true;
    },

    async clicarGerarTicket(){
      const botao = await this.esperarBotaoPorTexto('GERAR TICKET', 10000);

      if(!botao){
        throw new Error('Botão Gerar Ticket não encontrado.');
      }

      botao.click();

      SOLUM.engine.log('Clique em Gerar Ticket.', 'ok');

      await SOLUM.actions.esperar(800);
    },

    async confirmarSalvar(){
      const botaoSim = await this.esperarBotaoPorTexto('SIM', 10000);

      if(!botaoSim){
        throw new Error('Botão SIM da confirmação não encontrado.');
      }

      botaoSim.click();

      SOLUM.engine.log('Confirmação SIM clicada.', 'ok');

      await SOLUM.actions.esperar(1500);
    },

    async esperarBotaoPorTexto(texto, tempo=10000){
      const alvo = this.normalizar(texto);
      const inicio = Date.now();

      while(Date.now() - inicio < tempo){
        const botoes = [...document.querySelectorAll('button, a')]
          .filter(b => b.offsetParent !== null);

        const botao = botoes.find(b=>{
          const t = this.normalizar(b.innerText || b.textContent || '');
          return t === alvo || t.includes(alvo);
        });

        if(botao) return botao;

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

  SOLUM.ticket = Ticket;
})();
