(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.ui) return;

  const UI = {
    logs:null,

    iniciar(){
      this.criarPainel();

      SOLUM.engine.on('log', log=>{
        this.adicionarLog(log);
      });

      SOLUM.engine.log('UI iniciada.', 'ok');
    },

    criarPainel(){
      if(document.querySelector('#solum-rpa')) return;

      const div = document.createElement('div');
      div.id = 'solum-rpa';

      div.style = `
        position:fixed;
        top:90px;
        right:20px;
        width:330px;
        background:#fff;
        border-radius:10px;
        box-shadow:0 5px 15px rgba(0,0,0,.25);
        border:1px solid #ddd;
        z-index:999999;
        font-family:Arial;
      `;

      div.innerHTML = `
        <div style="background:#146b3a;color:white;padding:10px;border-radius:10px 10px 0 0;font-weight:bold;">
          🤖 SOLUM RPA
        </div>

        <div style="padding:10px;">
          <button id="btnCarregarArquivos" style="${this.btn('#7c3aed')}">
            📦 Carregar Arquivos
          </button>

          <button id="btnTeste" style="${this.btn('#146b3a')}">
            Testar Engine
          </button>

          <hr>

          <div id="statusArquivos" style="font-size:12px;margin-bottom:8px;">
            Nenhum arquivo carregado.
          </div>

          <div id="dadosOrdem" style="
            background:#f8f8f8;
            border:1px solid #ddd;
            border-radius:6px;
            padding:8px;
            margin-bottom:8px;
            font-size:12px;
          ">
            <b>📄 Dados da Ordem</b>
            <div id="dadosConteudo" style="margin-top:8px;color:#555;">
              Nenhuma ordem carregada.
            </div>
          </div>

          <div id="statusValidacao" style="
            margin-top:8px;
            margin-bottom:8px;
            padding:8px;
            border-radius:6px;
            background:#eee;
            font-size:12px;
            font-weight:bold;
            text-align:center;
          ">
            Aguardando leitura...
          </div>

          <div id="logsSolum" style="max-height:250px;overflow:auto;font-size:12px;"></div>
        </div>
      `;

      document.body.appendChild(div);

      this.logs = document.querySelector('#logsSolum');

      document.querySelector('#btnTeste').onclick = ()=>{
        SOLUM.engine.log('Botão funcionando.', 'ok');
      };

      document.querySelector('#btnCarregarArquivos').onclick = ()=>{
        SOLUM.engine.executar('carregarArquivos');
      };

      SOLUM.engine.on('arquivos', arquivos=>{
        this.mostrarArquivos(arquivos);
      });

      SOLUM.engine.on('dadosOrdem', dados=>{
        this.mostrarDadosOrdem(dados);
      });

      SOLUM.engine.on('validacaoOrdem', validacao=>{
        this.mostrarValidacao(validacao);
      });
    },

    btn(cor){
      return `
        width:100%;
        padding:8px;
        background:${cor};
        color:white;
        border:none;
        border-radius:5px;
        cursor:pointer;
        margin-bottom:6px;
        font-weight:bold;
      `;
    },

    mostrarArquivos(a){
      const el = document.querySelector('#statusArquivos');
      if(!el) return;

      el.innerHTML = `
        <b>Arquivos:</b><br>
        XML: ${a.xml ? '✅' : '❌'}<br>
        Planilha: ${a.planilha ? '✅' : '❌'}<br>
        Ordem: ${a.ordem ? '✅' : '❌'}<br>
        Laudo: ${a.laudo ? '✅' : '❌'}<br>
        Pesagem: ${a.pesagem ? '✅' : '❌'}<br>
        Extras: ${a.extras.length}
      `;
    },

    mostrarDadosOrdem(d){
      const el = document.querySelector('#dadosConteudo');
      if(!el) return;

      el.innerHTML = `
        <table style="width:100%;font-size:12px;">
          <tr><td><b>Transportadora</b></td><td>${d.transportadora||''}</td></tr>
          <tr><td><b>Motorista</b></td><td>${d.motorista||''}</td></tr>
          <tr><td><b>CPF</b></td><td>${d.cpfMotorista||''}</td></tr>
          <tr><td><b>Cavalo</b></td><td>${d.placaCavalo||''}</td></tr>
          <tr><td><b>Carreta 1</b></td><td>${d.placaCarreta1||''}</td></tr>
          <tr><td><b>Carreta 2</b></td><td>${d.placaCarreta2||''}</td></tr>
          <tr><td><b>Carreta 3</b></td><td>${d.placaCarreta3||''}</td></tr>
          <tr><td><b>UF</b></td><td>${d.uf||''}</td></tr>
          <tr><td><b>Tipo</b></td><td>${d.tipoVeiculo||''}</td></tr>
        </table>
      `;
    },

    mostrarValidacao(v){
      const el = document.querySelector('#statusValidacao');
      if(!el) return;

      if(v.valido){
        el.style.background = '#d4edda';
        el.style.color = '#155724';
        el.innerHTML = `✅ ORDEM VALIDADA<br>Confiança: ${v.percentual}%`;
      }else{
        el.style.background = '#fff3cd';
        el.style.color = '#856404';
        el.innerHTML = `
          ⚠️ DADOS INCOMPLETOS<br>
          Confiança: ${v.percentual}%<br><br>
          Faltando:<br>
          ${v.faltando.join('<br>')}
        `;
      }
    },

    adicionarLog(log){
      if(!this.logs) return;

      const linha = document.createElement('div');
      linha.style = 'padding:4px;border-bottom:1px solid #eee;';
      linha.innerHTML = `<b>${log.hora}</b><br>${log.mensagem}`;
      this.logs.prepend(linha);
    }
  };

  SOLUM.ui = UI;
})();
