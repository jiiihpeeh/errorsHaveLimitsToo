const asyncHandler = require('express-async-handler')
const express = require("express");
const { optimize } = require('svgo');
let app = express();
const expressWs = require('express-ws')(app);

let port = process.env.PORT || 5001;


var MathJaxSVG = null;

const MathjaxSVGLoader = async () =>{ 
    if(!MathJaxSVG){
        try{
            MathJaxSVG = await require('mathjax').init({
                loader: {load: ['input/tex', 'output/svg']}});
        }catch(err){
            console.log("Failed to load MathJax");
        }
    }
    return MathJaxSVG;
}

const TeX2SVG = async (tex) =>{
    try{
        let MathJax = await MathjaxSVGLoader();
        const svg = MathJax.tex2svg(JSON.parse(tex), {display: true});
        const optimizedSvgString = optimize(MathJax.startup.adaptor.outerHTML(svg).replace('<mjx-container class="MathJax" jax="SVG" display="true">','').replace('</mjx-container>',''), {
            multipass: true,
          });
        return JSON.stringify(optimizedSvgString.data);
    }catch(err){
        return JSON.stringify("<svg></svg>");
    };
}
app.ws('/tex2svg', asyncHandler(async(ws, req) => {
    ws.on('message',asyncHandler(async (msg) => {
		try{
            //console.log(msg);
			ws.send(await TeX2SVG(msg));
		}catch(err){
			console.log("failed to send");
		}
    }));
	ws.on('close', asyncHandler(async(msgs) => {
		console.log('closing...');
	}))
}));
app.listen(port);
console.log("Running in port",port);
