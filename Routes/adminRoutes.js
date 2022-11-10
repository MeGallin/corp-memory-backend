import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllUsersMemories,
  updateIsSuspended,
} from '../controllers/adminController.js';

const router = express.Router();

router.route('/').get(protect, admin, getAllUsersMemories);

//Suspend Unsuspend a userController
router.route('/:id').put(protect, admin, updateIsSuspended);

export default router;
