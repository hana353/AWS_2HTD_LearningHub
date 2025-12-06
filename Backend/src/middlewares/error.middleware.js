// src/middlewares/error.middleware.js
// Middleware bắt lỗi chung cho toàn app

import { errorResponse } from '../utils/response.js';
import multer from 'multer';

export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Xử lý lỗi multer (upload file)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File too large. Maximum size is 500MB', 400);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return errorResponse(res, 'Too many files. Maximum is 10 files', 400);
    }
    return errorResponse(res, `Upload error: ${err.message}`, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || undefined;

  return errorResponse(res, message, statusCode, errors);
}
