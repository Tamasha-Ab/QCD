import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Routes anyone logged in can access
router.route('/:id').put(protect, upload.single('profilePhoto'), updateUser);

// Admin-only routes below
router.use(protect, authorize('admin'));

router.route('/').get(getUsers).post(createUser);
router.route('/:id')
  .get(getUser)
  .delete(deleteUser);

export default router;
