import { Menu, MenuItem, MenuList, MenuButton, MenuDivider, Text , MenuGroup, Box} from "@chakra-ui/react"
import { toPng } from 'html-to-image';
import { useState, useContext, useEffect, useRef } from "react"
import 'katex/dist/katex.min.css';
import download from 'downloadjs'
import { BlockMath } from 'react-katex';
import { CommunicatorContext } from "./CommunicatorContext";
import { EquationContext } from "./EquationContext";
import { dataURLToBlob, createBlob } from 'blob-util'
import { copyToClipboard, copyBlobToClipboard} from './copy';

const getElementData = (id) => {
    let elem = document.getElementById(id);
    let position = elem.getBoundingClientRect();
    let dimensions = { width:1.05*position.width, height: 1.6* position.height} ;
    
    return dimensions;
}

const getTexCode = (id) => {
    let katexData = document.getElementById(id);
    return katexData.outerHTML.split('<annotation encoding="application/x-tex">')[1].split('</annotation>')[0];
}


const saveStandaloneTex = (id) => {
    const doc = `\\documentclass{standalone}\n\\begin{document}\n$\\displaystyle ${getTexCode(id)}$\n\\end{document}\n`
    download(doc, 'equation.tex','text/plain')
} 

const KaTeXBlockContent = (props) => {
    const { communicate, setCommunicate } = useContext(CommunicatorContext);
    const { svg } = useContext(EquationContext);
    const svgAction = useRef('');
    const [showMenu, setShowMenu ] = useState(false)
    const id = `${Math.random().toString(16).slice(2)} `+ props.equation
    const toAction = async (id, format, action) => {
        let element = document.getElementById(id);
        try{
            switch(format){
                case 'png':
                    const dataPng = await toPng(element,getElementData(id));
                    switch(action){
                        case 'download':
                            download(dataPng, 'image.png', 'image/png');
                            break;
                        case 'copy':
                            const pngBlob = dataURLToBlob(dataPng);
                            console.log(pngBlob)
                            copyBlobToClipboard(pngBlob);
                            break;
                        default:
                            break;
                    }
                    break;
                case 'svg':
                    const texData = getTexCode(id)
                    setCommunicate({...communicate, fetchSvg : texData});
                    svgAction.current = action;
                    break;
                default:
                    break;
            }
            
  
        }catch(err){
            console.log(err)
        }        
    }

    useEffect(()=>{
        if(svgAction.current !== '' && svg){
            switch(svgAction.current){
                case 'copy':
                    svgAction.current = ''
                    
                    copyToClipboard(svg)
                    //Code below seems not to be supported
                    //const svgBlob = createBlob([svg],{type:'image/svg+xml'});
                    //console.log(svgBlob)
                    //copyBlobToClipboard(svgBlob)
                    break;
                case 'download':
                    svgAction.current = ''
                    download(svg, 'image.svg', 'image/svg+xml');
                    break;
                default:
                    break;
            }
        }
    }, [svg]);

    return (
        <Box onContextMenu={(e) => {e.preventDefault(); setShowMenu(true) }} >                    
        <Menu bg={"gray.100"} isOpen={showMenu} 
            placement={"top"}  closeOnBlur >
                <MenuButton 
                        as={Text} 
                    >   
                    <div id={id}>
                        <BlockMath >
                            {props.equation}
                        </BlockMath>
                    </div>
                </MenuButton>
            <MenuList bg={"gray.100"} onClick={() => setShowMenu(false)} >
                <MenuGroup title='Copy'>
                <MenuItem bg={"gray.100"} onClick={() => copyToClipboard(getTexCode(id))}   > 
                    <Text>Copy as TeX</Text> 
                </MenuItem>
                <MenuItem bg={"gray.100"} onClick={() => toAction(id, 'png','copy')}>
                        Copy as PNG
                </MenuItem>
                <MenuItem bg={"gray.100"} onClick={()=>toAction(id, 'svg','copy')}>
                        Copy as SVG (text)
                </MenuItem>
                </MenuGroup>

                <MenuDivider/>
                <MenuGroup title='Save'>
                <MenuItem bg={"gray.100"} onClick={() => saveStandaloneTex(id)}  >
                        Save as TeX
                </MenuItem>   
                <MenuItem bg={"gray.100"} onClick={()=>toAction(id, 'png','download')}>
                        Save as PNG
                </MenuItem>   
                <MenuItem bg={"gray.100"} onClick={()=>toAction(id, 'svg','download')}>
                        Save as SVG
                </MenuItem>
                </MenuGroup>                                  
            </MenuList>
        </Menu>
        </Box>
        )
};

export default KaTeXBlockContent;