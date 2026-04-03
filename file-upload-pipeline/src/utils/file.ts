//file-type library, identifies initial magic numbers of a file and therefore signature, 
//checks file isnt malicious and confirms file type even better


import { fileTypeFromBuffer } from "file-type";

export const magicNumberValidater = async(buffer: Buffer): Promise<boolean> =>{
    const fileInfo = await fileTypeFromBuffer(buffer) //reads the first few raw hex bytes and determines
    if(!fileInfo){return false}
    //else:
    return fileInfo.mime.startsWith("image/")  //ensuring the true binary signature starts with 'image/'

}


//self notes: attacker renaming virus.exe(js malicious code) to profile.jpg bypasses multer but cannot bypass this
