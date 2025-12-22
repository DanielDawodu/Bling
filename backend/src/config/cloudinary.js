import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith('video');
        const isRaw = file.mimetype.includes('pdf') || file.mimetype.includes('msword') || file.mimetype.includes('officedocument');

        return {
            folder: 'bling_uploads',
            resource_type: isVideo ? 'video' : (isRaw ? 'raw' : 'image'),
            allowed_formats: isVideo
                ? ['mp4', 'webm', 'ogg', 'mov']
                : (isRaw ? ['pdf', 'doc', 'docx'] : ['jpg', 'jpeg', 'png', 'gif', 'webp']),
            transformation: (isVideo || isRaw) ? [] : [{ width: 1000, height: 1000, crop: 'limit' }]
        };
    },
});

export { cloudinary, storage };
