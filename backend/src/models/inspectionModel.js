// models/inspectionModel.js
import mongoose from 'mongoose';

const inspectionSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    inspector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    batchNumber: {
        type: String,
        required: true
    },
    notes: String,
    images: [
        {
            url: String,
            publicId: String,
            defectsDetected: Boolean,
            aiConfidence: Number
        }
    ],
    defectsFound: {
        type: Number,
        default: 0
    },
    totalInspected: {
        type: Number,
        required: true
    }
}, {
    timestamps: true  // This automatically adds createdAt and updatedAt fields
});

inspectionSchema.virtual('defectRate').get(function () {
    return (this.defectsFound / this.totalInspected) * 100;
});

inspectionSchema.set('toJSON', { virtuals: true });
inspectionSchema.set('toObject', { virtuals: true });

const Inspection = mongoose.model('Inspection', inspectionSchema);
export default Inspection;