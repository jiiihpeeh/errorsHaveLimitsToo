import { useEffect, useContext, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import { CommunicatorContext } from './CommunicatorContext';
import { EquationContext } from './EquationContext';
import { base64StringToBlob} from 'blob-util';
import download from 'downloadjs';
const Communicator = () => {
  //Public API that will echo messages sent to it back to the client
  const { communicate, setCommunicate, server } = useContext(CommunicatorContext);
  const {  setEquation, setEvaluated, setSvg } = useContext(EquationContext);
  const getMsg = useRef(false);
  const getSvg = useRef(false);
  const getPdf = useRef(false);

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    server,
    {
      shouldReconnect: (closeEvent) => {
  
        return true
      },
      reconnectAttempts: 1000,
      reconnectInterval: 3000,
    }
  );
  
  useEffect (() => {
  
    if(communicate.parseEquation !== null){
        sendJsonMessage({query: 'equation', equation: communicate.parseEquation});
        setCommunicate({...communicate, parseEquation : null});
        getMsg.current = true;
    }
    if(communicate.processTable !== null) {
        sendJsonMessage({query: 'calculate', calculate: communicate.processTable});
        setCommunicate({...communicate, processTable : null});
        getMsg.current = true;
    }
    if(communicate.fetchSvg !== null && getSvg.current === false){
        sendJsonMessage({query: 'svg', svg: communicate.fetchSvg});
        setCommunicate({...communicate, fetchSvg : null});
        getSvg.current = true;
    }
    if(communicate.fetchPdf !== null && getPdf.current === false){
      sendJsonMessage({query: 'pdf', tex: communicate.fetchPdf});
      setCommunicate({...communicate, fetchPdf : null});
      getSvg.current = true;
  }
    console.log(communicate);
  },[communicate])

  useEffect(() => {
    if (lastJsonMessage !== null &&  (getMsg.current || getSvg.current) ) {
      //console.log(lastJsonMessage)
      switch(lastJsonMessage.message){
        case 'parsed':
          console.log(lastJsonMessage.equation);
          setEquation({...lastJsonMessage.equation});
          getMsg.current = false;
          break;
        case 'calculated':
          setEvaluated(lastJsonMessage.result);
          getMsg.current = false;
          break;
        case 'svg':
          setSvg(lastJsonMessage.svg);
          getSvg.current = false;
          break;
        case 'pdf':
          let pdfBlob = base64StringToBlob(lastJsonMessage.pdf, 'application/pdf')
          console.log(pdfBlob)
          download(pdfBlob, 'report.pdf', 'application/pdf')
          getPdf.current = false;
          break;
        default:
          break;

      }
    }
  }, [lastJsonMessage, setEquation, setEvaluated, setSvg]);

};
export default Communicator;