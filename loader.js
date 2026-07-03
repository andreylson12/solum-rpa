(function(){

if(window.SolumLoader) return;

const Loader = {

    bibliotecas:{},

    async carregar(url){

        if(this.bibliotecas[url]){
            return;
        }

        const codigo = await fetch(url).then(r=>{

            if(!r.ok){
                throw new Error("Erro carregando: " + url);
            }

            return r.text();

        });

        eval(codigo);

        this.bibliotecas[url]=true;

        SolumEngine.log("Biblioteca carregada.","ok");

    },

    async inicializar(){

        await this.carregar(
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"
        );

        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

        SolumEngine.log("PDF.js pronto.","ok");

    }

};

window.SolumLoader = Loader;

})();
