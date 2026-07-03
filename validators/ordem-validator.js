(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.validadorOrdem) return;

  const ValidadorOrdem = {
    validar(d){
      const campos = [
        {nome:'Transportadora', chave:'transportadora', obrigatorio:true},
        {nome:'Motorista', chave:'motorista', obrigatorio:true},
        {nome:'CPF', chave:'cpfMotorista', obrigatorio:true},
        {nome:'Cavalo', chave:'placaCavalo', obrigatorio:true},
        {nome:'Carreta 1', chave:'placaCarreta1', obrigatorio:false},
        {nome:'Carreta 2', chave:'placaCarreta2', obrigatorio:false},
        {nome:'Carreta 3', chave:'placaCarreta3', obrigatorio:false},
        {nome:'UF', chave:'uf', obrigatorio:true},
        {nome:'Tipo veículo', chave:'tipoVeiculo', obrigatorio:true}
      ];

      const itens = campos.map(c=>{
        const valor = String(d[c.chave] || '').trim();

        return {
          nome:c.nome,
          chave:c.chave,
          obrigatorio:c.obrigatorio,
          ok:!!valor,
          valor
        };
      });

      const obrigatorios = itens.filter(i=>i.obrigatorio);
      const obrigatoriosOk = obrigatorios.filter(i=>i.ok);

      const valido = obrigatorios.length === obrigatoriosOk.length;
      const percentual = Math.round((itens.filter(i=>i.ok).length / itens.length) * 100);

      const faltando = itens
        .filter(i=>i.obrigatorio && !i.ok)
        .map(i=>i.nome);

      return {
        valido,
        percentual,
        itens,
        faltando,
        status: valido ? 'VALIDADA' : 'PENDENTE'
      };
    }
  };

  SOLUM.validadorOrdem = ValidadorOrdem;
})();
