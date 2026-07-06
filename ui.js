(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.ui) return;

  const UI = {

    logs:null,

    iniciar(){

      this.criarPainel();

      SOLUM.engine.on("log",log=>{
        this.adicionarLog(log);
      });

      SOLUM.engine.on("arquivos",a=>{
        this.mostrarArquivos(a);
      });

      SOLUM.engine.on("dadosOrdem",d=>{
        this.mostrarDadosOrdem(d);
      });

      SOLUM.engine.on("validacaoOrdem",v=>{
        this.mostrarValidacao(v);
      });

      SOLUM.engine.log("UI iniciada.","ok");

    },

    criarPainel(){

      if(document.querySelector("#solum-rpa")) return;

      const div=document.createElement("div");

      div.id="solum-rpa";

      div.style=`
        position:fixed;
        top:90px;
        right:20px;
        width:340px;
        background:#fff;
        border-radius:10px;
        border:1px solid #ddd;
        box-shadow:0 5px 18px rgba(0,0,0,.25);
        z-index:999999;
        font-family:Arial;
      `;

      div.innerHTML=`

        <div style="
            background:#146b3a;
            color:#fff;
            padding:10px;
            font-weight:bold;
            border-radius:10px 10px 0 0;
        ">
            🤖 SOLUM RPA
        </div>

        <div style="padding:10px">

            <button id="btnBaixarTicket" style="${this.btn("#0f766e")}">
                ⬇ Baixar Arquivos Ticket
            </button>

            <button id="btnCarregarArquivos" style="${this.btn("#7c3aed")}">
                📦 Carregar Arquivos
            </button>

            <button id="btnIniciarTroca" style="${this.btn("#16a34a")}">
                🚀 Iniciar Troca
            </button>

            <button id="btnNotaFiscal" style="${this.btn("#0891b2")}">
                🧾 Testar Nota Fiscal
            </button>

            <button id="btnMapearTela" style="${this.btn("#2563eb")}">
                🔍 Mapear Tela
            </button>

            <button id="btnTeste" style="${this.btn("#555")}">
                Testar Engine
            </button>

            <hr>

            <div id="statusArquivos"
                style="
                    font-size:12px;
                    margin-bottom:10px;
                ">
                Nenhum arquivo carregado.
            </div>

            <div id="dadosOrdem"
                style="
                    background:#f8f8f8;
                    border:1px solid #ddd;
                    border-radius:6px;
                    padding:8px;
                    margin-bottom:10px;
                    font-size:12px;
                ">

                <b>📄 Dados da Ordem</b>

                <div id="dadosConteudo"
                     style="margin-top:8px;color:#555">

                     Nenhuma ordem carregada.

                </div>

            </div>

            <div id="statusValidacao"
                style="
                    background:#eee;
                    border-radius:6px;
                    padding:8px;
                    font-size:12px;
                    font-weight:bold;
                    text-align:center;
                    margin-bottom:10px;
                ">

                Aguardando leitura...

            </div>

            <div id="logsSolum"
                style="
                    max-height:260px;
                    overflow:auto;
                    font-size:12px;
                ">
            </div>

        </div>

      `;

      document.body.appendChild(div);

      this.logs=document.querySelector("#logsSolum");

      document.querySelector("#btnBaixarTicket").onclick=()=>{
          SOLUM.engine.executar("baixarArquivosTicket");
      };

      document.querySelector("#btnCarregarArquivos").onclick=()=>{
          SOLUM.engine.executar("carregarArquivos");
      };

      document.querySelector("#btnIniciarTroca").onclick=()=>{
          SOLUM.engine.executar("iniciarTroca");
      };

      document.querySelector("#btnNotaFiscal").onclick=()=>{
          SOLUM.engine.executar("notaFiscal");
      };

      document.querySelector("#btnMapearTela").onclick=()=>{
          SOLUM.engine.executar("mapearTela");
      };

      document.querySelector("#btnTeste").onclick=()=>{
          SOLUM.engine.log("Teste executado.","ok");
      };

    },

    btn(cor){

      return `
        width:100%;
        padding:9px;
        margin-bottom:6px;
        background:${cor};
        color:#fff;
        border:none;
        border-radius:5px;
        cursor:pointer;
        font-weight:bold;
      `;

    },

    mostrarArquivos(a){

      const el=document.querySelector("#statusArquivos");

      if(!el) return;

      el.innerHTML=`
        <b>Arquivos</b><br>

        XML: ${a.xml?"✅":"❌"}<br>
        Planilha: ${a.planilha?"✅":"❌"}<br>
        Ordem: ${a.ordem?"✅":"❌"}<br>
        Laudo: ${a.laudo?"✅":"❌"}<br>
        Pesagem: ${a.pesagem?"✅":"❌"}<br>
        Extras: ${a.extras.length}
      `;

    },

    mostrarDadosOrdem(d){

      const el=document.querySelector("#dadosConteudo");

      if(!el) return;

      el.innerHTML=`

        <table style="width:100%;font-size:12px">

        <tr><td><b>Motorista</b></td><td>${d.motorista||""}</td></tr>

        <tr><td><b>Placa</b></td><td>${d.placaCavalo||""}</td></tr>

        <tr><td><b>UF</b></td><td>${d.uf||""}</td></tr>

        <tr><td><b>Tipo</b></td><td>${d.tipoVeiculo||""}</td></tr>

        </table>

      `;

    },

    mostrarValidacao(v){

      const el=document.querySelector("#statusValidacao");

      if(!el) return;

      if(v.valido){

          el.style.background="#d4edda";
          el.style.color="#155724";

          el.innerHTML=`
              ✅ Ordem Validada<br>
              ${v.percentual}%
          `;

      }else{

          el.style.background="#fff3cd";
          el.style.color="#856404";

          el.innerHTML=`
              ⚠ Dados incompletos<br>
              ${v.percentual}%<br><br>
              ${v.faltando.join("<br>")}
          `;

      }

    },

    adicionarLog(log){

      if(!this.logs) return;

      const linha=document.createElement("div");

      linha.style=`
          padding:5px;
          border-bottom:1px solid #eee;
      `;

      linha.innerHTML=`
        <b>${log.hora}</b><br>
        ${log.mensagem}
      `;

      this.logs.prepend(linha);

    }

  };

  SOLUM.ui=UI;

})();
