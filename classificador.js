(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.classificador) return;

  const Classificador = {
    normalizar(t){
      return String(t||'')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g,'')
        .replace(/\s+/g,' ')
        .trim();
    },

    score(t, palavras){
      return palavras.filter(p=>t.includes(p)).length;
    },

    async classificar(file){
      const nome = file.name.toLowerCase();

      if(nome.endsWith('.xml')){
        return {tipo:'xml', confianca:100, metodo:'extensao'};
      }

      if(nome.endsWith('.xlsx') || nome.endsWith('.xls') || nome.endsWith('.xlsm') || nome.endsWith('.csv')){
        return {tipo:'planilha', confianca:100, metodo:'extensao'};
      }

      if(!nome.endsWith('.pdf')){
        return {tipo:'desconhecido', confianca:0, metodo:'desconhecido'};
      }

      let texto = '';

      try{
        texto = await SOLUM.pdf.ler(file);
      }catch(e){
        SOLUM.engine.log('Não consegui ler PDF: ' + file.name, 'erro');
      }

      const t = this.normalizar(texto + ' ' + nome);

      const ordemScore = this.score(t, [
        'ORDEM DE CARREGAMENTO',
        'MOTORISTA',
        'CPF',
        'PLACA',
        'CAVALO',
        'CARRETA',
        'VEICULO',
        'TRANSPORTADORA'
      ]);

      const laudoScore = this.score(t, [
        'LAUDO',
        'CLASSIFICACAO',
        'UMIDADE',
        'IMPUREZAS',
        'AVARIADOS',
        'QUEBRADOS'
      ]);

      const pesagemScore = this.score(t, [
        'PESAGEM',
        'PESO BRUTO',
        'PESO LIQUIDO',
        'TARA',
        'BALANCA'
      ]);

      if(ordemScore >= 3 && ordemScore >= laudoScore && ordemScore >= pesagemScore){
        return {tipo:'ordem', confianca:90, metodo:'conteudo-estrutura'};
      }

      if(laudoScore >= 2){
        return {tipo:'laudo', confianca:90, metodo:'conteudo'};
      }

      if(pesagemScore >= 2){
        return {tipo:'pesagem', confianca:90, metodo:'conteudo'};
      }

      return {tipo:'desconhecido', confianca:0, metodo:'sem-fallback'};
    }
  };

  SOLUM.classificador = Classificador;
})();
