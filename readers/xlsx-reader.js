(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.xlsxReader) return;

  const XlsxReader = {
    abaPadrao: "Andreylson",

    normalizar(t){
      return String(t || "")
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    },

    nomeCampo(c){
      const n = this.normalizar(c);

      if(n === "CENTRO") return "centro";
      if(n === "PRODUTO" || n === "PRODUTOR") return "produtor";
      if(n === "BP") return "bp";
      if(n.includes("END REMESSA")) return "enderecoRemessa";
      if(n.includes("BP REMESSA")) return "bpRemessa";
      if(n === "OP") return "op";
      if(n.includes("CONTRATO")) return "contrato";
      if(n.includes("DESCARGA")) return "descarga";
      if(n.includes("OFL") || n.includes("OV")) return "oflOv";

      return n.toLowerCase().replace(/\s+/g, "_");
    },

    async ler(file){
      SOLUM.engine.log("Lendo planilha...", "info");

      const buffer = await file.arrayBuffer();

      const wb = XLSX.read(buffer, {
        type: "array",
        cellDates: false
      });

      const nomeAba = wb.SheetNames.find(n =>
        this.normalizar(n) === this.normalizar(this.abaPadrao)
      );

      if(!nomeAba){
        throw new Error("Aba não encontrada: " + this.abaPadrao);
      }

      const ws = wb.Sheets[nomeAba];

      const matriz = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
        raw: false
      });

      let linhaResultado = -1;

      for(let i = 0; i < matriz.length; i++){
        const linhaTxt = this.normalizar(matriz[i].join(" "));
        if(linhaTxt.includes("RESULTADOS DA BUSCA")){
          linhaResultado = i;
          break;
        }
      }

      if(linhaResultado < 0){
        throw new Error("RESULTADOS DA BUSCA não encontrado na aba " + nomeAba);
      }

      let linhaCabecalho = -1;

      for(let i = linhaResultado + 1; i < matriz.length; i++){
        const linhaTxt = this.normalizar(matriz[i].join(" "));
        if(linhaTxt.includes("CENTRO") && linhaTxt.includes("BP") && linhaTxt.includes("REMESSA")){
          linhaCabecalho = i;
          break;
        }
      }

      if(linhaCabecalho < 0){
        throw new Error("Cabeçalho dos resultados não encontrado.");
      }

      const cabecalho = matriz[linhaCabecalho].map(c => this.nomeCampo(c));

      const resultados = [];

      for(let i = linhaCabecalho + 1; i < matriz.length; i++){
        const linha = matriz[i];

        const vazia = linha.every(c => String(c || "").trim() === "");
        if(vazia) continue;

        const obj = {};

        cabecalho.forEach((campo, idx)=>{
          if(!campo) return;
          obj[campo] = String(linha[idx] || "").trim();
        });

        if(!obj.bp && !obj.bpRemessa && !obj.produtor) continue;

        resultados.push(obj);
      }

      const dados = {
        aba: nomeAba,
        resultados,
        primeiro: resultados[0] || {},
        bpRemessa: resultados[0]?.bpRemessa || "",
        enderecoRemessa: resultados[0]?.enderecoRemessa || "",
        produtor: resultados[0]?.produtor || ""
      };

      SOLUM.context.dados.planilha = dados;
      SOLUM.engine.estado.dados.planilha = dados;

      SOLUM.engine.log(
        "Planilha lida: " + resultados.length + " resultados encontrados.",
        "ok"
      );

      return dados;
    }
  };

  SOLUM.xlsxReader = XlsxReader;
})();
