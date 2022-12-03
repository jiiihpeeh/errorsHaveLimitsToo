import {useState} from 'react'
import { Heading, Center, Text, Box } from "@chakra-ui/react";
import BaseEquation from "./BaseEquation";
import { EquationContext } from './EquationContext' 
import { CommunicatorContext } from './CommunicatorContext';
import SymbolTable from './SymbolTable';
import ErrorTabs from './ErrorTabs';
import DisplayEquation from './DisplayEquation';
import CopySave from './CopySave';
import Communicator from './Communicator';

export default function App() {
  const [ sympy, setSympy ] = useState("");
  const emptyEquation = { tex:'', tex_eval:'', tex_prefix:'', symbols : [], error_term_tex: ''}
  const [ equation, setEquation ] = useState(emptyEquation);
  const [ evaluated, setEvaluated ] = useState(null);
  const [ communicate, setCommunicate ] = useState({ parseEquation: null, processTable : null,  fetchSvg: null, fetchPdf: null});
  const [ svg, setSvg ] = useState(null);
  const [ texEquations, setTexEquations ] = useState({parsed_equation: null, error_equations: null, error_equations_parts: null, result: null})
  const [ equationValues, setEquationValues ] = useState({});
  const server = "ws://localhost:8765"

  return (
      <EquationContext.Provider value={{sympy, setSympy, equation, setEquation, emptyEquation, evaluated, setEvaluated, svg, setSvg, texEquations, setTexEquations, equationValues, setEquationValues }}>
      <CommunicatorContext.Provider value={{ communicate, setCommunicate, server }}>
          <Communicator/>
          <Box>
            <Center>
            <Heading margin={"20px"} >
              <Text  textShadow='1px 2px gray'> Errors have limits too! ... ?</Text>
            </Heading>
            </Center>
          </Box>
          { equation && equation.tex.length > 0 &&
          <>
          <CopySave/></>}
          <BaseEquation/>
          
          { equation && equation.tex.length > 0 &&
          <>
            <DisplayEquation/>
            <ErrorTabs/>
            <SymbolTable/>
          </>}
      </CommunicatorContext.Provider>
      </EquationContext.Provider>
  );
}