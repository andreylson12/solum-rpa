(function () {
  window.SOLUM = window.SOLUM || {};

  delete window.SOLUM.notaFiscal;

  const NotaFiscal = {

    rodando: false,

    async executar() {
      if (this.rodando) {
        SOLUM.engine.log(
          'Nota Fiscal já está em execução.',
          'info'
        );
        return false;
      }

      this.rodando = true;

      try {
        const xml =
          SOLUM.context?.dados?.xml ||
          SOLUM.engine?.estado?.dados?.xml ||
          {};

        const planilha =
          SOLUM.context?.dados?.planilha ||
          SOLUM.engine?.estado?.dados?.planilha ||
          {};

        if (!xml.chave) {
          throw new Error(
            'XML da nota fiscal não foi lido.'
          );
        }

        const bpProdutor = this.obterBPProdutor(planilha);

        if (!bpProdutor) {
          throw new Error(
            'BP do produtor não encontrado na planilha.'
          );
        }

        SOLUM.engine.log(
          'Iniciando NF ' +
          (xml.numero || xml.nNF || ''),
          'info'
        );

        await this.abrirNovaNotaFiscal();

        await SOLUM.select.selecionarProdutor(
          bpProdutor
        );

        await SOLUM.select.selecionarFazendaPorIE(
          xml.inscricaoEstadual ||
          xml.ie ||
          ''
        );

        await SOLUM.select.selecionarModelo55();

        await this.preencherChave(xml.chave);
        await this.clicarLupaChave();

        await this.esperarNotaCarregada();
        await this.esperarSalvarHabilitado();

        /*
         * Antes de abrir o modal, guardamos os valores
         * que estiverem disponíveis na tela ou no XML.
         */
        const valores = this.obterValoresConfirmacao(xml);

        SOLUM.engine.log(
          'Peso interno preparado: ' + valores.peso,
          'info'
        );

        SOLUM.engine.log(
          'Valor interno preparado: ' + valores.valor,
          'info'
        );

        await this.clicarSalvar();

        await this.preencherConfirmacaoAngular(
          valores.peso,
          valores.valor
        );

        await this.clicarConfirmarValores();
        await this.clicarSimFinal();

        await this.esperarNotaNaTabela(
          xml.numero || xml.nNF || ''
        );

        SOLUM.engine.log(
          'Nota Fiscal salva com sucesso.',
          'ok'
        );

        return true;

      } catch (erro) {
        console.error(
          'Erro no módulo Nota Fiscal:',
          erro
        );

        SOLUM.engine.log(
          'Erro na Nota Fiscal: ' +
          (erro?.message || erro),
          'erro'
        );

        throw erro;

      } finally {
        this.rodando = false;
      }
    },

    obterBPProdutor(planilha) {
      return String(
        planilha?.bp ||
        planilha?.primeiro?.bp ||
        planilha?.resultados?.[0]?.bp ||
        ''
      ).replace(/\D/g, '');
    },

    async abrirNovaNotaFiscal() {
      if (this.telaNFAberta()) {
        SOLUM.engine.log(
          'Tela NF já está aberta.',
          'ok'
        );
        return true;
      }

      const botao = this.botaoPorTextoClasse(
        'Nova Nota Fiscal',
        'btn-novo-sesar'
      );

      if (!botao) {
        throw new Error(
          'Botão Nova Nota Fiscal não encontrado.'
        );
      }

      botao.click();

      SOLUM.engine.log(
        'Nova Nota Fiscal clicado.',
        'ok'
      );

      const abriu = await this.esperar(
        () => this.telaNFAberta(),
        15000
      );

      if (!abriu) {
        throw new Error(
          'Tela Nova Nota Fiscal não abriu.'
        );
      }
    },

    telaNFAberta() {
      return Boolean(
        document.querySelector('#fazenda') &&
        document.querySelector('#modeloNFId') &&
        document.querySelector('#chave')
      );
    },

    async preencherChave(chave) {
      const campo =
        document.querySelector('#chave');

      if (!campo) {
        throw new Error(
          'Campo chave não encontrado.'
        );
      }

      await this.setValor(campo, chave);

      SOLUM.engine.log(
        'Chave preenchida.',
        'ok'
      );
    },

    async clicarLupaChave() {
      const campo =
        document.querySelector('#chave');

      if (!campo) {
        throw new Error(
          'Campo chave não encontrado.'
        );
      }

      const grupo =
        campo.parentElement;

      const lupa =
        grupo?.querySelector('button') ||
        grupo?.querySelector('i')?.closest('button') ||
        grupo?.querySelector('i, span');

      if (!lupa) {
        throw new Error(
          'Lupa da chave não encontrada.'
        );
      }

      lupa.click();

      SOLUM.engine.log(
        'Lupa da chave clicada.',
        'ok'
      );
    },

    async esperarNotaCarregada() {
      const carregou = await this.esperar(() => {
        const serie =
          document.querySelector('#serie')?.value;

        const numero =
          document.querySelector('#numeroNF')?.value;

        const protocolo =
          document.querySelector('#numeroProtocolo')?.value;

        const emissao =
          document.querySelector('#emissao')?.value;

        const cfop =
          document.querySelector('#cfopId')?.value;

        const autenticacao =
          document.querySelector('#dataAutenticacao')?.value;

        const valorUnitario =
          document.querySelector('#valorUnitario')?.value;

        return Boolean(
          serie &&
          numero &&
          protocolo &&
          emissao &&
          cfop &&
          autenticacao &&
          valorUnitario
        );
      }, 30000);

      if (!carregou) {
        throw new Error(
          'NF não carregou todos os dados.'
        );
      }

      SOLUM.engine.log(
        'Dados da NF carregados.',
        'ok'
      );

      await SOLUM.actions.esperar(1000);
    },

    async esperarSalvarHabilitado() {
      const habilitou = await this.esperar(() => {
        const botao = this.botaoSalvarNF();

        if (!botao) return false;

        return (
          !botao.disabled &&
          !String(botao.className)
            .includes('disabled')
        );
      }, 20000);

      if (!habilitou) {
        throw new Error(
          'Botão Salvar não habilitou.'
        );
      }

      SOLUM.engine.log(
        'Salvar habilitado.',
        'ok'
      );
    },

    botaoSalvarNF() {
      return [
        ...document.querySelectorAll('button')
      ]
        .filter(botao =>
          botao.offsetParent !== null
        )
        .filter(botao =>
          !botao.closest('#solum-rpa')
        )
        .find(botao => {
          const texto = this.normalizar(
            botao.innerText ||
            botao.textContent
          );

          const classe =
            String(botao.className || '');

          return (
            texto === 'SALVAR' &&
            classe.includes(
              'button-sesar-verde-escuro'
            )
          );
        }) || null;
    },

    async clicarSalvar() {
      const botao =
        this.botaoSalvarNF();

      if (!botao) {
        throw new Error(
          'Botão Salvar da NF não encontrado.'
        );
      }

      botao.click();

      SOLUM.engine.log(
        'Salvar clicado.',
        'ok'
      );

      const abriu = await this.esperar(
        () => Boolean(
          document.querySelector(
            '#confirmacaoPeso'
          ) &&
          document.querySelector(
            '#confirmacaoValor'
          ) &&
          document.querySelector(
            'button.botaoConfirmacao'
          )
        ),
        15000
      );

      if (!abriu) {
        throw new Error(
          'Modal de confirmação de valores não abriu.'
        );
      }

      SOLUM.engine.log(
        'Modal de confirmação aberto.',
        'ok'
      );

      await SOLUM.actions.esperar(500);
    },

    obterValoresConfirmacao(xml) {
      const pesoTela =
        this.buscarValorCampoOuLabel(
          'pesoNF',
          'PESO'
        );

      const valorTela =
        this.buscarValorCampoOuLabel(
          'valorTotal',
          'VALOR TOTAL'
        );

      /*
       * Não usar qVol como peso.
       * qVol geralmente é quantidade de volumes,
       * por exemplo 47, e não o peso da carga.
       */
      const pesoBruto =
        pesoTela ||
        xml?.pesoNF ||
        xml?.pesoLiquido ||
        xml?.pesoL ||
        xml?.qTrib ||
        xml?.qCom ||
        xml?.peso ||
        '';

      const valorBruto =
        valorTela ||
        xml?.valorTotal ||
        xml?.vNF ||
        xml?.valorNota ||
        xml?.totalNota ||
        '';

      const peso =
        this.converterPesoInterno(pesoBruto);

      const valor =
        this.converterValorInterno(valorBruto);

      if (
        !Number.isFinite(peso) ||
        peso <= 0
      ) {
        console.log(
          'XML recebido:',
          xml
        );

        throw new Error(
          'Peso válido da NF não encontrado. ' +
          'O robô não utiliza qVol como peso.'
        );
      }

      if (
        !Number.isFinite(valor) ||
        valor <= 0
      ) {
        console.log(
          'XML recebido:',
          xml
        );

        throw new Error(
          'Valor total válido da NF não encontrado.'
        );
      }

      return {
        peso,
        valor
      };
    },

    buscarValorCampoOuLabel(id, textoLabel) {
      const direto =
        document.querySelector('#' + id);

      if (
        direto &&
        String(direto.value || '').trim()
      ) {
        return direto.value;
      }

      const alvo =
        this.normalizar(textoLabel);

      const elementos = [
        ...document.querySelectorAll(
          'label, div, span'
        )
      ];

      for (const elemento of elementos) {
        const texto = this.normalizar(
          elemento.innerText ||
          elemento.textContent
        );

        if (texto !== alvo) continue;

        const grupo =
          elemento.closest(
            '.form-group, .col-md-3, .col-md-4, .col-md-6'
          ) ||
          elemento.parentElement;

        const campo =
          grupo?.querySelector(
            'input, select, textarea'
          );

        if (
          campo &&
          String(campo.value || '').trim()
        ) {
          return campo.value;
        }

        const textoGrupo =
          String(
            grupo?.innerText ||
            grupo?.textContent ||
            ''
          ).trim();

        const linhas =
          textoGrupo
            .split(/\n+/)
            .map(linha => linha.trim())
            .filter(Boolean);

        if (linhas.length >= 2) {
          return linhas[linhas.length - 1];
        }
      }

      return '';
    },

    converterPesoInterno(valor) {
      if (
        typeof valor === 'number' &&
        Number.isFinite(valor)
      ) {
        return Math.round(valor);
      }

      let texto =
        String(valor || '').trim();

      if (!texto) return NaN;

      texto = texto.replace(/[^\d,.-]/g, '');

      /*
       * 47.880 ou 47,880 devem virar 47880.
       * Peso é comparado pelo SOLUM como número inteiro.
       */
      const somenteDigitos =
        texto.replace(/\D/g, '');

      if (!somenteDigitos) return NaN;

      return Number(somenteDigitos);
    },

    converterValorInterno(valor) {
      if (
        typeof valor === 'number' &&
        Number.isFinite(valor)
      ) {
        return valor;
      }

      let texto =
        String(valor || '').trim();

      if (!texto) return NaN;

      texto = texto
        .replace(/R\$/gi, '')
        .replace(/\s+/g, '');

      /*
       * Formato brasileiro:
       * 96.957,00 -> 96957
       */
      if (
        texto.includes(',') &&
        texto.includes('.')
      ) {
        texto = texto
          .replace(/\./g, '')
          .replace(',', '.');

        return Number(texto);
      }

      /*
       * Apenas vírgula:
       * 96957,00 -> 96957
       */
      if (texto.includes(',')) {
        texto = texto.replace(',', '.');
        return Number(texto);
      }

      /*
       * Formato vindo da API/XML:
       * 96957.00 -> 96957
       */
      return Number(
        texto.replace(/[^\d.-]/g, '')
      );
    },

    async preencherConfirmacaoAngular(
      pesoInterno,
      valorInterno
    ) {
      const campoPeso =
        document.querySelector(
          '#confirmacaoPeso'
        );

      const campoValor =
        document.querySelector(
          '#confirmacaoValor'
        );

      if (!campoPeso || !campoValor) {
        throw new Error(
          'Campos de confirmação não encontrados.'
        );
      }

      const setterPeso =
        this.obterSetterAngular(
          campoPeso,
          true
        );

      const setterValor =
        this.obterSetterAngular(
          campoValor,
          false
        );

      if (
        typeof setterPeso !== 'function'
      ) {
        throw new Error(
          'Setter Angular de peso não encontrado.'
        );
      }

      if (
        typeof setterValor !== 'function'
      ) {
        throw new Error(
          'Setter Angular de valor não encontrado.'
        );
      }

      /*
       * Atualiza exatamente as propriedades:
       *
       * componente.pesoConfirmacao
       * componente.valorTotalConfirmacao
       */
      setterPeso(pesoInterno);
      setterValor(valorInterno);

      /*
       * Atualização visual.
       * A validação verdadeira já foi atualizada
       * pelos setters acima.
       */
      this.setValorVisual(
        campoPeso,
        Number(pesoInterno)
          .toLocaleString('pt-BR')
      );

      this.setValorVisual(
        campoValor,
        Number(valorInterno)
          .toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })
      );

      campoPeso.classList.remove(
        'ng-pristine',
        'ng-untouched'
      );

      campoPeso.classList.add(
        'ng-dirty',
        'ng-touched',
        'ng-valid'
      );

      campoValor.classList.remove(
        'ng-pristine',
        'ng-untouched'
      );

      campoValor.classList.add(
        'ng-dirty',
        'ng-touched',
        'ng-valid'
      );

      SOLUM.engine.log(
        'Peso confirmado internamente: ' +
        pesoInterno,
        'ok'
      );

      SOLUM.engine.log(
        'Valor confirmado internamente: ' +
        valorInterno,
        'ok'
      );

      await SOLUM.actions.esperar(500);
    },

    obterSetterAngular(campo, campoComMascara) {
      const tarefa =
        campo
          ?.__zone_symbol__ngModelChangefalse
          ?.[0];

      if (!tarefa) {
        return null;
      }

      const wrapper =
        tarefa.callback?.('__ngUnwrap__');

      if (
        typeof wrapper !== 'function'
      ) {
        return null;
      }

      /*
       * Campo peso:
       * primeiro listener pertence à máscara;
       * o próximo pertence ao componente.
       *
       * Campo valor:
       * wrapper(Function) retorna diretamente
       * o setter valorTotalConfirmacao.
       */
      if (campoComMascara) {
        return (
          wrapper.__ngNextListenerFn__ ||
          wrapper.__ngLastListenerFn__ ||
          null
        );
      }

      try {
        const funcaoReal =
          wrapper(Function);

        if (
          typeof funcaoReal === 'function'
        ) {
          return funcaoReal;
        }
      } catch (erro) {
        console.warn(
          'Não foi possível extrair setter direto:',
          erro
        );
      }

      return (
        wrapper.__ngNextListenerFn__ ||
        wrapper.__ngLastListenerFn__ ||
        null
      );
    },

    setValorVisual(campo, valor) {
      const setter =
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;

      if (setter) {
        setter.call(campo, String(valor));
      } else {
        campo.value = String(valor);
      }
    },

    async clicarConfirmarValores() {
      const botao =
        document.querySelector(
          'button.botaoConfirmacao'
        );

      if (
        !botao ||
        botao.offsetParent === null
      ) {
        throw new Error(
          'Botão Confirmar valores não encontrado.'
        );
      }

      botao.click();

      SOLUM.engine.log(
        'Confirmar valores clicado.',
        'ok'
      );

      const apareceu = await this.esperar(
        () => {
          const sim =
            document.querySelector(
              'button.swal2-confirm'
            );

          return Boolean(
            sim &&
            sim.offsetParent !== null
          );
        },
        15000
      );

      if (!apareceu) {
        const mensagemErro = [
          ...document.querySelectorAll(
            '.toast-message, .toast-error, .swal2-html-container'
          )
        ]
          .filter(elemento =>
            elemento.offsetParent !== null
          )
          .map(elemento =>
            String(
              elemento.innerText ||
              elemento.textContent ||
              ''
            ).trim()
          )
          .filter(Boolean)
          .join(' | ');

        throw new Error(
          'Confirmação final SIM não apareceu.' +
          (
            mensagemErro
              ? ' Mensagem do SOLUM: ' +
                mensagemErro
              : ''
          )
        );
      }

      SOLUM.engine.log(
        'Confirmação final aberta.',
        'ok'
      );
    },

    async clicarSimFinal() {
      const sim =
        document.querySelector(
          'button.swal2-confirm'
        );

      if (
        !sim ||
        sim.offsetParent === null
      ) {
        throw new Error(
          'Botão SIM final não encontrado.'
        );
      }

      sim.click();

      SOLUM.engine.log(
        'SIM final clicado.',
        'ok'
      );

      await SOLUM.actions.esperar(1500);
    },

    async esperarNotaNaTabela(numeroNF) {
      const numero =
        String(numeroNF || '').trim();

      const apareceu = await this.esperar(
        () => {
          const linhas = [
            ...document.querySelectorAll(
              'table tbody tr'
            )
          ];

          return linhas.some(linha => {
            const texto =
              String(
                linha.innerText ||
                linha.textContent ||
                ''
              );

            if (!numero) {
              return texto.trim().length > 0;
            }

            return texto.includes(numero);
          });
        },
        20000
      );

      if (!apareceu) {
        SOLUM.engine.log(
          'A NF foi confirmada, mas ainda não apareceu na tabela.',
          'info'
        );

        return false;
      }

      SOLUM.engine.log(
        'NF encontrada na tabela.',
        'ok'
      );

      return true;
    },

    botaoPorTextoClasse(texto, classe) {
      const alvo =
        this.normalizar(texto);

      return [
        ...document.querySelectorAll(
          'button'
        )
      ]
        .filter(botao =>
          botao.offsetParent !== null
        )
        .filter(botao =>
          !botao.closest('#solum-rpa')
        )
        .find(botao => {
          const textoBotao =
            this.normalizar(
              botao.innerText ||
              botao.textContent
            );

          const classes =
            String(
              botao.className ||
              ''
            );

          return (
            textoBotao === alvo &&
            (
              !classe ||
              classes.includes(classe)
            )
          );
        }) || null;
    },

    async setValor(campo, valor) {
      campo.scrollIntoView({
        block: 'center'
      });

      campo.focus();
      campo.click();

      const texto =
        String(valor ?? '');

      const setter =
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;

      if (setter) {
        setter.call(campo, '');
      } else {
        campo.value = '';
      }

      campo.dispatchEvent(
        new Event('input', {
          bubbles: true
        })
      );

      campo.dispatchEvent(
        new Event('change', {
          bubbles: true
        })
      );

      await SOLUM.actions.esperar(100);

      if (setter) {
        setter.call(campo, texto);
      } else {
        campo.value = texto;
      }

      campo.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          inputType: 'insertText',
          data: texto
        })
      );

      campo.dispatchEvent(
        new Event('change', {
          bubbles: true
        })
      );

      campo.dispatchEvent(
        new Event('blur', {
          bubbles: true
        })
      );

      await SOLUM.actions.esperar(300);
    },

    async esperar(funcao, tempo = 10000) {
      const inicio =
        Date.now();

      while (
        Date.now() - inicio < tempo
      ) {
        try {
          if (funcao()) {
            return true;
          }
        } catch (erro) {}

        await SOLUM.actions.esperar(300);
      }

      return false;
    },

    normalizar(texto) {
      return String(texto || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          ''
        )
        .replace(/\s+/g, ' ')
        .trim();
    }

  };

  window.SOLUM.notaFiscal = NotaFiscal;

  console.log(
    '✅ Módulo Nota Fiscal atualizado com confirmação Angular.'
  );
})();
