import express from 'express';
import {
    getAlerts,
    getAlert,
    markAlertAsRead,
    markAllAlertsAsRead,
    deleteAlert
} from '../controllers/alertController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only managers and admins should have access to alerts
router.use(protect, authorize('manager', 'admin'));

router.route('/')
    .get(getAlerts);

router.route('/read-all')
    .put(markAllAlertsAsRead);

router.route('/:id')
    .get(getAlert)
    .delete(deleteAlert);

router.route('/:id/read')
    .put(markAlertAsRead);

export default router;