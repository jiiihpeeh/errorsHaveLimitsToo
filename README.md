#  Errors have limits too! ... ?
A tool to compute uncertainty equations and numeric values for a given equation using the Law of Error Propagation. https://en.wikipedia.org/wiki/Propagation_of_uncertainty .
It has an ability export equations in form of LaTeX files and compiled PDF files (made by XeLaTeX).

Live demo is available at https://kukkoilija.chickenkiller.com/errorshavelimitstoo/


Frontend uses React code. KaTeX is used to render equations. 
To run it  in production mode use the normal routine.
Edit App.js websocket address according to your needs, make cumstomizations

``` 
npm i
npm run build
serve -s build/
```

in the front directory. 

Backend is a simple websocket server utilising Python script which parses commands made by the frontend. For symbolic and numeric calculations it uses SymPy.
It also has a subserver called TeX2SVG running node and websockets (for plausible portability reasons). It utilizes MathJaX to formulate SVG code from TeX equations. The reason to do this instead of making system commands is experimentation and much shorter processing times from few milliseconds to sub milliseconds  which is magnitudes faster.

Backend needs 

`pip install websockets websocket-client wsaccel sympy ujson`

For LateX output XeTeX and amsmath needs to be installed.

For Tex2SVG install node, go in inside the directory and run 

`npm i`

TODO Pure JS version (no backend)
