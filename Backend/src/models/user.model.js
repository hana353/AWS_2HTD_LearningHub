// src/models/user.model.js

import { sql, pool, poolConnect } from '../config/db.js';
import dotenv from 'dotenv';

// Không cần bcrypt ở file này nữa
// import bcrypt from 'bcrypt';

// Load biến môi trường
dotenv.config();

// Chỉ dùng email admin
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// role_id trong bảng roles
const ADMIN_ROLE_ID = 4;
const MEMBER_ROLE_ID = 2;

// ====================
// Tìm user theo email
// ====================
export async function findUserByEmail(email) {
  await poolConnect;
  const request = pool.request();
  request.input('email', sql.NVarChar(255), email);

  const result = await request.query(`
    SELECT TOP 1 id, email, password_hash, role_id, is_active, cognito_sub
    FROM users
    WHERE email = @email
  `);

  return result.recordset[0] || null;
}

// =========================================
// Tìm user theo cognito_sub (dùng cho token)
// =========================================
export async function findUserByCognitoSub(cognitoSub) {
  await poolConnect;
  const request = pool.request();
  request.input('cognito_sub', sql.NVarChar(255), cognitoSub);

  const result = await request.query(`
    SELECT TOP 1 id, email, password_hash, role_id, is_active, cognito_sub
    FROM users
    WHERE cognito_sub = @cognito_sub
  `);

  return result.recordset[0] || null;
}

// ====================================
// Tạo user + profile, gắn với cognito_sub
// ====================================
export async function createUserWithProfile({
  email,
  passwordHash,
  phone,
  fullName,
  cognitoSub,
  roleId
}) {
  await poolConnect;

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const userReq = new sql.Request(transaction);
    userReq.input('email', sql.NVarChar(255), email);
    userReq.input('password_hash', sql.NVarChar(sql.MAX), passwordHash || null);
    userReq.input('phone', sql.NVarChar(50), phone || null);

    // chỉ cho phép 2 (Member) hoặc 3 (Teacher), còn lại fallback về Member
    const safeRoleId =
      roleId && [2, 3].includes(Number(roleId)) ? Number(roleId) : MEMBER_ROLE_ID;

    userReq.input('role_id', sql.SmallInt, safeRoleId);
    userReq.input('cognito_sub', sql.NVarChar(255), cognitoSub || null);

    const userResult = await userReq.query(`
      INSERT INTO users (email, password_hash, phone, role_id, cognito_sub)
      OUTPUT inserted.id, inserted.email, inserted.role_id, inserted.is_active
      VALUES (
        @email,
        @password_hash,
        @phone,
        @role_id,
        CASE 
          WHEN @cognito_sub IS NULL THEN CAST(NEWID() AS NVARCHAR(255))
          ELSE @cognito_sub
        END
      );
    `);

    const newUser = userResult.recordset[0];

    const profileReq = new sql.Request(transaction);
    profileReq.input('user_id', sql.UniqueIdentifier, newUser.id);
    profileReq.input('full_name', sql.NVarChar(255), fullName || null);

    await profileReq.query(`
      INSERT INTO user_profiles (user_id, full_name)
      VALUES (@user_id, @full_name);
    `);

    await transaction.commit();
    return newUser;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ======================================
// Lấy user + profile theo id
// ======================================
export async function findUserByIdWithProfile(userId) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, userId);

  const result = await request.query(`
    SELECT 
      u.id,
      u.email,
      u.role_id,
      u.is_active,
      up.full_name,
      up.avatar_s3_key,
      up.bio
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.id = @id
  `);

  return result.recordset[0] || null;
}

// ======================================
// Cập nhật trạng thái email_verified
// ======================================
export async function updateEmailVerified(userId, isVerified) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, userId);
  request.input('email_verified', sql.Bit, isVerified ? 1 : 0);

  const result = await request.query(`
    UPDATE users
    SET 
      email_verified = @email_verified,
      updated_at = SYSDATETIMEOFFSET()
    OUTPUT 
      inserted.id,
      inserted.email,
      inserted.role_id,
      inserted.is_active,
      inserted.email_verified
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
}

// ======================================
// Cập nhật password_hash cho user
// ======================================
export async function updateUserPasswordHash(userId, passwordHash) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, userId);
  request.input('password_hash', sql.NVarChar(sql.MAX), passwordHash);

  const result = await request.query(`
    UPDATE users
    SET 
      password_hash = @password_hash,
      updated_at = SYSDATETIMEOFFSET()
    OUTPUT 
      inserted.id,
      inserted.email,
      inserted.role_id,
      inserted.is_active,
      inserted.email_verified
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
}

// ====================================================
// Đảm bảo trong DB chỉ có duy nhất 1 tài khoản Admin
// KHÔNG tự tạo admin mới, chỉ set role cho email trong .env
// ====================================================
export async function ensureSingleAdmin() {
  if (!ADMIN_EMAIL) {
    console.warn(
      '[ensureSingleAdmin] ADMIN_EMAIL chưa được cấu hình trong .env, bỏ qua bước đảm bảo admin.'
    );
    return;
  }

  await poolConnect;

  // 1. Hạ quyền mọi user đang là Admin nhưng không phải email admin chính
  const demoteReq = pool.request();
  demoteReq.input('adminEmail', sql.NVarChar(255), ADMIN_EMAIL);
  demoteReq.input('adminRoleId', sql.SmallInt, ADMIN_ROLE_ID);
  demoteReq.input('memberRoleId', sql.SmallInt, MEMBER_ROLE_ID);

  await demoteReq.query(`
    UPDATE users
    SET role_id = @memberRoleId
    WHERE role_id = @adminRoleId
      AND email <> @adminEmail;
  `);

  // 2. Tìm user có email = ADMIN_EMAIL
  const checkReq = pool.request();
  checkReq.input('adminEmail', sql.NVarChar(255), ADMIN_EMAIL);

  const checkResult = await checkReq.query(`
    SELECT TOP 1 id, role_id
    FROM users
    WHERE email = @adminEmail;
  `);

  if (checkResult.recordset.length === 0) {
    console.warn(
      `[ensureSingleAdmin] Không tìm thấy user với email ${ADMIN_EMAIL} trong DB. Hãy đăng ký tài khoản này qua API /auth/register trước.`
    );
    return;
  }

  const admin = checkResult.recordset[0];

  // 3. Nếu user tồn tại nhưng chưa mang role Admin thì cập nhật lại role_id = 4
  if (admin.role_id !== ADMIN_ROLE_ID) {
    const updateReq = pool.request();
    updateReq.input('id', sql.UniqueIdentifier, admin.id);
    updateReq.input('adminRoleId', sql.SmallInt, ADMIN_ROLE_ID);

    await updateReq.query(`
      UPDATE users
      SET 
        role_id = @adminRoleId,
        updated_at = SYSDATETIMEOFFSET()
      WHERE id = @id;
    `);
  }

  console.log('✅ Đã đảm bảo tài khoản Admin tồn tại & có role Admin:', ADMIN_EMAIL);
}

// ====================================================
// Lấy danh sách user + profile + role, có phân trang + search
// ====================================================
export async function getUsersWithProfilePaginated(
  page = 1,
  pageSize = 10,
  search = null
) {
  await poolConnect;

  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safePageSize = Number(pageSize) > 0 ? Number(pageSize) : 10;
  const offset = (safePage - 1) * safePageSize;

  const listReq = pool.request();
  listReq.input('offset', sql.Int, offset);
  listReq.input('limit', sql.Int, safePageSize);
  listReq.input('search', sql.NVarChar(255), search ? `%${search}%` : null);

  const usersResult = await listReq.query(`
    SELECT
      u.id,
      u.email,
      u.phone,
      u.role_id,
      u.is_active,
      u.email_verified,
      u.created_at,
      up.full_name,
      r.name AS role_name
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE 
      u.is_active = 1
      AND (
        @search IS NULL
        OR u.email LIKE @search
        OR up.full_name LIKE @search
      )
    ORDER BY u.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `);

  const countReq = pool.request();
  countReq.input('search', sql.NVarChar(255), search ? `%${search}%` : null);
  const countResult = await countReq.query(`
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE 
      u.is_active = 1
      AND (
        @search IS NULL
        OR u.email LIKE @search
        OR up.full_name LIKE @search
      );
  `);

  const total = countResult.recordset[0]?.total || 0;

  return {
    users: usersResult.recordset,
    total,
    page: safePage,
    pageSize: safePageSize
  };
}

// ======================================
// Cập nhật role cho user theo id
// ======================================
export async function updateUserRoleById(userId, roleId) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, userId);
  request.input('role_id', sql.SmallInt, roleId);

  const result = await request.query(`
    UPDATE users
    SET 
      role_id = @role_id,
      updated_at = SYSDATETIMEOFFSET()
    OUTPUT inserted.id, inserted.email, inserted.role_id, inserted.is_active
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
}

// ======================================
// Xoá mềm user: set is_active = 0
// ======================================
export async function softDeleteUserById(userId) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, userId);

  const result = await request.query(`
    UPDATE users
    SET 
      is_active = 0,
      updated_at = SYSDATETIMEOFFSET()
    OUTPUT inserted.id
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
}

// =====================================================
// Cập nhật profile + phone + role cho user (Admin dùng)
// =====================================================
export async function updateUserProfileAndRoleByAdmin(
  userId,
  { fullName, phone, roleId }
) {
  await poolConnect;

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Update bảng users: phone + role_id (nếu có)
    const userReq = new sql.Request(transaction);
    userReq.input('id', sql.UniqueIdentifier, userId);
    userReq.input('phone', sql.NVarChar(50), phone ?? null);
    userReq.input('role_id', sql.SmallInt, roleId ?? null);

    await userReq.query(`
      UPDATE users
      SET
        phone = COALESCE(@phone, phone),
        role_id = CASE WHEN @role_id IS NULL THEN role_id ELSE @role_id END,
        updated_at = SYSDATETIMEOFFSET()
      WHERE id = @id;
    `);

    // Update bảng user_profiles: full_name
    const profileReq = new sql.Request(transaction);
    profileReq.input('user_id', sql.UniqueIdentifier, userId);
    profileReq.input('full_name', sql.NVarChar(255), fullName ?? null);

    await profileReq.query(`
      UPDATE user_profiles
      SET full_name = COALESCE(@full_name, full_name)
      WHERE user_id = @user_id;
    `);

    await transaction.commit();

    // Lấy lại user sau update
    const updated = await findUserByIdWithProfile(userId);
    return updated;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ======================================
// Khôi phục user đã xóa mềm: set is_active = 1
// ======================================
export async function restoreUserById(userId) {
  await poolConnect;
  const request = pool.request();
  request.input('id', sql.UniqueIdentifier, userId);

  const result = await request.query(`
    UPDATE users
    SET 
      is_active = 1,
      updated_at = SYSDATETIMEOFFSET()
    OUTPUT inserted.id
    WHERE id = @id;
  `);

  return result.recordset[0] || null;
}

// =====================================================
// Lấy danh sách user đã xóa mềm (is_active = 0)
// =====================================================
export async function getSoftDeletedUsersWithProfilePaginated(
  page = 1,
  pageSize = 10,
  search = null
) {
  await poolConnect;

  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safePageSize = Number(pageSize) > 0 ? Number(pageSize) : 10;
  const offset = (safePage - 1) * safePageSize;

  const listReq = pool.request();
  listReq.input('offset', sql.Int, offset);
  listReq.input('limit', sql.Int, safePageSize);
  listReq.input('search', sql.NVarChar(255), search ? `%${search}%` : null);

  const usersResult = await listReq.query(`
    SELECT
      u.id,
      u.email,
      u.phone,
      u.role_id,
      u.is_active,
      u.email_verified,
      u.created_at,
      up.full_name,
      r.name AS role_name
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE 
      u.is_active = 0
      AND (
        @search IS NULL
        OR u.email LIKE @search
        OR up.full_name LIKE @search
      )
    ORDER BY u.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `);

  const countReq = pool.request();
  countReq.input('search', sql.NVarChar(255), search ? `%${search}%` : null);
  const countResult = await countReq.query(`
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE 
      u.is_active = 0
      AND (
        @search IS NULL
        OR u.email LIKE @search
        OR up.full_name LIKE @search
      );
  `);

  const total = countResult.recordset[0]?.total || 0;

  return {
    users: usersResult.recordset,
    total,
    page: safePage,
    pageSize: safePageSize
  };
}
