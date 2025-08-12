// helpers/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// (optional) For multer if you ever need form-based uploads
export const storageCloudinary = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

export const uploadImageToCloudinary = async (files, userId) => {
  try {
    console.log('Uploading files...');

    const results = await Promise.all(
      files.map(async (file) => {
        const resizedBuffer = await resizeImage(file.buffer);

        const publicId = `${nanoid(16)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const fullPublicId = `uploads/${userId}/${publicId}`;

        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'image',
              folder: `uploads/${userId}`,
              public_id: publicId,
              format: file.mimetype.split('/')[1],
              context: { userId: String(userId) },
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                return reject(new Error('Image upload failed'));
              }

              return resolve({
                userId,
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          );

          stream.end(resizedBuffer); // <== Send resized image
        });
      })
    );

    return results;
  } catch (error) {
    console.error('Upload Error:', error.message, error.stack);
    throw error;
  }
};

export const deleteImageFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result !== 'ok') {
      throw new Error('Failed to delete image from Cloudinary');
    }

    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Image deletion failed');
  }
}



const resizeImage = async (buffer) => {
  try {
    return await sharp(buffer)
      .resize({ width: 1600, height: 900, fit: 'inside', withoutEnlargement: true })
      .toBuffer();
  } catch (err) {
    console.error('Sharp error:', err);
    throw new Error('Image resizing failed');
  }
};

