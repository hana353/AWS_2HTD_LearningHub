// src/models/submission.model.js
import { sql, pool, poolConnect } from '../config/db.js';

// Tạo lượt làm bài (submission) mới cho 1 học sinh
export async function createSubmission({ examId, userId, autoGraded = true }) {
  await poolConnect;
  const request = pool.request();

  request.input('exam_id', sql.UniqueIdentifier, examId);
  request.input('user_id', sql.UniqueIdentifier, userId);
  request.input('auto_graded', sql.Bit, autoGraded ? 1 : 0);

  const result = await request.query(`
    INSERT INTO submissions (exam_id, user_id, auto_graded)
    OUTPUT inserted.*
    VALUES (@exam_id, @user_id, @auto_graded);
  `);

  return result.recordset[0];
}

// Lấy thông tin 1 submission
export async function getSubmissionById(submissionId) {
  await poolConnect;
  const request = pool.request();

  request.input('id', sql.UniqueIdentifier, submissionId);

  const result = await request.query(`
    SELECT *
    FROM submissions
    WHERE id = @id;
  `);

  return result.recordset[0];
}

// Lưu kết quả chấm điểm: cập nhật submissions + các submission_items
export async function saveSubmissionGrading({
  submissionId,
  items,
  totalScore,
  resultSummary
}) {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Xoá các item cũ (nếu có) để tránh trùng
    let request = new sql.Request(transaction);
    request.input('submission_id', sql.UniqueIdentifier, submissionId);
    await request.query(`
      DELETE FROM submission_items
      WHERE submission_id = @submission_id;
    `);

    // Thêm từng câu trả lời
    for (const item of items) {
      const itemReq = new sql.Request(transaction);
      itemReq.input('submission_id', sql.UniqueIdentifier, submissionId);
      itemReq.input('question_id', sql.UniqueIdentifier, item.questionId);
      itemReq.input('answer', sql.NVarChar(sql.MAX), item.answerJson);
      itemReq.input(
        'awarded_points',
        sql.Decimal(6, 2),
        item.awardedPoints ?? 0
      );
      itemReq.input('graded', sql.Bit, item.graded ? 1 : 0);

      await itemReq.query(`
        INSERT INTO submission_items (
          submission_id,
          question_id,
          answer,
          awarded_points,
          graded
        )
        VALUES (
          @submission_id,
          @question_id,
          @answer,
          @awarded_points,
          @graded
        );
      `);
    }

    // Cập nhật tổng điểm và trạng thái submission
    const updateReq = new sql.Request(transaction);
    updateReq.input('submission_id', sql.UniqueIdentifier, submissionId);
    updateReq.input('total_score', sql.Decimal(8, 2), totalScore);
    updateReq.input(
      'result',
      sql.NVarChar(sql.MAX),
      JSON.stringify(resultSummary)
    );

    await updateReq.query(`
      UPDATE submissions
      SET
        submitted_at = SYSDATETIMEOFFSET(),
        duration_seconds = DATEDIFF(SECOND, started_at, SYSDATETIMEOFFSET()),
        total_score = @total_score,
        status = N'completed',
        auto_graded = 1,
        result = @result
      WHERE id = @submission_id;
    `);

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
