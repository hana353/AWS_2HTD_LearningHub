// src/services/user.service.js

import {
  getUsersWithProfilePaginated,
  findUserByIdWithProfile,
  updateUserProfileAndRoleByAdmin,
  softDeleteUserById,
  restoreUserById,
  getSoftDeletedUsersWithProfilePaginated
} from '../models/user.model.js';

const ROLE_KEY_TO_ID = {
  member: 2,
  teacher: 3
};

// List user + search + phân trang
export async function listUsers({ page, limit, search }) {
  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const pageSize = Number(limit) > 0 ? Number(limit) : 10;

  const { users, total } = await getUsersWithProfilePaginated(
    pageNumber,
    pageSize,
    search || null
  );

  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    users,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages
    }
  };
}

//  Admin edit user (fullName, phone, role)
export async function editUserByAdmin(targetUserId, { fullName, phone, role }) {
  // 1. Tìm user
  const target = await findUserByIdWithProfile(targetUserId);
  if (!target) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  let newRoleId = null;

  // 2. Nếu có gửi role thì xử lý đổi role
  if (role !== undefined && role !== null) {
    const normalized = String(role).toLowerCase();
    if (!['member', 'teacher'].includes(normalized)) {
      const err = new Error('Role must be member or teacher');
      err.statusCode = 400;
      throw err;
    }

    // Không cho đổi role của Admin
    if (target.role_id === 4) {
      const err = new Error('Cannot change role of Admin user');
      err.statusCode = 400;
      throw err;
    }

    newRoleId = ROLE_KEY_TO_ID[normalized];
  }

  // 3. Gọi model update
  const updated = await updateUserProfileAndRoleByAdmin(targetUserId, {
    fullName,
    phone,
    roleId: newRoleId
  });

  return updated;
}

// Xóa user (soft delete)
export async function deleteUserAsAdmin(targetUserId) {
  const target = await findUserByIdWithProfile(targetUserId);
  if (!target) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Không cho xoá Admin
  if (target.role_id === 4) {
    const err = new Error('Cannot delete Admin user');
    err.statusCode = 400;
    throw err;
  }

  const deleted = await softDeleteUserById(targetUserId);
  return deleted;
}

// Khôi phục user đã xóa mềm
export async function restoreUserAsAdmin(targetUserId) {
  const target = await findUserByIdWithProfile(targetUserId);
  if (!target) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const restored = await restoreUserById(targetUserId);
  return restored;
}

// List user đã xóa mềm + search + phân trang
export async function listSoftDeletedUsers({ page, limit, search }) {
  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const pageSize = Number(limit) > 0 ? Number(limit) : 10;

  const { users, total } = await getSoftDeletedUsersWithProfilePaginated(
    pageNumber,
    pageSize,
    search || null
  );

  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    users,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages
    }
  };
}
