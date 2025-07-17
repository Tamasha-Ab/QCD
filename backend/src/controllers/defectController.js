import mongoose from 'mongoose';
import Defect from '../models/defectModel.js';
import Inspection from '../models/inspectionModel.js';
import Product from '../models/productModel.js';
import { createCriticalDefectAlert } from './alertController.js';
import configureCloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
const cloudinary = configureCloudinary();

// @desc    Create new defect
// @route   POST /api/defects
// @access  Private
export const createDefect = async (req, res) => {
    try {
        const {
            inspection,
            product,
            type,
            severity,
            description,
            location,
            rootCause,
            measurements,
            status,
            detectedBy,
            aiConfidence
        } = req.body;

        // Check if inspection exists
        const inspectionExists = await Inspection.findById(inspection);
        if (!inspectionExists) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        // Check if product exists
        const productExists = await Product.findById(product);
        if (!productExists) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        let imageUrl = '';

        // Handle image upload if provided
        if (req.file) {
            if (cloudinary) {
                try {
                    const result = await cloudinary.uploader.upload(req.file.path, {
                        folder: 'quality-control/defects'
                    });
                    imageUrl = result.secure_url;

                    // Clean up the uploaded file after successful upload
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (cleanupError) {
                        console.error('Error cleaning up temporary file:', cleanupError);
                    }
                } catch (uploadError) {
                    console.error('Cloudinary upload failed:', uploadError);
                    // Continue without image URL - the defect will still be created
                    console.log('Continuing defect creation without image upload');
                }
            } else {
                // Cloudinary not configured - save file locally or skip image upload
                console.warn('Cloudinary not configured. Image upload skipped.');
                console.log('To enable image uploads, configure Cloudinary environment variables in .env file');

                // Optionally, you could save the file locally here
                // For now, we'll just continue without the image
            }
        }

        // Parse measurements if provided as string
        let parsedMeasurements = measurements;
        if (typeof measurements === 'string' && measurements) {
            try {
                parsedMeasurements = JSON.parse(measurements);
            } catch (e) {
                console.error('Error parsing measurements:', e);
                parsedMeasurements = null;
            }
        }

        // Create defect
        const defect = await Defect.create({
            inspection,
            product,
            type,
            severity,
            description,
            location,
            rootCause: rootCause || 'unknown',
            status: status || 'open',
            measurements: parsedMeasurements,
            imageUrl,
            detectedBy: detectedBy || 'manual',
            aiConfidence: aiConfidence || 0,
            reportedBy: req.user._id
        });

        // Update inspection defect count
        await Inspection.findByIdAndUpdate(
            inspection,
            { $inc: { defectsFound: 1 } }
        );

        // Create an alert if this is a critical defect
        if (severity === 'critical') {
            await createCriticalDefectAlert(defect, inspectionExists);
        }

        // Return the defect with populated references for better user experience
        const populatedDefect = await Defect.findById(defect._id)
            .populate('inspection', 'batchNumber date')
            .populate('product', 'name category')
            .populate('reportedBy', 'name role');

        res.status(201).json({ success: true, data: populatedDefect });
    } catch (error) {
        console.error('Error creating defect:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all defects
// @route   GET /api/defects
// @access  Private
export const getDefects = async (req, res) => {
    try {
        const { product, type, severity, inspection, status, rootCause, startDate, endDate } = req.query;
        const queryObj = {};

        if (product) queryObj.product = product;
        if (type) queryObj.type = type;
        if (severity) queryObj.severity = severity;
        if (inspection) queryObj.inspection = inspection;
        if (status) queryObj.status = status;
        if (rootCause) queryObj.rootCause = rootCause;

        // Date range filtering
        if (startDate && endDate) {
            // Validate date parsing
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid date format' });
            }

            // Validate that end date is not earlier than start date
            if (end < start) {
                return res.status(400).json({
                    success: false,
                    error: 'End date cannot be earlier than start date'
                });
            }

            queryObj.createdAt = {
                $gte: start,
                $lte: end
            };
        } else if (startDate) {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid start date format' });
            }
            queryObj.createdAt = { $gte: start };
        } else if (endDate) {
            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid end date format' });
            }
            queryObj.createdAt = { $lte: end };
        }

        let query = Defect.find(queryObj)
            .populate('inspection', 'batchNumber date status')
            .populate('product', 'name category')
            .populate('reportedBy', 'name role')
            .populate('resolvedBy', 'name role');

        // Sorting
        const sort = req.query.sort || '-createdAt';
        query = query.sort(sort);

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Defect.countDocuments(queryObj);

        query = query.skip(startIndex).limit(limit);

        // Execute query
        const defects = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: defects.length,
            pagination,
            total,
            data: defects
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get single defect
// @route   GET /api/defects/:id
// @access  Private
export const getDefect = async (req, res) => {
    try {
        const defect = await Defect.findById(req.params.id)
            .populate('inspection', 'batchNumber date status totalInspected')
            .populate('product', 'name category imageUrl')
            .populate('reportedBy', 'name role department')
            .populate('resolvedBy', 'name role department');

        if (!defect) {
            return res.status(404).json({ success: false, error: 'Defect not found' });
        }

        res.status(200).json({ success: true, data: defect });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update defect
// @route   PUT /api/defects/:id
// @access  Private
export const updateDefect = async (req, res) => {
    try {
        let defect = await Defect.findById(req.params.id);

        if (!defect) {
            return res.status(404).json({ success: false, error: 'Defect not found' });
        }

        // Handle image upload if provided
        if (req.file) {
            if (cloudinary) {
                try {
                    // Delete old image if exists
                    if (defect.imageUrl) {
                        const publicId = defect.imageUrl.split('/').pop().split('.')[0];
                        await cloudinary.uploader.destroy(`quality-control/defects/${publicId}`);
                    }

                    const result = await cloudinary.uploader.upload(req.file.path, {
                        folder: 'quality-control/defects'
                    });
                    req.body.imageUrl = result.secure_url;

                    // Clean up the uploaded file after successful upload
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (cleanupError) {
                        console.error('Error cleaning up temporary file:', cleanupError);
                    }
                } catch (uploadError) {
                    console.error('Cloudinary upload failed:', uploadError);
                    // Clean up the uploaded file
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (cleanupError) {
                        console.error('Error cleaning up temporary file:', cleanupError);
                    }
                    // Continue without updating image
                }
            } else {
                console.warn('Cloudinary not configured. Image upload skipped.');
                // Clean up the uploaded file
                try {
                    fs.unlinkSync(req.file.path);
                } catch (cleanupError) {
                    console.error('Error cleaning up temporary file:', cleanupError);
                }
            }
        }

        // Handle resolution
        if (req.body.status === 'resolved' && defect.status !== 'resolved') {
            req.body.resolvedAt = new Date();
            req.body.resolvedBy = req.user._id;
        }

        // Parse measurements if provided as string
        if (typeof req.body.measurements === 'string' && req.body.measurements) {
            try {
                req.body.measurements = JSON.parse(req.body.measurements);
            } catch (e) {
                console.error('Error parsing measurements:', e);
                delete req.body.measurements;
            }
        }

        defect = await Defect.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
            .populate('inspection', 'batchNumber date status')
            .populate('product', 'name category')
            .populate('reportedBy', 'name role')
            .populate('resolvedBy', 'name role');

        res.status(200).json({ success: true, data: defect });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete defect
// @route   DELETE /api/defects/:id
// @access  Private
export const deleteDefect = async (req, res) => {
    try {
        const defect = await Defect.findById(req.params.id);

        if (!defect) {
            return res.status(404).json({ success: false, error: 'Defect not found' });
        }

        // Check authorization: user must be the creator of the defect OR have manager/admin role
        const isCreator = defect.reportedBy.toString() === req.user._id.toString();
        const hasManagerRole = ['manager', 'admin'].includes(req.user.role);

        if (!isCreator && !hasManagerRole) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this defect. Only the creator or managers/admins can delete defects.'
            });
        }

        // Delete image from cloudinary if exists
        if (defect.imageUrl) {
            const publicId = defect.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`quality-control/defects/${publicId}`);
        }

        // Decrement inspection defect count
        await Inspection.findByIdAndUpdate(
            defect.inspection,
            { $inc: { defectsFound: -1 } }
        );

        await defect.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get defect statistics
// @route   GET /api/defects/stats
// @access  Private
export const getDefectStats = async (req, res) => {
    try {
        const { product, startDate, endDate } = req.query;

        const matchQuery = {};

        if (product) {
            matchQuery.product = mongoose.Types.ObjectId(product);
        }

        if (startDate && endDate) {
            // Validate date parsing
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid date format' });
            }

            // Validate that end date is not earlier than start date
            if (end < start) {
                return res.status(400).json({
                    success: false,
                    error: 'End date cannot be earlier than start date'
                });
            }

            matchQuery.createdAt = {
                $gte: start,
                $lte: end
            };
        } else if (startDate) {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid start date format' });
            }
            matchQuery.createdAt = { $gte: start };
        } else if (endDate) {
            const end = new Date(endDate);
            if (isNaN(end.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid end date format' });
            }
            matchQuery.createdAt = { $lte: end };
        }

        // Count by type
        const defectsByType = await Defect.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Count by severity
        const defectsBySeverity = await Defect.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$severity', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }  // Sort by severity (minor, major, critical)
        ]);

        // Count by root cause
        const defectsByRootCause = await Defect.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$rootCause', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Count by status
        const defectsByStatus = await Defect.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get trend over time (daily)
        const defectTrend = await Defect.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                    critical: {
                        $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
                    },
                    major: {
                        $sum: { $cond: [{ $eq: ['$severity', 'major'] }, 1, 0] }
                    },
                    minor: {
                        $sum: { $cond: [{ $eq: ['$severity', 'minor'] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                defectsByType,
                defectsBySeverity,
                defectsByRootCause,
                defectsByStatus,
                defectTrend
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Resolve a defect
// @route   PUT /api/defects/:id/resolve
// @access  Private
export const resolveDefect = async (req, res) => {
    try {
        const { resolutionNotes } = req.body;

        const defect = await Defect.findById(req.params.id);

        if (!defect) {
            return res.status(404).json({ success: false, error: 'Defect not found' });
        }

        // Update defect status to resolved
        defect.status = 'resolved';
        defect.resolvedAt = new Date();
        defect.resolvedBy = req.user._id;

        if (resolutionNotes) {
            defect.resolutionNotes = resolutionNotes;
        }

        await defect.save();

        const updatedDefect = await Defect.findById(req.params.id)
            .populate('inspection', 'batchNumber date status')
            .populate('product', 'name category')
            .populate('reportedBy', 'name role')
            .populate('resolvedBy', 'name role');

        res.status(200).json({ success: true, data: updatedDefect });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Bulk create defects
// @route   POST /api/defects/bulk
// @access  Private
export const bulkCreateDefects = async (req, res) => {
    try {
        const { defects } = req.body;

        if (!defects || !Array.isArray(defects) || defects.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an array of defects'
            });
        }

        const createdDefects = [];
        const errors = [];

        // Process each defect in the array
        for (let i = 0; i < defects.length; i++) {
            const defectData = defects[i];

            try {
                // Validate inspection and product
                const inspection = await Inspection.findById(defectData.inspection);
                if (!inspection) {
                    errors.push({
                        index: i,
                        error: `Inspection not found for defect at index ${i}`
                    });
                    continue;
                }

                const defect = await Defect.create({
                    ...defectData,
                    reportedBy: req.user._id,
                    detectedBy: defectData.detectedBy || 'manual',
                });

                // Update inspection defect count
                await Inspection.findByIdAndUpdate(
                    defectData.inspection,
                    { $inc: { defectsFound: 1 } }
                );

                // Create alert if critical
                if (defectData.severity === 'critical') {
                    await createCriticalDefectAlert(defect, inspection);
                }

                createdDefects.push(defect);
            } catch (error) {
                errors.push({
                    index: i,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            createdCount: createdDefects.length,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
            data: createdDefects
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};