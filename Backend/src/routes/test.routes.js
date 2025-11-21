// src/routes/test.routes.js

import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import {
  createQuestion,
  listMyQuestions,
  createExam,
  getExamDetail
} from '../controllers/test.controller.js';

const router = express.Router();

// Tất cả route dưới đây yêu cầu login + role Teacher hoặc Admin
router.use(authMiddleware, requireRole('Teacher', 'Admin'));

router.post('/questions', createQuestion);
router.get('/questions', listMyQuestions);

router.post('/exams', createExam);
router.get('/exams/:id', getExamDetail);

export default router;
