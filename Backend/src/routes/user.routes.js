// src/routes/user.routes.js

import express from 'express';
import {
  getUserList,
  updateUser,
  deleteUser,
  adminCreateUser,
  restoreUser,
  getSoftDeletedUserList
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { registerSchema, adminUpdateUserSchema } from '../validators/auth.validator.js';

const router = express.Router();

// middleware validate body dùng Joi
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    req.body = value;
    next();
  };
}

// GET /api/admin/users?page=1&limit=10&search=...
router.get('/admin/users', authMiddleware, requireRole('Admin'), getUserList);

// POST /api/admin/users  (Admin tạo user)
router.post('/admin/users', authMiddleware, requireRole('Admin'), validateBody(registerSchema), adminCreateUser);

// PATCH /api/admin/users/:id  (Admin edit: fullName, phone, role)
router.patch('/admin/users/:id', authMiddleware, requireRole('Admin'), validateBody(adminUpdateUserSchema), updateUser);

// DELETE /api/admin/users/:id  (soft delete user)
router.delete('/admin/users/:id', authMiddleware, requireRole('Admin'), deleteUser);

//Restore user 
router.patch('/admin/users/:id/restore', authMiddleware,requireRole('Admin'), restoreUser);

//List User Soft Delete
router.get('/admin/users/deleted', requireAdmin, getSoftDeletedUserList);

export default router;
