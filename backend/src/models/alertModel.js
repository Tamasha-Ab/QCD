import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['high-defect-rate', 'inspection-failed', 'critical-defect', 'other'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },
        inspection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inspection'
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        defect: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Defect'
        },
        defectRate: {
            type: Number
        },
        threshold: {
            type: Number
        },
        read: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;