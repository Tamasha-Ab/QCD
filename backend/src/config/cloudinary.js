
import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

const configureCloudinary = () => {
    if (!isConfigured) {
        // Check if all required environment variables are present
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            console.warn('Cloudinary environment variables not found. Image uploads will be disabled.');
            console.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
            return null; // Return null to indicate cloudinary is not available
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret
        });

        isConfigured = true;
        console.log('Cloudinary configured successfully');
    }
    return cloudinary;
};

export default configureCloudinary;