// src/routes/upload.routes.js
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Tất cả routes upload đều bị tắt hoàn toàn trong bản local
router.use(authMiddleware);

router.all('*', (req, res) => {
  return res.status(501).json({
    message: 'File upload is disabled in this deployment',
  });
});

export default router;

