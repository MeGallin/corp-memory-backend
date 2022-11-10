import express from 'express';
import {
  registerUser,
  loginUser,
  getMyUserData,
  updateUser,
  userForgotPassword,
  userUpdateForgottenPassword,
} from '../controllers/userController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

//Forgotten password Routes
router.route('/user-forgot-password').post(userForgotPassword);
router
  .route('/user-update-forgotten-password')
  .put(userUpdateForgottenPassword);

// Add a user
router.route('/').post(registerUser);
router.route('/login').post(loginUser);
router.route('/user').get(protect, getMyUserData);
router.route('/:id').put(protect, updateUser);

export default router;
