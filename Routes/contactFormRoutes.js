import express from 'express';
import { sendContactForm } from '../controllers/contactFormController.js';

const router = express.Router();
router.route('/').post(sendContactForm);

export default router;
