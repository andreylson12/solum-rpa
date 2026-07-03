(function(){

if(window.SolumUI) return;

const UI = {

    painel:null,
    logs:null,

    iniciar(){

        this.criarPainel();

        SolumEngine.on("log",(log)=>{

            this.adicionarLog(log);

        });

        SolumEngine.log("UI iniciada.","ok");

    },

    criarPainel(){

        if(document.querySelector("#solum-rpa")) return;

        const div=document.createElement("div");

        div.id="solum-rpa";

        div.style=`
            position:fixed;
            top:90px;
            right:20px;
            width:320px;
            background:#fff;
            border-radius:10px;
            box-shadow:0 5px 15px rgba(0,0,0,.25);
            border:1px solid #ddd;
            z-index:999999;
            font-family:Arial;
        `;

        div.innerHTML=`

        <div style="
            background:#146b3a;
            color:white;
            padding:10px;
            border-radius:10px 10px 0 0;
            font-weight:bold;
        ">
            🤖 SOLUM RPA
        </div>

        <div style="padding:10px;">

            <button id="btnTeste" style="
                width:100%;
                padding:8px;
                background:#146b3a;
                color:white;
                border:none;
                border-radius:5px;
                cursor:pointer;
            ">
                Testar Engine
            </button>

            <hr>

            <div id="logsSolum"
                style="
                max-height:250px;
                overflow:auto;
                font-size:12px;
                ">
            </div>

        </div>

        `;

        document.body.appendChild(div);

        this.logs=document.querySelector("#logsSolum");

        document.querySelector("#btnTeste").onclick=()=>{

            SolumEngine.log("Botão funcionando.","ok");

        };

    },

    adicionarLog(log){

        const linha=document.createElement("div");

        linha.style=`
            padding:4px;
            border-bottom:1px solid #eee;
        `;

        linha.innerHTML=`
            <b>${log.hora}</b><br>
            ${log.mensagem}
        `;

        this.logs.prepend(linha);

    }

};

window.SolumUI=UI;

})();
