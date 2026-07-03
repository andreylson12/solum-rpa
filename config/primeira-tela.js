(function(){
  window.SOLUM = window.SOLUM || {};
  SOLUM.config = SOLUM.config || {};

  SOLUM.config.primeiraTela = {
    unidadeNegocio: 'Armazém',
    processo: 'Entrada',
    tipoTransporte: 'MERCOSUL',
    operacao: '4 - RECEPÇÃO COMPRA PJ/PF - MOD55',
    material: 'SOJA EM GRAOS CLASSE AMARELA',
    safra: '2025/2026',
    deposito: 'FOB',

    naoPreencher: [
      'Transportadora',
      'D. Destino',
      'Observação',
      'Local de Armazenagem'
    ]
  };
})();
