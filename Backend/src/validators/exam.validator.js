// src/validators/exam.validator.js

import Joi from 'joi';

export const createExamSchema = Joi.object({
  courseId: Joi.string().guid().allow(null),
  title: Joi.string().max(255).required(),
  description: Joi.string().allow('', null),
  durationMinutes: Joi.number().integer().min(1).required(),
  passingScore: Joi.number().min(0).max(100).required(),
  randomizeQuestions: Joi.boolean().default(false),
  questions: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().guid().required(),
        points: Joi.number().min(0).default(1),
        sequence: Joi.number().integer().min(1).optional()
      })
    )
    .min(1)
    .required()
});
