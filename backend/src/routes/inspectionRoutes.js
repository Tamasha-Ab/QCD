// routes/inspectionRoutes.js
import express from 'express';
import {
    createInspection,
    getInspections,
    getInspection,
    updateInspection,
    deleteInspection,
    uploadInspectionImages,
    completeInspection
} from '../controllers/inspectionController.js';
import { protect, authorize, canDeleteInspection } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router
    .route('/')
    .post(protect, createInspection)
    .get(protect, getInspections);

router
    .route('/:id')
    .get(protect, getInspection)
    .put(protect, updateInspection)
    .delete(protect, canDeleteInspection, deleteInspection);

router.post(
    '/:id/images',
    protect,
    upload.array('images', 5),
    uploadInspectionImages
);

router.put('/:id/complete', protect, completeInspection);

export default router;