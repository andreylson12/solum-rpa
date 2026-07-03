(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.parserFuturo) return;

  const ParserFuturo = {
    nome: 'FUTURO',

    normalizar(t){
      return String(t||'')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g,'')
        .replace(/\s+/g,' ')
        .trim();
    },

    limparPlaca(v){
      return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').trim();
    },

    identificar(texto){
      const t = this.normalizar(texto);
      return t.includes('FUTURO LOGISTICA') || t.includes('FUTURO LOGÍSTICA');
    },

    achar(texto, ...regexes){
      for(const rx of regexes){
        const m = String(texto||'').match(rx);
        if(m && m[1]) return String(m[1]).replace(/\s+/g,' ').trim();
      }
      return '';
    },

    extrair(texto){
      const motorista = this.achar(texto,
        /motorista\s+Sr[:.\s]*([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+?)\s+CPF/i,
        /motorista\s+Sr[:.\s]*([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+)/i
      );

      const cpf = this.achar(texto,
        /CPF\s*[:.\s]*(\d{11})/i,
        /CPF\s*[:.\s]*(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/i
      ).replace(/\D/g,'');

      const placaCavalo = this.limparPlaca(this.achar(texto,
        /carro\s+de\s+placa\s+([A-Z]{3}\d[A-Z0-9]\d{2})/i,
        /placa\s+([A-Z]{3}\d[A-Z0-9]\d{2})/i
      ));

      const placaCarreta1 = this.limparPlaca(this.achar(texto,
        /Placa\s+01\s+([A-Z]{3}\d[A-Z0-9]\d{2})/i
      ));

      const placaCarreta2 = this.limparPlaca(this.achar(texto,
        /Placa\s+([A-Z]{3}\d[A-Z0-9]\d{2})\s+Placa\s+03/i
      ));

      const placaCarreta3 = this.limparPlaca(this.achar(texto,
        /Placa\s+03\s+([A-Z]{3}\d[A-Z0-9]\d{2})/i
      ));

      const uf = this.achar(texto,
        /Estado\s+(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)/i,
        /URUÇUI-PI\s+Estado\s+(PI)/i,
        /URUCUI-PI\s+Estado\s+(PI)/i
      ).toUpperCase() || 'PI';

      let tipoVeiculo = '';
      if(this.normalizar(texto).includes('VEICULO 9 EIXOS')){
        tipoVeiculo = 'RODO-TREM 9 EIXO';
      }

      return {
        transportadora: 'FUTURO LOGÍSTICA TRANSPORTES LTDA',
        motorista,
        cpfMotorista: cpf,
        placaCavalo,
        placaCarreta1,
        placaCarreta2,
        placaCarreta3,
        uf,
        tipoVeiculo,
        textoOriginal: texto
      };
    }
  };

  SOLUM.parserFuturo = ParserFuturo;

  if(SOLUM.parsers){
    SOLUM.parsers.registrar(ParserFuturo);
  }
})();
