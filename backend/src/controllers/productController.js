import Product from '../models/productModel.js';
import configureCloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Configure Cloudinary
const cloudinary = configureCloudinary();

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
    try {
        const { name, category, description, specs } = req.body;

        // Check if product with the same name already exists
        const productExists = await Product.findOne({ name });
        if (productExists) {
            return res.status(400).json({
                success: false,
                error: 'Product with this name already exists'
            });
        }

        // Create product
        const product = await Product.create({
            name,
            category,
            description,
            specs: specs ? JSON.parse(specs) : {}
        });

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Upload product image
// @route   POST /api/products/:id/image
// @access  Private/Admin
export const uploadProductImage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload an image file'
            });
        }

        if (!cloudinary) {
            // Clean up the temp file
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }

            return res.status(503).json({
                success: false,
                error: 'Image upload service not configured. Please contact administrator.'
            });
        }

        try {
            // Delete old image if exists
            if (product.imageUrl) {
                const publicId = product.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`quality-control/products/${publicId}`);
            }

            // Upload new image
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'quality-control/products'
            });

            product.imageUrl = result.secure_url;
            await product.save();

            // Clean up the temp file
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }

            res.status(200).json({
                success: true,
                data: product
            });
        } catch (uploadError) {
            console.error('Cloudinary upload failed:', uploadError);

            // Clean up the temp file
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }

            res.status(500).json({
                success: false,
                error: 'Failed to upload image'
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
    try {
        const { category, search } = req.query;
        const queryObj = {};

        if (category) queryObj.category = category;
        if (search) queryObj.name = { $regex: search, $options: 'i' };

        const products = await Product.find(queryObj);

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Handle specs as a special case
        if (req.body.specs) {
            req.body.specs = JSON.parse(req.body.specs);
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Delete product image from cloudinary if exists
        if (product.imageUrl) {
            const publicId = product.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`quality-control/products/${publicId}`);
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};