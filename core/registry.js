(function(){

const REGISTRY = {};

window.SolumRegistry = {

    registrar(nome,obj){

        if(REGISTRY[nome]){
            throw new Error("Módulo já registrado: " + nome);
        }

        REGISTRY[nome]=obj;

        console.log("📦 Módulo registrado:",nome);

    },

    modulo(nome){

        if(!REGISTRY[nome]){
            throw new Error("Módulo não encontrado: "+nome);
        }

        return REGISTRY[nome];

    },

    listar(){

        return Object.keys(REGISTRY);

    }

};

})();
