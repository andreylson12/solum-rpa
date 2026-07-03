(function(){
  window.SOLUM = window.SOLUM || {};
  if(SOLUM.primeiraTela) return;

  const PrimeiraTela = {
    async executar(){
      const cfg = SOLUM.config.primeiraTela;
      const ordem = SOLUM.engine.estado.dados.ordem || {};

      if(!ordem || !ordem.placaCavalo){
        alert('Carregue e valide a ordem antes de preencher a primeira tela.');
        return;
      }

      SOLUM.engine.log('Iniciando preenchimento da primeira tela...', 'info');

      await SOLUM.actions.selecionarSelector('#unidadeNegocio', cfg.unidadeNegocio);
      await SOLUM.actions.esperar(800);

      await SOLUM.actions.selecionarSelector('#processo', cfg.processo);
      await SOLUM.actions.esperarHabilitar('#operacao');
      await SOLUM.actions.esperarOpcoes('#operacao', 2);

      await SOLUM.actions.selecionarSelector('#tipoTransporte', cfg.tipoTransporte);

      await SOLUM.actions.preencherSelector('#placa', ordem.placaCavalo);
      await SOLUM.actions.selecionarUF('#uf', ordem.uf);
      await SOLUM.actions.selecionarSelector('#tipoVeiculo', ordem.tipoVeiculo);
      await SOLUM.actions.preencherSelector('#nomeMotorista', ordem.motorista);

      await SOLUM.actions.selecionarSelector('#operacao', cfg.operacao);
      await SOLUM.actions.selecionarSelector('#material', cfg.material);
      await SOLUM.actions.selecionarSelector('#safra', cfg.safra);
      await SOLUM.actions.selecionarSelector('#deposito', cfg.deposito);

      SOLUM.engine.log('Primeira tela preenchida.', 'ok');
    }
  };

  SOLUM.primeiraTela = PrimeiraTela;
})();
