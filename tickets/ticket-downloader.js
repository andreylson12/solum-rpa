(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.ticketDownloader) return;

  const TicketDownloader = {
    encontrarTabelaArquivos(){
      const tabelas = [...document.querySelectorAll('table')];

      return tabelas.find(t=>{
        const txt = (t.innerText || '').toUpperCase();
        return txt.includes('ARQUIVO') && txt.includes('TIPO') && txt.includes('BAIXAR');
      });
    },

    async baixarTodos(){
      SOLUM.engine.log('Procurando tabela de arquivos do ticket...', 'info');

      const tabela = this.encontrarTabelaArquivos();

      if(!tabela){
        SOLUM.engine.log('Tabela de arquivos não encontrada.', 'erro');
        alert('Não encontrei a tabela de arquivos neste ticket.');
        return;
      }

      const linhas = [...tabela.querySelectorAll('tbody tr')];

      if(!linhas.length){
        SOLUM.engine.log('Nenhum arquivo encontrado no ticket.', 'erro');
        return;
      }

      let baixados = 0;

      for(const linha of linhas){
        const texto = linha.innerText || '';

        const botaoDownload =
          linha.querySelector('a[href]') ||
          linha.querySelector('button') ||
          linha.querySelector('i')?.closest('button') ||
          linha.querySelector('i')?.closest('a');

        if(botaoDownload){
          botaoDownload.click();
          baixados++;
          SOLUM.engine.log('Download iniciado: ' + texto.split('\n')[0], 'ok');
          await new Promise(r=>setTimeout(r, 1200));
        }
      }

      SOLUM.engine.log(`${baixados} downloads iniciados.`, 'ok');

      alert(
        baixados + ' arquivos foram enviados para Downloads.\n\n' +
        'Depois clique em "Carregar Arquivos" e selecione os arquivos baixados.'
      );
    }
  };

  SOLUM.ticketDownloader = TicketDownloader;
})();
