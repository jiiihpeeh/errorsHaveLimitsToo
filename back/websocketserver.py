#install: pip3 install websockets websocket-client sympy wsaccel
#node: install node -> npm i in TeX2SvgServer directory
import asyncio
import websockets
import json
import parse_equation
from time import sleep
#this one operates as a connector to node-express ws
import websocket
import subprocess, sys, os,socket, base64
import tempfile, signal

connection_fails  = 0
connection_fails_max  = 10

tex2svgURI = "ws://localhost:5001/tex2svg"
PORT = int(tex2svgURI.split(':')[2].split('/')[0])
ws = websocket.WebSocket()

SVG = json.dumps("<svg><svg>")
NODE = 'node'

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def run_tex2svg_server():
    if not is_port_in_use(PORT):
        server = os.path.join(os.path.dirname(sys.argv[0]),'Tex2SvgServer','Tex2SVG.js')
        subprocess.Popen([NODE, server])
        a = 0
        while a < 100:
            sleep(0.05)
            if is_port_in_use(PORT):
                break
            a+=1
    sleep(0.1)


def connect_to_tex2svg():
    try:
        ws.connect(tex2svgURI)
        ws.send(json.dumps("a+b"))
        val = json.loads(ws.recv())
        print(val)
        return
    except:
        sleep(0.05)
        run_tex2svg_server()
        connect_to_tex2svg()

run_tex2svg_server()
connect_to_tex2svg()


def xeTex (tex: str) -> str:
    current_dir = os.getcwd()
    pdf64 = ""
    with tempfile.TemporaryDirectory() as td:
        os.chdir(td)
        file_name = 'texFile'
        with open(file_name + ".tex" , 'w') as f:
            f.writelines(tex)

        subprocess.run(["xelatex", file_name])
    
        try:
            with open(file_name + ".pdf",'rb') as f:
                pdf64 = base64.b64encode(f.read()).decode('UTF-8')
                os.chdir(current_dir)
        except:
            pass
    return pdf64


async def process(websocket):
    async for message in websocket:
        message_parsed = json.loads(message)
        print(message_parsed)
        send_message = {}
        try: 
            match  message_parsed["query"]:
                case 'equation':
                    send_message["message"] = "parsed"
                    send_message["equation"] = parse_equation.parse(message_parsed["equation"])
                    pass
                case 'calculate':
                    send_message["message"] = "calculated"
                    send_message["result"] = parse_equation.calculate(message_parsed["calculate"])
                case 'svg':
                    send_message["message"] = "svg"
                    send_message["svg"] = SVG
                    try:
                        ws.send(json.dumps(message_parsed["svg"]))
                        send_message["svg"] = json.loads(ws.recv())
                    except:
                        connect_to_tex2svg()
                        try:
                            ws.send(json.dumps(message_parsed["svg"]))
                            send_message["svg"] = json.loads(ws.recv())
                        except:
                            pass
                case 'pdf':
                    tex_file = message_parsed["tex"]
                    pdf = xeTex(tex_file)
                    send_message["message"] = "pdf"
                    send_message["pdf"] = pdf
                        
                case default:
                    pass
        except:
            pass
        await websocket.send(json.dumps(send_message))

async def main():
     async with websockets.serve(process, "localhost", 8765):
         await asyncio.Future()  # run forever

#async def main():
#    # Set the stop condition when receiving SIGTERM.
#    loop = asyncio.get_running_loop()
#    stop = loop.create_future()
#    loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)

#    async with websockets.unix_serve(
#        process,
#       path=f"{os.environ['SUPERVISOR_PROCESS_NAME']}.sock",
#   ):
#        await stop


asyncio.run(main())
