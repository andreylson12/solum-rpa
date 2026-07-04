(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.arquivos) return;

  const Arquivos = {

    escolher(){
      return new Promise(resolve=>{
        const input=document.createElement("input");
        input.type="file";
        input.multiple=true;
        input.accept=".xml,.xlsx,.xls,.xlsm,.csv,.pdf,image/*";
        input.onchange=()=>resolve([...input.files]);
        input.click();
      });
    },

    async carregar(){

      SOLUM.engine.log("Selecionando arquivos...","info");

      const files=await this.escolher();

      const resultado={
        xml:null,
        planilha:null,
        ordem:null,
        laudo:null,
        pesagem:null,
        extras:[]
      };

      SOLUM.engine.estado.textos={};
      SOLUM.engine.estado.dados=SOLUM.engine.estado.dados||{};

      for(const file of files){

        const info=await SOLUM.classificador.classificar(file);

        if(resultado[info.tipo]===null){

          resultado[info.tipo]=file;

          SOLUM.engine.log(
            `${info.tipo.toUpperCase()} identificado: ${file.name} (${info.metodo})`,
            "ok"
          );

          //===========================
          // PLANILHA
          //===========================

          if(info.tipo==="planilha"){

            const dadosPlanilha=
              await SOLUM.xlsxReader.ler(file);

            SOLUM.engine.estado.dados.planilha=dadosPlanilha;

            SOLUM.engine.emitir(
              "dadosPlanilha",
              dadosPlanilha
            );

            SOLUM.engine.log(
              "Planilha processada.",
              "ok"
            );

          }

          //===========================
          // ORDEM
          //===========================

          if(
            info.tipo==="ordem" &&
            file.name.toLowerCase().endsWith(".pdf")
          ){

            const texto=await SOLUM.pdf.ler(file);

            SOLUM.engine.estado.textos.ordem=texto;

            const dadosOrdem=
              SOLUM.parsers.extrair(texto);

            SOLUM.engine.estado.dados.ordem=dadosOrdem;

            const validacao=
              SOLUM.validadorOrdem.validar(dadosOrdem);

            SOLUM.engine.estado.validacaoOrdem=validacao;

            SOLUM.engine.log(
              `Validação: ${validacao.percentual}% (${validacao.status})`,
              validacao.valido ? "ok" : "info"
            );

            SOLUM.engine.emitir(
              "dadosOrdem",
              dadosOrdem
            );

            SOLUM.engine.emitir(
              "validacaoOrdem",
              validacao
            );

          }

          //===========================
          // XML
          //===========================

          if(info.tipo==="xml"){

            SOLUM.engine.log(
              "XML identificado. (Leitor será implementado na próxima etapa.)",
              "info"
            );

          }

          //===========================
          // LAUDO
          //===========================

          if(info.tipo==="laudo"){

            SOLUM.engine.log(
              "Laudo identificado. (Leitor será implementado na próxima etapa.)",
              "info"
            );

          }

          //===========================
          // PESAGEM
          //===========================

          if(info.tipo==="pesagem"){

            SOLUM.engine.log(
              "Pesagem identificada. (Leitor será implementado na próxima etapa.)",
              "info"
            );

          }

        }else{

          resultado.extras.push(file);

          SOLUM.engine.log(
            `Arquivo extra: ${file.name}`,
            "info"
          );

        }

      }

      SOLUM.engine.estado.arquivos=resultado;

      SOLUM.engine.emitir(
        "arquivos",
        resultado
      );

      SOLUM.engine.log(
        "Todos os arquivos foram processados.",
        "ok"
      );

      return resultado;

    }

  };

  SOLUM.arquivos=Arquivos;

})();
