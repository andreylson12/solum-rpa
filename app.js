(function(){
  if(window.SOLUM_RPA_APP) return;
  window.SOLUM_RPA_APP = true;

  const BASE = 'https://raw.githubusercontent.com/andreylson12/solum-rpa/main/';

  function carregarScript(nome){
    return new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = BASE + nome + '?v=' + Date.now();
      s.onload = () => {
        console.log('✅ Carregado:', nome);
        resolve();
      };
      s.onerror = () => reject(new Error('Erro ao carregar ' + nome));
      document.head.appendChild(s);
    });
  }

  async function iniciar(){
    try{
      await carregarScript('engine.js');

      if(!window.SolumEngine){
        throw new Error('SolumEngine não foi criado.');
      }

      window.SolumEngine.iniciar();
    }catch(e){
      console.error('Erro ao iniciar SOLUM RPA:', e);
    }
  }

  iniciar();
})();
