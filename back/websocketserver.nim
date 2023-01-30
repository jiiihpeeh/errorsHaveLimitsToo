import ws, jsony, nimpy, supersnappy, std/[asyncdispatch, asynchttpserver, base64, os, tempfiles,tables, strutils, osproc]


const fileName = "parse_equation.py"

proc getModule():string{.compileTime.} =
    return compress(readFile(fileName))

const
    serverPath = "/home/j-p/errorsHaveLimitsToo"
    parseEquationModule = getModule()
    wsAddress = "ws://localhost:5001/tex2svg"
    xelatex = "/usr/bin/xelatex"
    node = "/home/j-p/node-v18.12.1-linux-arm64/bin/node"
    svgServer = serverPath & "/back/Tex2SvgServer/"
    port = 8765# 8765
    svgPort = parseInt(wsAddress.split(":")[2].split("/")[0])

var
    parseEquation : PyObject
    sys : PyObject
    wsSocket : WebSocket
    scriptLoaded = false
    wsInit = false
    svgProc : Process


type
    OutResponse = enum
        EquationOut = "parsed"
        CalculateOut = "calculated"
        SvgOut = "svg"
        PdfOut = "pdf"

    InRequest = enum
        Equation = "equation"
        Calculate = "calculate"
        Svg = "svg"
        Pdf = "pdf"
        Fail = "fail"

    CalcArrays = Table[string, array[2,float]]
    ParseUsedSymbols  = Table[string, array[3,string]]

    CalcObject = object
        original_equation : string
        original_error: string
        values: CalcArrays
        used_symbols: ParseUsedSymbols

    CalcResult = object
        result: string
        error: string

    ParseResult = object 
        original_equation: string
        tex: string
        tex_eval: string
        tex_prefix: string
        diff_parts_tex : seq[string]
        error_term_tex: string
        error_term_simplified_tex: string
        error_equation: string
        error_str: string
        used_symbols : ParseUsedSymbols

    CalculateObject  = object 
        original_equation : string
        original_error: string
        values: CalcArrays
        used_symbols: ParseUsedSymbols
    InputJson = object
        case  query: InRequest
        of Equation:
            equation: string
        of Calculate:
            calculate : CalculateObject
        of Svg:
            svg: string
        of Pdf:
            tex: string
        of Fail:
            discard 
    OutputJson = object 
        case  message: OutResponse
        of PdfOut:
            pdf: string
        of SvgOut:
            svg: string 
        of CalculateOut:
            result: CalcResult
        of EquationOut:
            equation: ParseResult


proc runTex2svgServer()=
    svgProc = startProcess(node, svgServer,  ["Tex2SVG.js"])


runTex2svgServer()

proc getSvgWs(texData:string):string=            
    if not svgProc.running:
        runTex2svgServer()
        sleep(500)

    result = ""
    var
        svgData : string
        query : string
    proc svgQuery(){.async.} =
        try:
            if not wsInit:
                wsSocket = await newWebSocket(wsAddress)
                wsInit = true
            if wsSocket.readyState != Open:
                wsSocket = await newWebSocket(wsAddress)
            await wsSocket.send(query)
            svgData = await wsSocket.receiveStrPacket()
        except:
            svgData = ""

    query =  texData.toJson
    waitFor svgQuery()
    if svgData.len > 0:
        result = svgData


proc executeLaTeX(content: string): string=
    let
        curDir = getCurrentDir()
        tempDir = createTempDir("errorshavelimits", "_temp")
    tempDir.setCurrentDir
    "temp.tex".writeFile content
    let exitCode = execCmd(xelatex & " temp.tex")
    if exitCode == 0:
        result = "temp.pdf".readFile.encode
        curDir.setCurrentDir
        tempDir.removeDir
    else:
        curDir.setCurrentDir
        tempDir.removeDir

proc loadScript(folder:string = serverPath): bool=
    #try:
        #check PYTHONHOME to solve problems with AppImage
        echo "loading sys"
        let pyEnv = getEnv("PYTHONHOME")
        if pyEnv.startsWith("/tmp/.mount"):
            let newPath = "/" & pyEnv.split("/")[3..^1].join("/")
            putEnv("PYTHONHOME", newPath)
        putEnv("PYTHONHOME", "/usr/")
        echo "PYTHONHOME " & getEnv("PYTHONHOME")
        sys = pyImport("sys")
        echo "imported sys"
        let path = joinPath(folder, fileName)
        if fileExists(path):
            removeFile(path)
        let pychacheDir = joinPath(folder,"__pycache__")
        if dirExists(pychacheDir):
            removeDir(pychacheDir)
        path.writeFile parseEquationModule.uncompress
        discard sys.path.append(folder.cstring)
        echo sys.version
        let moduleName = fileName[0..^4].cstring
        parseEquation = pyImport(moduleName)
        return true
    # except:
    #     return false

if not scriptLoaded:
    scriptLoaded = loadScript()

proc parse(equation:string):ParseResult=
    result = parseEquation.parse(equation).to(ParseResult)


proc calculate(calc:CalcObject):CalcResult=
    result = parseEquation.calculate(calc).to(CalcResult)


proc cb(req: Request) {.async, gcsafe.} =
    try:
        var ws = await newWebSocket(req)
        ws.setupPings(9.5)

        var 
            msg = ""
            unpacked = InputJson()
        while ws.readyState == Open:
            msg = ""
            let packet = await ws.receiveStrPacket()
            try:
                if packet.len < 100000 and packet.startsWith("""{"query""") and packet.endsWith("""}"""):
                    unpacked = packet.fromJson(InputJson)
                else:
                    unpacked = InputJson(query: Fail)
            except:
                unpacked = InputJson(query: Fail)
            #echo unpacked
            case unpacked.query:
            of Equation:
                try:
                    let parsed = parse(unpacked.equation)
                    msg = OutputJson(equation: parsed, message: EquationOut).toJson
                except:
                    discard
                await ws.send(msg)
            of Calculate:
                let calculateObj = CalcObject(original_equation: unpacked.calculate.original_equation, 
                                            original_error: unpacked.calculate.original_error,
                                            values:  unpacked.calculate.values,
                                            used_symbols: unpacked.calculate.used_symbols)
                try:
                    msg = OutputJson(message: CalculateOut, result: calculate(calculateObj)).toJson
                except:
                    discard
                await ws.send(msg)
            of Svg:
                try:
                    let svg = getSvgWs(unpacked.svg).fromJson(string)
                    msg = OutputJson(message: SvgOut, svg: svg).toJson
                except:
                    discard
                await ws.send(msg)
            of Pdf:
                try:
                    let pdf = executeLaTeX(unpacked.tex)
                    msg = OutputJson(message: PdfOut, pdf: pdf).toJson
                except:
                    discard
                await ws.send(msg)
            of Fail:
                await ws.send(false.toJson)

    except WebSocketError:
        echo "socket closed:", getCurrentExceptionMsg()

var server = newAsyncHttpServer()
waitFor server.serve(port.Port, cb)

