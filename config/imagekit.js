import ImageKit from 'imagekit';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

/**
 * Uploads a local file to ImageKit and deletes the local temp file.
 * @param {Object} file - Multer file object
 * @param {string} folder - ImageKit folder path
 * @returns {Promise<string>} - Resolved URL of the uploaded image
 */
export const uploadToImageKit = async (file, folder = '/vidyarthi') => {
  try {
    const fileBuffer = fs.readFileSync(file.path);
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: file.filename,
      folder: folder
    });
    
    // Clean up local temp file asynchronously
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    return result.url;
  } catch (error) {
    // Make sure temp file is cleaned up on error
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error deleting temp file in catch:', err);
      }
    }
    throw new Error(`ImageKit Upload Failed: ${error.message}`);
  }
};

export default imagekit;
