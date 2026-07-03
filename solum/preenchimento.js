(function(){

window.SOLUM = window.SOLUM || {};
if(SOLUM.preenchimento) return;

const Preenchimento = {

    esperar(ms){
        return new Promise(r=>setTimeout(r,ms));
    },

    async esperarElemento(selector,tempo=10000){

        const inicio=Date.now();

        while(Date.now()-inicio<tempo){

            const el=document.querySelector(selector);

            if(el) return el;

            await this.esperar(200);

        }

        throw new Error("Elemento não encontrado: "+selector);

    },

    async clicar(selector){

        const el=await this.esperarElemento(selector);

        el.click();

        SOLUM.engine.log("Clique: "+selector,"ok");

        await this.esperar(300);

    },

    async preencher(selector,valor){

        const el=await this.esperarElemento(selector);

        el.focus();

        el.value="";

        el.dispatchEvent(new Event("input",{bubbles:true}));

        el.value=valor;

        el.dispatchEvent(new Event("input",{bubbles:true}));

        el.dispatchEvent(new Event("change",{bubbles:true}));

        SOLUM.engine.log("Campo preenchido: "+selector,"ok");

        await this.esperar(200);

    },

    async selecionar(selector,texto){

        const select=await this.esperarElemento(selector);

        [...select.options].forEach(op=>{

            if(op.text.trim()==texto){

                select.value=op.value;

            }

        });

        select.dispatchEvent(new Event("change",{bubbles:true}));

        SOLUM.engine.log("Selecionado: "+texto,"ok");

    }

};

SOLUM.preenchimento=Preenchimento;

})();
