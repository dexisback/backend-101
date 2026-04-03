import sharp from "sharp"
import { encode } from "blurhash"
export const optimiseImage = async(buffer: Buffer): Promise<Buffer>=> {
    return await sharp(buffer)
    .resize({
        width: 800,
        withoutEnlargement: true //prevents small images from scaling up and blurring
    }).webp({quality: 80}).toBuffer() 
}


export const blurHashGenerator = async (buffer: Buffer) : Promise<string> =>{
    //shrink the image to a tiny size and extract raw pixel data:
    const {data, info} =await sharp(buffer).raw().ensureAlpha().resize(32,32,{fit: "inside"}).toBuffer({resolveWithObject: true})

    //encode the raw pixels into a short string, Uint8ClampedArray ensures the data format matches what the encoder expects
    const blurHashFeederString = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4) //4x4 components_
    return blurHashFeederString;
}

//self notes:
// - modern versions of sharp strip EXIF metadata by default
// - unless you explicitly chain .withMetadata()
// - withoutEnlargement: true: If a user uploads a 400px image, you don't want Sharp stretching it to 800px and making it look pixelated. This locks the max width while preserving aspect ratio.
// - to generate a blurHash , we need to extract the raw and uncompressed pixel data from the image. sharp does this beatufiully and then we feed that variable into blurHash 