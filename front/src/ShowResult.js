import { useContext } from "react";
import { Text, VStack, HStack, Tooltip } from "@chakra-ui/react";
import { QuestionIcon } from '@chakra-ui/icons'
import { EquationContext } from "./EquationContext";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
const ShowResult = () => {
    const { evaluated, equation } = useContext(EquationContext);
    return(
            <VStack bg={"teal.50"} m="1%">
                <Text as='b'>
                    Result
                </Text>
                <Text>
                    <HStack>
                    <InlineMath>
                        {`${equation.tex_prefix} \\pm \\delta ${equation.tex_prefix} = ${evaluated.result} \\pm ${evaluated.error}`}
                    </InlineMath>
                    <Tooltip label="SymPy might not handle division by zero correctly">
                        <QuestionIcon/>
                    </Tooltip>
                    </HStack>
                </Text>

            </VStack>
        )
}
export default ShowResult;