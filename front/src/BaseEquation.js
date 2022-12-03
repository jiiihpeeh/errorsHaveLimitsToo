import { Button, HStack, Input,  Center, Text} from "@chakra-ui/react";
import { useContext, useState, useEffect } from "react";
import { EquationContext } from "./EquationContext";
import { CommunicatorContext } from "./CommunicatorContext";
import Examples from "./Examples";

const BaseEquation = () => {
    const { sympy, setSympy, emptyEquation, setEquation, setEvaluated, setEquationValues } = useContext(EquationContext);
    const { communicate, setCommunicate } = useContext(CommunicatorContext);
    const [ equations ] = useState(new Map());
    const [ example, setExample ] = useState('');
    const [ showExamples, setShowExamples ] = useState(false);
    const updateEquation = async () => {
        if(equations.has(sympy)){
          console.log(equations);
          setEquation(equations.get(sympy));
        }else if(sympy.length > 0){
            setCommunicate({ ...communicate, parseEquation: sympy })
        }
        setEvaluated(undefined);
        setEquationValues({});
    }
    useEffect(()=>{
        if(example !== ''){
             console.log(example)
            setSympy(example)
        }
       
    },[example, setSympy])

    return(<>
        <Center bg="blue.50">
            <HStack width={"85%"} mt="5px" mb="5px">
                <Text>
                    Insert an equation
                </Text>
                <HStack width={"70%"}>
                    <Input 
                        bg="ghostwhite"
                        type="text" 
                        value={sympy} 
                        onChange={(event) => setSympy(event.target.value)}
                        onKeyPress={(event) =>{
                            if (event.key === "Enter"){
                                updateEquation()
                            }}}/>
                    <Examples 
                        setExample={setExample} 
                        showExamples={showExamples} 
                        setShowExamples={setShowExamples}
                    />
                </HStack>
                <HStack>
                    <Button onClick={() => {updateEquation(); setExample('')}} bg="teal.100" >
                        Parse
                    </Button>
                    <Button bg={"red.100"} onClick={() => {setEquation(emptyEquation); setSympy(''); setEvaluated(null); setExample('')}}>
                        Clear
                    </Button>
                    <Button onClick={() => setShowExamples(!showExamples)} bg="yellow.100">
                        Examples
                    </Button>
                </HStack> 
            </HStack>
        </Center>
    </>
    )

}

export default BaseEquation;