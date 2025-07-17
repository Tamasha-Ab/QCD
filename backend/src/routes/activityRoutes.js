import express from 'express';
import { getRecentActivities, logActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
    .get(getRecentActivities)
    .post(logActivity);

export default router;
