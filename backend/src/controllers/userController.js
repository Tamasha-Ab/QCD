import User from '../models/userModel.js';
import { createActivity } from './activityController.js';
import configureCloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (user themselves or admin)
export const updateUser = async (req, res) => {
    console.log('=== UPDATE USER REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Has file:', !!req.file);
    console.log('File details:', req.file);
    console.log('==========================');

    try {
        // Prevent password updates here
        if (req.body.password) {
            delete req.body.password;
        }

        const userIdToUpdate = req.params.id;
        const loggedInUser = req.user;

        // Only allow update if user is admin or updating own profile
        if (
            loggedInUser.role !== 'admin' &&
            loggedInUser._id.toString() !== userIdToUpdate
        ) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this user'
            });
        }

        // Get current user to check for existing profile photo
        const currentUser = await User.findById(userIdToUpdate);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        let updateData = { ...req.body };

        console.log('Update request received:', {
            body: req.body,
            hasFile: !!req.file,
            file: req.file ? {
                filename: req.file.filename,
                originalname: req.file.originalname,
                path: req.file.path
            } : null
        });

        // Handle profile photo removal
        if (req.body.removeProfilePhoto === 'true') {
            console.log('=== REMOVING PROFILE PHOTO ===');
            console.log('Current user profile photo:', currentUser.profilePhoto);

            // Delete existing photo from Cloudinary if it exists
            if (currentUser.profilePhoto) {
                try {
                    // Extract public_id from Cloudinary URL
                    // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/public_id.jpg
                    const urlParts = currentUser.profilePhoto.split('/');
                    const publicIdWithExtension = urlParts[urlParts.length - 1]; // Get the last part
                    const publicId = publicIdWithExtension.split('.')[0]; // Remove extension

                    // If the image is in a folder, include the folder in the public_id
                    const uploadIndex = urlParts.findIndex(part => part === 'upload');
                    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                        // Format: profile_photos/public_id
                        const folderAndId = urlParts.slice(uploadIndex + 2).join('/').split('.')[0];
                        console.log('Deleting from Cloudinary with public_id:', folderAndId);

                        const cloudinary = configureCloudinary();
                        const result = await cloudinary.uploader.destroy(folderAndId);
                        console.log('Cloudinary deletion result:', result);
                    } else {
                        console.log('Deleting from Cloudinary with public_id:', publicId);
                        const cloudinary = configureCloudinary();
                        const result = await cloudinary.uploader.destroy(publicId);
                        console.log('Cloudinary deletion result:', result);
                    }
                } catch (cloudinaryError) {
                    console.error('Error deleting from Cloudinary:', cloudinaryError);
                }
            }
            updateData.profilePhoto = null;
            delete updateData.removeProfilePhoto;
            console.log('Profile photo removal completed');
        }
        // Handle profile photo upload
        else if (req.file) {
            // Delete existing photo from Cloudinary if it exists
            if (currentUser.profilePhoto) {
                try {
                    const publicId = currentUser.profilePhoto.split('/').pop().split('.')[0];
                    const cloudinary = configureCloudinary();
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error('Error deleting existing photo from Cloudinary:', cloudinaryError);
                }
            }

            // Upload new photo to Cloudinary
            try {
                console.log('Attempting to upload file to Cloudinary:', req.file.path);
                console.log('File details:', {
                    filename: req.file.filename,
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    destination: req.file.destination
                });

                // Use absolute path for Windows compatibility
                const absolutePath = path.resolve(req.file.path);
                console.log('Absolute path:', absolutePath);

                // Check if file exists
                if (!fs.existsSync(absolutePath)) {
                    throw new Error(`File does not exist at path: ${absolutePath}`);
                }

                const cloudinary = configureCloudinary();
                const result = await cloudinary.uploader.upload(absolutePath, {
                    folder: 'profile_photos',
                    width: 300,
                    height: 300,
                    crop: 'fill'
                });

                console.log('Cloudinary upload successful:', result.secure_url);
                updateData.profilePhoto = result.secure_url;

                // Clean up the uploaded file after successful upload
                try {
                    fs.unlinkSync(absolutePath);
                    console.log('Temporary file cleaned up:', absolutePath);
                } catch (cleanupError) {
                    console.error('Error cleaning up temporary file:', cleanupError);
                }

            } catch (cloudinaryError) {
                console.error('Error uploading to Cloudinary:', cloudinaryError);
                console.error('Cloudinary error details:', {
                    message: cloudinaryError.message,
                    error: cloudinaryError.error,
                    stack: cloudinaryError.stack
                });
                return res.status(500).json({
                    success: false,
                    error: 'Failed to upload profile photo'
                });
            }
        }

        const user = await User.findByIdAndUpdate(userIdToUpdate, updateData, {
            new: true,
            runValidators: true
        }).select('-password');

        // Log activity
        const updatedFields = Object.keys(updateData);
        await createActivity(
            loggedInUser._id,
            'user_updated',
            `Updated user profile for ${user.name}`,
            {
                updatedUserId: user._id,
                updatedFields,
                isOwnProfile: loggedInUser._id.toString() === userIdToUpdate
            }
        );

        console.log('=== UPDATE SUCCESSFUL ===');
        console.log('Updated user data:', {
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePhoto: user.profilePhoto
        });
        console.log('========================');

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Don't allow deleting your own account
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own account'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { name }] });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role, department });

        // Log activity - admin creating user
        await createActivity(
            req.user._id,
            'user_created',
            `Admin ${req.user.name} created new user ${name} with role: ${role}`,
            {
                email,
                role,
                department,
                createdUserId: user._id,
                adminId: req.user._id
            }
        );

        // Return user data without authentication tokens
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
