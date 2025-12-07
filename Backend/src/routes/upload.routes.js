// src/routes/upload.routes.js
import { Router } from 'express';
import {
  uploadSingle,
  uploadMultiple,
  uploadLectureFile,
  uploadAvatar,
  uploadFlashcardFile,
  deleteFile,
  getPresignedUrl,
} from '../controllers/upload.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// Upload file bài giảng
router.post('/lecture', uploadSingle, uploadLectureFile);

// Upload avatar
router.post('/avatar', uploadSingle, uploadAvatar);

// Upload file flashcard
router.post('/flashcard', uploadSingle, uploadFlashcardFile);

// Delete file
router.delete('/:s3Key', deleteFile);

// Get presigned URL để download file private
router.get('/presigned/:s3Key', getPresignedUrl);

export default router;

