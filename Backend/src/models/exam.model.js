// src/models/exam.model.js
// Các hàm thao tác với bảng exams, exam_questions

import { sql, pool, poolConnect } from '../config/db.js';

// Tạo exam + gán list câu hỏi trong 1 transaction
export async function createExamWithQuestions({
  courseId,
  title,
  description,
  durationMinutes,
  passingScore,
  randomizeQuestions,
  createdBy,
  questions
}) {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Tạo exam
    const examReq = new sql.Request(transaction);
    examReq.input('course_id', sql.UniqueIdentifier, courseId || null);
    examReq.input('title', sql.NVarChar(255), title);
    examReq.input('description', sql.NVarChar(sql.MAX), description || null);
    examReq.input('duration_minutes', sql.Int, durationMinutes || null);
    examReq.input('passing_score', sql.Decimal(5, 2), passingScore ?? null);
    examReq.input('randomize_questions', sql.Bit, randomizeQuestions ? 1 : 0);
    examReq.input('created_by', sql.UniqueIdentifier, createdBy);

    const examResult = await examReq.query(`
      INSERT INTO exams (
        course_id,
        title,
        description,
        duration_minutes,
        passing_score,
        randomize_questions,
        created_by
      )
      OUTPUT inserted.*
      VALUES (
        @course_id,
        @title,
        @description,
        @duration_minutes,
        @passing_score,
        @randomize_questions,
        @created_by
      );
    `);

    const exam = examResult.recordset[0];

    // Gán câu hỏi
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];

      const qReq = new sql.Request(transaction);
      qReq.input('exam_id', sql.UniqueIdentifier, exam.id);
      qReq.input('question_id', sql.UniqueIdentifier, q.questionId);
      qReq.input('points', sql.Decimal(6, 2), q.points ?? 1);
      qReq.input('sequence', sql.Int, q.sequence ?? i + 1);

      await qReq.query(`
        INSERT INTO exam_questions (exam_id, question_id, points, sequence)
        VALUES (@exam_id, @question_id, @points, @sequence);
      `);
    }

    await transaction.commit();
    return exam;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// Lấy chi tiết exam + list câu hỏi
export async function getExamDetail(examId) {
  await poolConnect;
  const request = pool.request();
  request.input('exam_id', sql.UniqueIdentifier, examId);

  const examResult = await request.query(`
    SELECT 
      e.id,
      e.course_id,
      e.title,
      e.description,
      e.duration_minutes,
      e.passing_score,
      e.randomize_questions,
      e.created_by,
      e.created_at,
      e.published
    FROM exams e
    WHERE e.id = @exam_id;
  `);

  const exam = examResult.recordset[0];
  if (!exam) return null;

  const questionsResult = await request.query(`
    SELECT 
      eq.id,
      eq.points,
      eq.sequence,
      q.id AS question_id,
      q.title,
      q.body,
      q.type,
      q.choices,
      q.difficulty,
      q.tags
    FROM exam_questions eq
    JOIN questions q ON q.id = eq.question_id
    WHERE eq.exam_id = @exam_id
    ORDER BY eq.sequence ASC;
  `);

  exam.questions = questionsResult.recordset;
  return exam;
}
