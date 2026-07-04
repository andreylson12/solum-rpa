(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.xlsxReader) return;

  const XlsxReader = {

    async ler(file){

      SOLUM.engine.log("Lendo planilha...", "info");

      const buffer = await file.arrayBuffer();

      const wb = XLSX.read(buffer,{
        type:"array"
      });

      const ws = wb.Sheets[wb.SheetNames[0]];

      const linhas = XLSX.utils.sheet_to_json(ws,{
        defval:"",
        raw:false
      });

      if(!linhas.length)
        throw new Error("Planilha vazia.");

      const l = linhas[0];

      const dados = {

        centro: l.CENTRO || l.Centro || "",

        produtor: l.PRODUTOR || l.Produtor || "",

        bp: l.BP || "",

        enderecoRemessa:
          l["ENDEREÇO REMESSA"] ||
          l["END REMESSA"] ||
          "",

        bpRemessa:
          l["BP REMESSA"] ||
          l["BP_REMESSA"] ||
          "",

        contrato:
          l.CONTRATO || "",

        op:
          l.OP || "",

        opSaida:
          l["OP SAIDA"] ||
          l["OP_SAIDA"] ||
          "",

        descarga:
          l.DESCARGA || "",

        material:
          l.MATERIAL || ""
      };

      SOLUM.engine.estado.dados.planilha = dados;

      SOLUM.engine.log("Planilha lida com sucesso.","ok");

      return dados;

    }

  };

  SOLUM.xlsxReader = XlsxReader;

})();
