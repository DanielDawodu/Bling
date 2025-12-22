import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage as cloudinaryStorage } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure local storage (fallback)
const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Use Cloudinary if credentials exist, otherwise use local disk
const storage = process.env.CLOUDINARY_CLOUD_NAME ? cloudinaryStorage : localStorage;

// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
    const allowedTypes = /mp4|webm|ogg|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only video files are allowed (mp4, webm, ogg, mov)'));
    }
};

// File filter for both images and videos
const mediaFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|ogg|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed'));
    }
};

// Upload configurations
export const uploadImage = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadVideo = multer({
    storage: storage,
    fileFilter: videoFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export const uploadMedia = multer({
    storage: storage,
    fileFilter: mediaFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Avatar upload (single image)
export const uploadAvatar = uploadImage.single('avatar');

// Post media upload (multiple images and videos)
export const uploadPostMedia = uploadMedia.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 3 }
]);
