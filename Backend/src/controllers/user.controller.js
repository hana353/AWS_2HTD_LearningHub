// src/controllers/user.controller.js

import { listUsers, editUserByAdmin, deleteUserAsAdmin, restoreUserAsAdmin} from '../services/user.service.js';
import { register as registerService } from '../services/auth.service.js';

// List user cho Admin
export async function getUserList(req, res, next) {
  try {
    const { page, limit, search } = req.query;

    const result = await listUsers({ page, limit, search });

    const users = result.users.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      role_name: u.role_name,
      email_verified: u.email_verified,
      created_at: u.created_at
    }));

    return res.status(200).json({
      success: true,
      message: 'User list fetched successfully',
      data: {
        users,
        pagination: result.pagination
      }
    });
  } catch (err) {
    next(err);
  }
}

// Admin tạo user (reuse auth.service.register)
export async function adminCreateUser(req, res, next) {
  try {
    const { email, password, fullName, phone, role } = req.body;

    const result = await registerService({
      email,
      password,
      fullName,
      phone,
      role
    });

    return res.status(201).json({
      success: true,
      message: 'User created by admin successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

//  Admin edit user (fullName, phone, role)
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { fullName, phone, role } = req.body;

    const updated = await editUserByAdmin(id, { fullName, phone, role });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updated.id,
        email: updated.email, // chỉ hiển thị, không cho sửa
        full_name: updated.full_name,
        phone: updated.phone,
        role_id: updated.role_id,
        role_name: updated.role_name
      }
    });
  } catch (err) {
    next(err);
  }
}

// Xoá user (soft delete)
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    await deleteUserAsAdmin(id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}

// Khôi phục user đã xóa mềm
export async function restoreUser(req, res, next) {
  try {
    const { id } = req.params;

    await restoreUserAsAdmin(id);

    return res.status(200).json({
      success: true,
      message: 'User restored successfully'
    });
  } catch (err) {
    next(err);
  }
}