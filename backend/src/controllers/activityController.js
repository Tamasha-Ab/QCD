import Activity from '../models/activityModel.js';

// @desc    Get recent activities
// @route   GET /api/activities
// @access  Private
export const getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const activities = await Activity.find()
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Activity.countDocuments();

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activities'
        });
    }
};

// @desc    Log activity
// @route   POST /api/activities
// @access  Private
export const logActivity = async (req, res) => {
    try {
        const { action, description, metadata } = req.body;

        const activity = await Activity.create({
            user: req.user._id,
            action,
            description,
            metadata: metadata || {},
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        await activity.populate('user', 'name email role');

        res.status(201).json({
            success: true,
            data: activity
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log activity'
        });
    }
};

// Helper function to log activity (to be used in other controllers)
export const createActivity = async (userId, action, description, metadata = {}) => {
    try {
        const activity = await Activity.create({
            user: userId,
            action,
            description,
            metadata
        });
        return activity;
    } catch (error) {
        console.error('Error creating activity:', error);
        return null;
    }
};
