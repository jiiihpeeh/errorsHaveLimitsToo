import {  notification } from './notification'


export const copyToClipboard = async (content) => {
    try{
        await navigator.clipboard.writeText(content);
    }catch(err){
        console.log(err);
        notification("Failed to copy", "Couldn't copy text to your clipboard", "error",5000);
    }
}

export const copyBlobToClipboard = async (blob)=> {
    try{
        const data = [new ClipboardItem({ [blob.type]: blob })];
        await navigator.clipboard.write(data);
    }catch(err){
        console.log(err);
        notification("Failed to copy", "Maybe your browser does not support copy image to clipboard functionality", "error",5000);
    }
}
