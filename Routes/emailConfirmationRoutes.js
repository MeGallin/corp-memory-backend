import express from 'express';
import { confirmEmail } from '../controllers/emailConfirmationController.js';

const router = express.Router();
router.route('/token=:id').get(confirmEmail);

export default router;
