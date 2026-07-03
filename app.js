(async function(){
  if(window.SOLUM_RPA_APP) return;
  window.SOLUM_RPA_APP = true;

  const BASE = 'https://raw.githubusercontent.com/andreylson12/solum-rpa/main/';

  async function carregar(nome){
    const url = BASE + nome + '?v=' + Date.now();
    const codigo = await fetch(url).then(r=>{
      if(!r.ok) throw new Error('Erro ao carregar ' + nome);
      return r.text();
    });
    eval(codigo);
    console.log('✅ Carregado:', nome);
  }

  await carregar('loader.js');

  if(!window.SOLUM || !SOLUM.loader){
    throw new Error('Loader não carregou.');
  }

  await SOLUM.loader.boot({
    base: BASE,
    carregar
  });
})();
