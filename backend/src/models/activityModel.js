import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login',
            'logout',
            'inspection_created',
            'inspection_updated',
            'inspection_completed',
            'product_created',
            'product_updated',
            'user_created',
            'user_updated',
            'user_deleted',
            'report_generated',
            'defect_logged',
            'batch_processed',
            'profile_updated'
        ]
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: true
});

// Index for efficient querying
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
