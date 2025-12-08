// src/controllers/profile.controller.js
// Controller để user tự quản lý profile của mình

import { findUserByIdWithProfile, updateUserProfile } from '../models/user.model.js';
import { generatePresignedDownloadUrl } from '../services/s3.service.js';
import { successResponse } from '../utils/response.js';

/**
 * GET /api/my/profile
 * Lấy thông tin profile của user hiện tại
 */
export async function getMyProfile(req, res, next) {
  try {
    const userId = req.user.localUserId;

    if (!userId) {
      const err = new Error('LOCAL_USER_NOT_FOUND');
      err.status = 401;
      throw err;
    }

    const user = await findUserByIdWithProfile(userId);

    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    // Tạo presigned URL cho avatar nếu có (bucket private)
    let avatarUrl = null;
    if (user.avatar_s3_key) {
      try {
        avatarUrl = await generatePresignedDownloadUrl(user.avatar_s3_key, 3600); // 1 giờ
      } catch (s3Error) {
        console.error('Error generating presigned URL for avatar:', s3Error);
        // Nếu lỗi, vẫn trả về null thay vì throw error
        avatarUrl = null;
      }
    }

    return successResponse(res, {
      id: user.id,
      email: user.email,
      fullName: user.full_name || '',
      phone: user.phone || '',
      avatar: avatarUrl,
      avatarS3Key: user.avatar_s3_key || null, // Giữ lại s3Key để có thể dùng sau
      bio: user.bio || '',
      roleName: req.user.roleName,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/my/profile
 * Cập nhật thông tin profile của user hiện tại
 */
export async function updateMyProfile(req, res, next) {
  try {
    const userId = req.user.localUserId;

    if (!userId) {
      const err = new Error('LOCAL_USER_NOT_FOUND');
      err.status = 401;
      throw err;
    }

    const { fullName, phone, bio, avatar } = req.body;

    const updated = await updateUserProfile(userId, {
      fullName,
      phone,
      bio,
      avatar,
    });

    // Tạo presigned URL cho avatar nếu có (bucket private)
    let avatarUrl = null;
    if (updated.avatar_s3_key) {
      try {
        avatarUrl = await generatePresignedDownloadUrl(updated.avatar_s3_key, 3600); // 1 giờ
      } catch (s3Error) {
        console.error('Error generating presigned URL for avatar:', s3Error);
        avatarUrl = null;
      }
    }

    return successResponse(res, {
      id: updated.id,
      email: updated.email,
      fullName: updated.full_name || '',
      phone: updated.phone || '',
      avatar: avatarUrl,
      avatarS3Key: updated.avatar_s3_key || null,
      bio: updated.bio || '',
    });
  } catch (err) {
    next(err);
  }
}
