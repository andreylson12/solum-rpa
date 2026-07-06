(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.xmlReader) return;

  const XmlReader = {

    async ler(file){
      SOLUM.engine.log("Lendo XML da NF...", "info");

      const texto = await file.text();

      const parser = new DOMParser();
      const xml = parser.parseFromString(texto, "text/xml");

      const erro = xml.querySelector("parsererror");
      if(erro){
        throw new Error("XML inválido.");
      }

      const dados = {
        chave: this.chave(xml),
        numero: this.valor(xml, "nNF"),
        serie: this.valor(xml, "serie"),
        modelo: this.valor(xml, "mod"),
        dataEmissao: this.dataBR(this.valor(xml, "dhEmi") || this.valor(xml, "dEmi")),
        valorTotal: this.valor(xml, "vNF"),
        peso: this.valor(xml, "qVol") || this.valor(xml, "pesoL") || this.valor(xml, "pesoB"),

        produtor: this.valor(xml, "xNome"),
        cpfCnpj: this.valor(xml, "CPF") || this.valor(xml, "CNPJ"),
        inscricaoEstadual: this.valor(xml, "IE"),

        uf: this.valor(xml, "UF"),
        municipio: this.valor(xml, "xMun"),
        fazenda: this.valor(xml, "xFant") || this.valor(xml, "xNome"),

        cfop: this.valor(xml, "CFOP"),
        protocolo: this.valor(xml, "nProt"),

        textoOriginal: texto
      };

      SOLUM.context.dados.xml = dados;
      SOLUM.engine.estado.dados.xml = dados;

      SOLUM.engine.log("XML lido: NF " + dados.numero + " Série " + dados.serie, "ok");

      return dados;
    },

    valor(xml, tag){
      const el = xml.getElementsByTagName(tag)[0];
      return el ? String(el.textContent || "").trim() : "";
    },

    chave(xml){
      const infNFe = xml.getElementsByTagName("infNFe")[0];
      if(infNFe){
        const id = infNFe.getAttribute("Id") || "";
        return id.replace(/^NFe/i, "").trim();
      }

      const chNFe = this.valor(xml, "chNFe");
      return chNFe || "";
    },

    dataBR(data){
      if(!data) return "";

      const d = String(data).substring(0,10);

      if(d.includes("-")){
        const [ano, mes, dia] = d.split("-");
        return `${dia}/${mes}/${ano}`;
      }

      return d;
    }

  };

  SOLUM.xmlReader = XmlReader;
})();
