import sharp from "sharp"
export const optimiseImage = async(buffer: Buffer): Promise<Buffer>=> {
    return await sharp(buffer)
    .resize({
        width: 800,
        withoutEnlargement: true //prevents small images from scaling up and blurring
    }).webp({quality: 80}).toBuffer() 
}


//self notes:
// - modern versions of sharp strip EXIF metadata by default
// - unless you explicitly chain .withMetadata()
// - withoutEnlargement: true: If a user uploads a 400px image, you don't want Sharp stretching it to 800px and making it look pixelated. This locks the max width while preserving aspect ratio.
