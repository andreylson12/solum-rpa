(function(){

window.SOLUM = window.SOLUM || {};

if(SOLUM.processo) return;

const Processo={

    dados:{

        ticket:{},

        xml:{},

        planilha:{},

        ordem:{},

        pesagem:{},

        laudo:{},

        preenchimento:{},

        erros:[]

    },

    salvar(modulo,dados){

        this.dados[modulo]=dados;

        SOLUM.engine.log(
            "Processo atualizado: "+modulo,
            "ok"
        );

    },

    obter(modulo){

        return this.dados[modulo];

    },

    adicionarErro(erro){

        this.dados.erros.push(erro);

        SOLUM.engine.log(
            erro,
            "erro"
        );

    }

};

SOLUM.processo=Processo;

})();
