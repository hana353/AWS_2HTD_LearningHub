// src/services/test.service.js
// Logic cho module bài kiểm tra

import {
  createQuestion,
  getQuestionsByAuthor
} from '../models/question.model.js';
import {
  createExamWithQuestions,
  getExamDetail
} from '../models/exam.model.js';

// Tạo câu hỏi cho giáo viên
export async function createTeacherQuestion(teacherId, payload) {
  const { title, body, type, choices, difficulty, tags } = payload;

  const choicesJson = choices ? JSON.stringify(choices) : null;
  const tagsJson = tags ? JSON.stringify(tags) : null;

  const question = await createQuestion({
    authorId: teacherId,
    title,
    body,
    type,
    choicesJson,
    difficulty,
    tagsJson
  });

  // parse JSON trả ra cho FE dễ dùng
  if (question.choices) {
    question.choices = JSON.parse(question.choices);
  }
  if (question.tags) {
    question.tags = JSON.parse(question.tags);
  }

  return question;
}

// Lấy câu hỏi của giáo viên
export async function listTeacherQuestions(teacherId, { search, type, page, pageSize }) {
  const questions = await getQuestionsByAuthor({
    authorId: teacherId,
    search,
    type,
    page,
    pageSize
  });

  return questions.map((q) => ({
    ...q,
    choices: q.choices ? JSON.parse(q.choices) : null,
    tags: q.tags ? JSON.parse(q.tags) : null
  }));
}

// Tạo bài kiểm tra
export async function createTeacherExam(teacherId, payload) {
  const exam = await createExamWithQuestions({
    courseId: payload.courseId || null,
    title: payload.title,
    description: payload.description,
    durationMinutes: payload.durationMinutes,
    passingScore: payload.passingScore,
    randomizeQuestions: payload.randomizeQuestions,
    createdBy: teacherId,
    questions: payload.questions
  });

  return exam;
}

// Lấy chi tiết exam
export async function getTeacherExamDetail(examId) {
  const exam = await getExamDetail(examId);
  if (!exam) return null;

  // parse JSON choices/tags
  exam.questions = exam.questions.map((q) => ({
    ...q,
    choices: q.choices ? JSON.parse(q.choices) : null,
    tags: q.tags ? JSON.parse(q.tags) : null
  }));

  return exam;
}
