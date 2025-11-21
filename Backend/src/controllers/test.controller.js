// src/controllers/test.controller.js

import { successResponse, errorResponse } from '../utils/response.js';
import { createQuestionSchema } from '../validators/question.validator.js';
import { createExamSchema } from '../validators/exam.validator.js';
import * as testService from '../services/test.service.js';

// POST /api/tests/questions
export async function createQuestion(req, res, next) {
  try {
    const { error, value } = createQuestionSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const teacherId = req.user.localUserId; // từ auth.middleware
    const question = await testService.createTeacherQuestion(teacherId, value);

    return successResponse(res, question, 'Question created', 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/questions
export async function listMyQuestions(req, res, next) {
  try {
    const teacherId = req.user.localUserId;

    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);
    const search = req.query.search || null;
    const type = req.query.type || null;

    const questions = await testService.listTeacherQuestions(teacherId, {
      search,
      type,
      page,
      pageSize
    });

    return successResponse(res, { items: questions, page, pageSize });
  } catch (err) {
    return next(err);
  }
}

// POST /api/tests/exams
export async function createExam(req, res, next) {
  try {
    const { error, value } = createExamSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, 'Validation error', 400, details);
    }

    const teacherId = req.user.localUserId;
    const exam = await testService.createTeacherExam(teacherId, value);

    return successResponse(res, exam, 'Exam created', 201);
  } catch (err) {
    return next(err);
  }
}

// GET /api/tests/exams/:id
export async function getExamDetail(req, res, next) {
  try {
    const { id } = req.params;
    const exam = await testService.getTeacherExamDetail(id);

    if (!exam) {
      return errorResponse(res, 'Exam not found', 404);
    }

    return successResponse(res, exam);
  } catch (err) {
    return next(err);
  }
}
