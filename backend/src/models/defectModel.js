import mongoose from 'mongoose';

const defectSchema = new mongoose.Schema({
    inspection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inspection',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    type: {
        type: String,
        required: [true, 'Please specify the defect type'],
        enum: ['visual', 'functional', 'dimensional', 'structural', 'finish', 'material', 'assembly', 'electrical', 'mechanical', 'other']
    },
    severity: {
        type: String,
        required: [true, 'Please specify the defect severity'],
        enum: ['minor', 'major', 'critical']
    },
    description: {
        type: String,
        required: [true, 'Please provide a defect description']
    },
    location: {
        type: String
    },
    measurements: {
        expected: Number,
        actual: Number,
        unit: String
    },
    rootCause: {
        type: String,
        enum: ['design', 'material', 'manufacturing', 'assembly', 'handling', 'unknown'],
        default: 'unknown'
    },
    status: {
        type: String,
        enum: ['open', 'investigating', 'resolved', 'rejected'],
        default: 'open'
    },
    imageUrl: {
        type: String
    },
    detectedBy: {
        type: String,
        enum: ['manual', 'ai'],
        default: 'manual'
    },
    aiConfidence: {
        type: Number,
        min: 0,
        max: 100
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolutionNotes: {
        type: String
    }
});

// Calculate age of defect in days
defectSchema.virtual('ageInDays').get(function () {
    const now = new Date();
    const created = this.createdAt;
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Set virtuals when converting to JSON
defectSchema.set('toJSON', { virtuals: true });
defectSchema.set('toObject', { virtuals: true });

const Defect = mongoose.model('Defect', defectSchema);

export default Defect;