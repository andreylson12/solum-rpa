(function(){

window.SOLUM=window.SOLUM||{};

if(SOLUM.inspector) return;

const Inspector={

    mapear(){

        const lista=[];

        const campos=document.querySelectorAll("input,select,textarea");

        campos.forEach(c=>{

            const info={

                id:c.id||"",

                name:c.name||"",

                tipo:c.tagName,

                classe:c.className,

                placeholder:c.placeholder||"",

                valor:c.value||"",

                disabled:c.disabled,

                readonly:c.readOnly

            };

            lista.push(info);

        });

        console.table(lista);

        SOLUM.engine.log(
            lista.length+" campos encontrados.",
            "ok"
        );

        return lista;

    }

};

SOLUM.inspector=Inspector;

})();
