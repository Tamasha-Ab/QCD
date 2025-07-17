import configureCloudinary from '../config/cloudinary.js';
import fs from 'fs';

/**
 * Upload an image to cloudinary with optional annotations
 * @param {string} imagePath - Path to local image file
 * @param {object} options - Upload options
 * @param {string} options.folder - Cloudinary folder
 * @param {Array} options.annotations - Annotations to add to the image
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadDefectImage = async (imagePath, options = {}) => {
    try {
        const uploadOptions = {
            folder: options.folder || 'quality-control/defects'
        };

        // Add annotations if provided (e.g., circles or rectangles around defects)
        if (options.annotations && options.annotations.length > 0) {
            const transformations = options.annotations.map(annotation => {
                switch (annotation.type) {
                    case 'circle':
                        return {
                            overlay: {
                                font_family: "Arial",
                                font_size: 200,
                                text: "○"
                            },
                            color: annotation.color || 'red',
                            x: annotation.x,
                            y: annotation.y
                        };
                    case 'rectangle':
                        return {
                            width: annotation.width,
                            height: annotation.height,
                            border: `3px_solid_${annotation.color || 'red'}`,
                            x: annotation.x,
                            y: annotation.y,
                            crop: 'crop'
                        };
                    default:
                        return null;
                }
            }).filter(Boolean);

            if (transformations.length > 0) {
                uploadOptions.transformation = transformations;
            }
        }

        const cloudinary = configureCloudinary();

        if (!cloudinary) {
            throw new Error('Cloudinary not configured. Please set up environment variables.');
        }

        const result = await cloudinary.uploader.upload(imagePath, uploadOptions);

        // Delete local file if needed
        try {
            fs.unlinkSync(imagePath);
        } catch (error) {
            console.error('Error deleting local file:', error);
        }

        return result;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

export default {
    uploadDefectImage
};