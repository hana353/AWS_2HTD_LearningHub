// src/middlewares/error.middleware.js
// Middleware bắt lỗi chung cho toàn app

import { errorResponse } from '../utils/response.js';
import multer from 'multer';

export function errorHandler(err, req, res, next) {
  // Log error với thông tin chi tiết
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    name: err.name,
    path: req.path,
    method: req.method,
  });

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

  // Xử lý database connection errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    console.error('Database connection error:', err.code);
    return errorResponse(
      res,
      'Database connection error. Please try again later.',
      503,
      process.env.NODE_ENV === 'development' ? { originalError: err.message } : undefined
    );
  }

  // Xử lý SQL errors
  if (err.name === 'RequestError' || err.name === 'ConnectionError') {
    console.error('SQL Server error:', err);
    return errorResponse(
      res,
      'Database error. Please try again later.',
      503,
      process.env.NODE_ENV === 'development' ? { originalError: err.message } : undefined
    );
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || undefined;

  return errorResponse(res, message, statusCode, errors);
}
