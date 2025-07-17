// controllers/inspectionController.js
import Inspection from '../models/inspectionModel.js';
import Defect from '../models/defectModel.js';
import { createDefectRateAlert } from './alertController.js';
import { createActivity } from './activityController.js';
import configureCloudinary from '../config/cloudinary.js';
import fs from 'fs';
import mongoose from 'mongoose';

// Configure Cloudinary
const cloudinary = configureCloudinary();

export const createInspection = async (req, res) => {
    try {
        const { product, batchNumber, notes, totalInspected } = req.body;

        console.log("Creating inspection with data:", { product, batchNumber, notes, totalInspected });

        const inspection = await Inspection.create({
            product,
            inspector: req.user._id,
            batchNumber,
            notes,
            totalInspected,
            images: []
        });

        console.log("Inspection created successfully:", inspection._id);

        // Populate the inspection data before returning
        const populatedInspection = await Inspection.findById(inspection._id)
            .populate('product', 'name category')
            .populate('inspector', 'name role');

        // Log activity
        await createActivity(
            req.user._id,
            'inspection_created',
            `Created inspection for batch ${batchNumber}`,
            { inspectionId: inspection._id, batchNumber, totalInspected }
        );

        res.status(201).json({ success: true, data: populatedInspection });
    } catch (error) {
        console.error("Error creating inspection:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const uploadInspectionImages = async (req, res) => {
    try {
        const inspection = await Inspection.findById(req.params.id);
        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        // Check if files were provided
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please upload at least one image file'
            });
        }

        const uploadedImages = await Promise.all(req.files.map(async file => {
            if (cloudinary) {
                try {
                    const result = await cloudinary.uploader.upload(file.path, {
                        folder: 'quality-control/inspections'
                    });

                    // Clean up the temp file after upload
                    try {
                        fs.unlinkSync(file.path);
                    } catch (err) {
                        console.error('Error deleting temp file:', err);
                    }

                    return {
                        url: result.secure_url,
                        publicId: result.public_id,
                        defectsDetected: false,
                        aiConfidence: 0
                    };
                } catch (uploadError) {
                    console.error('Cloudinary upload failed for file:', file.path, uploadError);
                    // Clean up the temp file even if upload failed
                    try {
                        fs.unlinkSync(file.path);
                    } catch (err) {
                        console.error('Error deleting temp file:', err);
                    }
                    return null; // Skip this file
                }
            } else {
                console.warn('Cloudinary not configured. Inspection image upload skipped.');
                // Clean up the temp file
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    console.error('Error deleting temp file:', err);
                }
                return null; // Skip this file
            }
        }));

        // Filter out null results (failed uploads)
        const validImages = uploadedImages.filter(image => image !== null);

        inspection.images.push(...validImages);
        await inspection.save();

        res.status(200).json({ success: true, data: inspection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getInspections = async (req, res) => {
    try {
        const { product, status, date, inspector } = req.query;
        const queryObj = {};

        if (product) queryObj.product = product;
        if (status) queryObj.status = status;
        if (inspector) queryObj.inspector = inspector;
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            queryObj.date = { $gte: start, $lte: end };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Increased from 10 to 50
        const skip = (page - 1) * limit;

        const [inspections, total] = await Promise.all([
            Inspection.find(queryObj)
                .populate('product', 'name category')
                .populate('inspector', 'name role')
                .sort({ date: -1, createdAt: -1 }) // Sort by newest first
                .skip(skip)
                .limit(limit),
            Inspection.countDocuments(queryObj)
        ]);

        res.status(200).json({
            success: true,
            count: inspections.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: inspections
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getInspection = async (req, res) => {
    try {
        const inspection = await Inspection.findById(req.params.id)
            .populate('product', 'name category')
            .populate('inspector', 'name role');

        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        const defects = await Defect.find({ inspection: req.params.id })
            .populate('product', 'name category')
            .populate('reportedBy', 'name role');

        res.status(200).json({ success: true, data: { inspection, defects } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateInspection = async (req, res) => {
    try {
        let inspection = await Inspection.findById(req.params.id);
        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Log activity
        await createActivity(
            req.user._id,
            'inspection_updated',
            `Updated inspection for batch ${inspection.batchNumber}`,
            { inspectionId: inspection._id, batchNumber: inspection.batchNumber }
        );

        res.status(200).json({ success: true, data: inspection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteInspection = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log(`Invalid inspection ID format: ${id}`);
            return res.status(400).json({
                success: false,
                error: 'Invalid inspection ID format'
            });
        }

        // Log the request
        console.log(`Attempting to delete inspection with ID: ${id} by user: ${req.user._id}`);

        // Find the inspection first to check if it exists
        const inspection = await Inspection.findById(id);

        if (!inspection) {
            console.log(`Inspection with ID ${id} not found`);
            return res.status(404).json({
                success: false,
                error: 'Inspection not found'
            });
        }

        // Log inspection details
        console.log(`Found inspection: ${inspection._id}, Inspector: ${inspection.inspector}`);

        // Delete the inspection
        const deletedInspection = await Inspection.findByIdAndDelete(id);

        if (!deletedInspection) {
            console.log(`Failed to delete inspection with ID ${id}`);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete inspection'
            });
        }

        console.log(`Successfully deleted inspection: ${id}`);

        // Also delete any defects associated with this inspection
        const deleteDefectsResult = await Defect.deleteMany({ inspection: id });
        console.log(`Deleted ${deleteDefectsResult.deletedCount} associated defects for inspection: ${id}`);

        // Log activity
        await createActivity(
            req.user._id,
            'inspection_deleted',
            `Deleted inspection for batch ${deletedInspection.batchNumber}`,
            { inspectionId: deletedInspection._id, batchNumber: deletedInspection.batchNumber }
        );

        return res.status(200).json({
            success: true,
            message: 'Inspection deleted successfully',
            data: {}
        });
    } catch (error) {
        console.error(`Error deleting inspection: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
        return res.status(500).json({
            success: false,
            error: `Server Error: ${error.message}`
        });
    }
};

export const completeInspection = async (req, res) => {
    try {
        const inspection = await Inspection.findById(req.params.id);
        if (!inspection) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        const defectsCount = await Defect.countDocuments({ inspection: req.params.id });
        const status = defectsCount > 0 ? 'failed' : 'completed';

        inspection.status = status;
        inspection.defectsFound = defectsCount;

        await inspection.save();

        const defectRate = (defectsCount / inspection.totalInspected) * 100;
        const DEFECT_RATE_THRESHOLD = 5;

        if (defectRate > DEFECT_RATE_THRESHOLD) {
            await createDefectRateAlert(inspection, defectRate, DEFECT_RATE_THRESHOLD);
        }

        // Log activity
        await createActivity(
            req.user._id,
            'inspection_completed',
            `Completed inspection for batch ${inspection.batchNumber} with status: ${status}`,
            {
                inspectionId: inspection._id,
                batchNumber: inspection.batchNumber,
                status,
                defectsFound: defectsCount,
                defectRate: defectRate.toFixed(2)
            }
        );

        res.status(200).json({ success: true, data: inspection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
