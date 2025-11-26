// src/validators/submission.validator.js
import Joi from 'joi';

// Payload khi học sinh nộp bài
// Mỗi câu trả lời:
//  - questionId: id câu hỏi
//  - answer: object tuỳ theo type, ví dụ:
//    + trắc nghiệm: { "selectedOptionIndexes": [1] }
//    + cloze:      { "blanks": { "1": "SQL", "2": "LearningHub" } }
//    + short:      { "text": "goes" }
export const submitExamSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().guid().required(),
        answer: Joi.any().required()
      })
    )
    .min(1)
    .required()
});
