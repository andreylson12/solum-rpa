// =====================================================
// REGRA RODOVIVA TRANSPORTES
// =====================================================
if(/RODOVIVA/i.test(texto)){

  const pegar = (regex, padrao = '') => {
    const m = texto.match(regex);
    return m ? String(m[1] || '').replace(/\s+/g, ' ').trim() : padrao;
  };

  const somenteNumeros = valor =>
    String(valor || '').replace(/\D/g, '');

  const limparPlaca = valor =>
    String(valor || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .trim();

  const motorista = pegar(
    /SOLICITAMOS\s+ENTREGAR\s+AO\s+MOTORISTA\s+SR\.?\s*[:\-]?\s*([\s\S]*?)(?=\s+CPF\s*:)/i
  );

  const cpf = somenteNumeros(
    pegar(/CPF\s*:\s*([\d.\-]+)/i)
  );

  const rg = somenteNumeros(
    pegar(/RG\s*:\s*([\d.\-]+)/i)
  );

  const cnh = somenteNumeros(
    pegar(/CNH\s*:\s*([\d.\-]+)/i)
  );

  const placaCavalo = limparPlaca(
    pegar(/CAVALO\s*:\s*([A-Z0-9\-]+)/i)
  );

  const carreta1 = limparPlaca(
    pegar(/CARRETA\s*1\s*:\s*([A-Z0-9\-]+)/i)
  );

  const carreta2 = limparPlaca(
    pegar(/CARRETA\s*2\s*:\s*([A-Z0-9\-]+)/i)
  );

  const cidade = pegar(
    /CIDADE\s*:\s*([\s\S]*?)(?=\s+UF\s*:)/i
  );

  const uf = pegar(
    /UF\s*:\s*([A-Z]{2})/i
  ).toUpperCase();

  const antt = somenteNumeros(
    pegar(/ANTT\s*:\s*([\d.\-]+)/i)
  );

  let tipoVeiculo = pegar(
    /(?:TIPO\s+REMESSA|TIPO)\s+(?:REMESSA\s+)?[\s\S]*?(RODO[\s\-]?TREM\s*9\s*EIXO|RODOTREM\s*9\s*EIXO|BI[\s\-]?TREM\s*7\s*EIXO|CARRETA\s*LS\s*6\s*EIXO)/i
  );

  // Busca alternativa para o tipo de veículo
  if(!tipoVeiculo){
    tipoVeiculo = pegar(
      /(RODO[\s\-]?TREM\s*9\s*EIXO|RODOTREM\s*9\s*EIXO|BI[\s\-]?TREM\s*7\s*EIXO|CARRETA\s*LS\s*6\s*EIXO)/i
    );
  }

  // Padronização do tipo
  const tipoNormalizado = normalizar(tipoVeiculo);

  if(/RODO\s*TREM.*9\s*EIXO/.test(tipoNormalizado)){
    tipoVeiculo = 'RODO-TREM 9 EIXO';
  }else if(/BI\s*TREM.*7\s*EIXO/.test(tipoNormalizado)){
    tipoVeiculo = 'BI-TREM 7 EIXO';
  }else if(/CARRETA.*6\s*EIXO/.test(tipoNormalizado)){
    tipoVeiculo = 'CARRETA LS 6 EIXO';
  }

  return {
    parser: 'RODOVIVA',

    transportadora: 'RODOVIVA TRANSPORTES LTDA',

    motorista,
    cpf,
    rg,
    cnh,

    placaCavalo,
    placa: placaCavalo,

    carreta1,
    carreta2,
    carreta3: '',

    cidade,
    uf,
    antt,

    tipoVeiculo
  };
}
