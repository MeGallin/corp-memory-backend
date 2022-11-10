import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import colors from 'colors';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

//Import Routes
import memoryRoutes from './Routes/MemoryRoutes.js';
import userRoutes from './Routes/UserRoutes.js';
import contactFormRoutes from './Routes/contactFormRoutes.js';
import emailConfirmationRoutes from './Routes/emailConfirmationRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import uploadRoutes from './Routes/uploadRoutes.js';
import memoryImageUploadRoutes from './Routes/memoryImageUploadRoutes.js';

dotenv.config();
connectDB();
const app = express();
app.use(cors());
app.use(express.json()); // This needed to accept json data

//USER Routes
app.use('/api', userRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/memory-image', memoryRoutes);
app.use('/api/memories', memoryRoutes);

app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
//Contact form
app.use('/api/contact', contactFormRoutes);
//email confirmation routes
app.use('/api/confirm', emailConfirmationRoutes);
//Admin Routes
app.use('/api/admin/user-memories', adminRoutes);
app.use('/api/admin/user', adminRoutes);
// Profile Upload Routes
app.use('/api/profileUpload', uploadRoutes);
// Memory Upload Routes
app.use('/api/memory-image-upload', memoryImageUploadRoutes);

const __dirname = path.resolve();
if (process.env.NODE_ENV === 'production') {
  // Create a static folder
  app.use(express.static(path.join(__dirname, '/frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running in  Development or there was an error');
  });
}

// @Error handling middleware
app.use(notFound);
app.use(errorHandler);
// @Error handling middleware

const PORT = process.env.PORT || 5000;
const MODE = process.env.NODE_ENV;

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} and you are running in ${MODE}`,
  );
});
