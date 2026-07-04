(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.arquivos) return;

  const Arquivos = {

    escolher(){
      return new Promise(resolve=>{
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ".xml,.xlsx,.xls,.xlsm,.csv,.pdf,image/*";
        input.onchange = ()=>resolve([...input.files]);
        input.click();
      });
    },

    async processarOrdem(file, resultado){
      if(SOLUM.context.validacao.ordem && SOLUM.context.validacao.ordem.valido){
        SOLUM.engine.log("Ordem já validada. Ignorando nova tentativa: " + file.name, "info");
        return true;
      }

      const texto = await SOLUM.pdf.ler(file);
      const dadosOrdem = SOLUM.parsers.extrair(texto);

      if(!dadosOrdem || dadosOrdem.transportadora === "NÃO IDENTIFICADA"){
        SOLUM.engine.log("PDF não reconhecido como ordem válida: " + file.name, "info");
        return false;
      }

      const validacao = SOLUM.validadorOrdem.validar(dadosOrdem);

      if(!validacao.valido){
        SOLUM.engine.log("Ordem encontrada, mas dados incompletos: " + file.name, "info");
        return false;
      }

      resultado.ordem = file;

      SOLUM.context.textos.ordem = texto;
      SOLUM.context.dados.ordem = dadosOrdem;
      SOLUM.context.validacao.ordem = validacao;

      SOLUM.engine.estado.textos = SOLUM.engine.estado.textos || {};
      SOLUM.engine.estado.dados = SOLUM.engine.estado.dados || {};

      SOLUM.engine.estado.textos.ordem = texto;
      SOLUM.engine.estado.dados.ordem = dadosOrdem;
      SOLUM.engine.estado.validacaoOrdem = validacao;

      SOLUM.engine.log("ORDEM processada: " + file.name, "ok");
      SOLUM.engine.log(
        `Validação: ${validacao.percentual}% (${validacao.status})`,
        "ok"
      );

      SOLUM.engine.emitir("dadosOrdem", dadosOrdem);
      SOLUM.engine.emitir("validacaoOrdem", validacao);

      return true;
    },

    async carregar(){
      SOLUM.engine.log("Selecionando arquivos...", "info");

      const files = await this.escolher();

      SOLUM.context.reset();

      SOLUM.engine.estado.textos = {};
      SOLUM.engine.estado.dados = {};
      SOLUM.engine.estado.validacaoOrdem = null;

      SOLUM.engine.emitir("dadosOrdem", {});
      SOLUM.engine.emitir("validacaoOrdem", {
        valido:false,
        percentual:0,
        faltando:["Ordem"]
      });

      const resultado = {
        xml:null,
        planilha:null,
        ordem:null,
        laudo:null,
        pesagem:null,
        extras:[]
      };

      const pdfs = [];

      for(const file of files){
        const nome = file.name.toLowerCase();

        if(nome.endsWith(".pdf")){
          pdfs.push(file);
          continue;
        }

        const info = await SOLUM.classificador.classificar(file);

        if(info.tipo === "xml" && !resultado.xml){
          resultado.xml = file;
          SOLUM.engine.log(`XML identificado: ${file.name} (${info.metodo})`, "ok");
          continue;
        }

        if(info.tipo === "planilha" && !resultado.planilha){
          resultado.planilha = file;
          SOLUM.engine.log(`PLANILHA identificado: ${file.name} (${info.metodo})`, "ok");

          const dadosPlanilha = await SOLUM.xlsxReader.ler(file);

          SOLUM.context.dados.planilha = dadosPlanilha;
          SOLUM.engine.estado.dados.planilha = dadosPlanilha;

          SOLUM.engine.emitir("dadosPlanilha", dadosPlanilha);
          SOLUM.engine.log("Planilha processada.", "ok");
          continue;
        }

        resultado.extras.push(file);
        SOLUM.engine.log("Arquivo extra: " + file.name, "info");
      }

      for(const file of pdfs){
        const info = await SOLUM.classificador.classificar(file);

        if(info.tipo === "laudo" && !resultado.laudo){
          resultado.laudo = file;
          SOLUM.engine.log(`LAUDO identificado: ${file.name} (${info.metodo})`, "ok");
          SOLUM.engine.log("Laudo identificado. Leitor de laudo será conectado depois.", "info");
          continue;
        }

        if(info.tipo === "pesagem" && !resultado.pesagem){
          resultado.pesagem = file;
          SOLUM.engine.log(`PESAGEM identificado: ${file.name} (${info.metodo})`, "ok");
          SOLUM.engine.log("Pesagem identificada. Leitor de pesagem será conectado depois.", "info");
          continue;
        }

        if(info.tipo === "ordem" || info.tipo === "desconhecido"){
          const ok = await this.processarOrdem(file, resultado);

          if(ok){
            continue;
          }
        }

        resultado.extras.push(file);
        SOLUM.engine.log("Arquivo extra: " + file.name, "info");
      }

      if(!resultado.ordem){
        SOLUM.engine.log("Nenhuma ordem válida foi encontrada nos arquivos selecionados.", "erro");
      }

      SOLUM.context.arquivos = resultado;
      SOLUM.engine.estado.arquivos = resultado;
      SOLUM.engine.emitir("arquivos", resultado);

      SOLUM.engine.log("Todos os arquivos foram processados.", "ok");

      return resultado;
    }
  };

  SOLUM.arquivos = Arquivos;
})();
