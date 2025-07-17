import Alert from '../models/alertModel.js';
import User from '../models/userModel.js';

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private (Managers, Admins)
export const getAlerts = async (req, res) => {
    try {
        const { read, type, severity } = req.query;
        const queryObj = {};

        if (read !== undefined) {
            queryObj.read = read === 'true';
        }
        if (type) queryObj.type = type;
        if (severity) queryObj.severity = severity;

        // Sort by createdAt in descending order (newest first)
        const alerts = await Alert.find(queryObj)
            .populate('inspection', 'batchNumber date status')
            .populate('product', 'name category')
            .populate('defect', 'type severity')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get alert by ID
// @route   GET /api/alerts/:id
// @access  Private (Managers, Admins)
export const getAlert = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate('inspection', 'batchNumber date status')
            .populate('product', 'name category')
            .populate('defect', 'type severity');

        if (!alert) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }

        res.status(200).json({
            success: true,
            data: alert
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Mark alert as read
// @route   PUT /api/alerts/:id/read
// @access  Private (Managers, Admins)
export const markAlertAsRead = async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }

        res.status(200).json({
            success: true,
            data: alert
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Mark all alerts as read
// @route   PUT /api/alerts/read-all
// @access  Private (Managers, Admins)
export const markAllAlertsAsRead = async (req, res) => {
    try {
        await Alert.updateMany({}, { read: true });

        res.status(200).json({
            success: true,
            message: 'All alerts marked as read'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete alert
// @route   DELETE /api/alerts/:id
// @access  Private (Managers, Admins)
export const deleteAlert = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }

        await alert.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Internal service function to create alerts
export const createDefectRateAlert = async (inspection, defectRate, threshold) => {
    try {
        // Create the alert
        const alert = await Alert.create({
            type: 'high-defect-rate',
            message: `High defect rate of ${defectRate.toFixed(2)}% detected for batch ${inspection.batchNumber} (threshold: ${threshold}%)`,
            severity: defectRate > threshold * 1.5 ? 'critical' : 'high',
            inspection: inspection._id,
            product: inspection.product,
            defectRate: defectRate,
            threshold: threshold
        });

        // In a real application, you might implement email/SMS notifications here
        // For now, we'll just log the alert
        console.log(`ALERT: ${alert.message}`);

        // Find all managers to notify
        const managers = await User.find({
            role: { $in: ['manager', 'admin'] }
        }).select('name email');

        // In a real application, send notifications to managers
        if (managers.length > 0) {
            console.log(`Notifying ${managers.length} managers about high defect rate`);
            // Here you would implement your notification mechanism (email, SMS, push notification)
        }

        return alert;
    } catch (error) {
        console.error('Error creating alert:', error);
        return null;
    }
};

// Create an alert for critical defects
export const createCriticalDefectAlert = async (defect, inspection) => {
    try {
        if (defect.severity !== 'critical') return null;

        const alert = await Alert.create({
            type: 'critical-defect',
            message: `Critical defect detected in batch ${inspection.batchNumber} (${defect.type})`,
            severity: 'high',
            inspection: inspection._id,
            product: defect.product,
            defect: defect._id
        });

        console.log(`ALERT: ${alert.message}`);
        return alert;
    } catch (error) {
        console.error('Error creating critical defect alert:', error);
        return null;
    }
};