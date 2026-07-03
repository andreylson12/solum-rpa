(async function(){
  if(window.SOLUM_RPA_APP) return;
  window.SOLUM_RPA_APP = true;

  const BASE = 'https://raw.githubusercontent.com/andreylson12/solum-rpa/main/';

  async function carregarScript(nome){
    const url = BASE + nome + '?v=' + Date.now();

    const codigo = await fetch(url).then(r=>{
      if(!r.ok) throw new Error('Erro ao carregar ' + nome);
      return r.text();
    });

    eval(codigo);
    console.log('✅ Carregado:', nome);
  }

await carregarScript('engine.js');
await carregarScript('ui.js');

window.SolumEngine.iniciar();
window.SolumUI.iniciar();
