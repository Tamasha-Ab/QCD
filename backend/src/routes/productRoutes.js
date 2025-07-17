import express from 'express';
import {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router
    .route('/')
    .post(protect, authorize('manager', 'admin', 'inspector'), createProduct)
    .get(protect, getProducts);

router
    .route('/:id')
    .get(protect, getProduct)
    .put(protect, authorize('manager', 'admin', 'inspector'), updateProduct)
    .delete(protect, authorize('manager', 'admin', 'inspector'), deleteProduct);

router.post(
    '/:id/image',
    protect,
    authorize('manager', 'admin', 'inspector'),
    upload.single('image'),
    uploadProductImage
);

export default router;