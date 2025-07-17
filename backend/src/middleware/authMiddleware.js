import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Inspection from '../models/inspectionModel.js';

// Protect routes
export const protect = async (req, res, next) => {
    let token;

    // ✅ Log incoming cookies
    console.log('Cookies:', req.cookies);

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
        // Get token from cookie
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from the token
        req.user = await User.findById(decoded.id).select('-password');

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }
};

// Grant access to specific roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Check if user can delete inspection (admin/manager or the inspector who created it)
export const canDeleteInspection = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if user is admin or manager - they can delete any inspection
        if (req.user.role === 'admin' || req.user.role === 'manager') {
            return next();
        }

        // Check if user is the inspector who created this inspection
        const inspection = await Inspection.findById(id);
        if (!inspection) {
            return res.status(404).json({
                success: false,
                error: 'Inspection not found'
            });
        }

        // Check if current user is the inspector who created this inspection
        if (inspection.inspector.toString() === req.user._id.toString()) {
            return next();
        }

        // User is not authorized to delete this inspection
        return res.status(403).json({
            success: false,
            error: 'Not authorized to delete this inspection. You can only delete inspections you created.'
        });

    } catch (error) {
        console.error('Error in canDeleteInspection middleware:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error while checking permissions'
        });
    }
};
