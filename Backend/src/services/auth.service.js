// src/services/auth.service.js
// Thuần local: dùng SQL Server + JWT + gửi mail SMTP thường, KHÔNG dùng service
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import {
  findUserByEmail,
  createUserWithProfile,
  findUserByIdWithProfile,
  updateEmailVerified,
  updateUserPasswordHash,
} from "../models/user.model.js";
import { signUserToken, signResetToken, verifyResetToken } from "../config/localAuth.js";
import { sendMail } from "../utils/mail.js";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Role mapping constants
const ROLE_MAPPING = {
  1: "Guest",
  2: "Member",
  3: "Teacher",
  4: "Admin",
};

// NEW: map từ string role FE gửi -> role_id trong DB
const ROLE_KEY_TO_ID = {
  member: 2,
  teacher: 3,
};

// Admin email - tự động gán role Admin khi đăng ký
const ADMIN_EMAIL = "phamminhtuan171204@gmail.com";
const ADMIN_ROLE_ID = 4;

// Đăng ký (local, không dùng Cognito)
export async function register({ email, password, fullName, phone, role }) {
  const existing = await findUserByEmail(email);

  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }

  // 👉 Xử lý role: Check email đặc biệt để gán Admin
  let desiredRoleId;

  // Nếu email là admin email → cố định role Admin
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    desiredRoleId = ADMIN_ROLE_ID;
    console.log(
      `[Register] Admin email detected: ${email}. Assigning Admin role.`
    );
  } else {
    // Xử lý role FE gửi lên (member hoặc teacher)
    const normalizedRoleKey = (role || "").toLowerCase(); // "member" | "teacher"
    desiredRoleId = ROLE_KEY_TO_ID[normalizedRoleKey] ?? 2; // default Member nếu gửi bậy
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await createUserWithProfile({
    email,
    passwordHash,
    phone,
    fullName,
    cognitoSub: null,
    roleId: desiredRoleId,
  });

  const token = signUserToken({
    id: newUser.id,
    email: newUser.email,
    role_id: newUser.role_id,
  });

  // Gửi mail chào mừng (SMTP thường, không block)
  sendMail(
    email,
    "Chào mừng bạn đã đăng ký - 2HTD LearningHub",
    `<p>Xin chào ${fullName || email},</p><p>Bạn đã đăng ký tài khoản thành công. Có thể đăng nhập ngay để sử dụng.</p><p>Trân trọng,<br/>2HTD LearningHub</p>`
  ).catch((err) => console.warn("[register] Welcome email failed:", err.message));

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      role_id: newUser.role_id,
      role_name: ROLE_MAPPING[newUser.role_id] || "Guest",
      is_active: newUser.is_active,
    },
    cognitoTokens: {
      idToken: token,
      accessToken: token,
      refreshToken: null,
      expiresIn: null,
      tokenType: "Bearer",
    },
  };
}

// Đăng nhập (local, không dùng Cognito)
export async function login({ email, password }) {
  const user = await findUserByEmail(email);

  if (!user || !user.password_hash) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  if (!user.is_active) {
    const err = new Error("Account is inactive");
    err.statusCode = 403;
    throw err;
  }

  const token = signUserToken({
    id: user.id,
    email: user.email,
    role_id: user.role_id,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role_name: ROLE_MAPPING[user.role_id] || "Guest",
      is_active: user.is_active,
      email_verified: user.email_verified,
    },
    cognitoTokens: {
      idToken: token,
      accessToken: token,
      refreshToken: null,
      expiresIn: null,
      tokenType: "Bearer",
    },
  };
}

// Xác thực email (local): đơn giản set email_verified = true nếu user tồn tại
export async function confirmEmail({ email, code }) {
  const user = await findUserByEmail(email);
  if (user && !user.email_verified) {
    await updateEmailVerified(user.id, true);
  }

  return true;
}

//Gửi lại mã xác thực email (local): không làm gì, luôn trả về true
export async function resendConfirmCode({ email }) {
  return true;
}

// Lấy info user từ DB (sau khi đã auth bằng Cognito JWT ở middleware)
export async function getCurrentUser(userId) {
  const user = await findUserByIdWithProfile(userId);

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user.id,
    email: user.email,
    role_id: user.role_id,
    role_name: ROLE_MAPPING[user.role_id] || "Guest",
    is_active: user.is_active,
    full_name: user.full_name,
    avatar_s3_key: user.avatar_s3_key,
    bio: user.bio,
  };
}

// Gửi mail đặt lại mật khẩu (SMTP thường): link chứa token, hết hạn 1h
export async function forgotPassword({ email }) {
  const user = await findUserByEmail(email);
  if (!user) {
    const e = new Error("User not found");
    e.statusCode = 404;
    throw e;
  }
  const resetToken = signResetToken(email);
  const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
  await sendMail(
    email,
    "Đặt lại mật khẩu - 2HTD LearningHub",
    `<p>Bạn đã yêu cầu đặt lại mật khẩu.</p><p>Nhấn vào link sau (hiệu lực 1 giờ):</p><p><a href="${resetLink}">${resetLink}</a></p><p>Nếu không phải bạn, hãy bỏ qua email này.</p><p>Trân trọng,<br/>2HTD LearningHub</p>`
  );
  return true;
}

// Đặt lại mật khẩu: dùng token từ email (ưu tiên) hoặc email + newPassword
export async function resetPassword({ email, code, newPassword, token }) {
  let targetEmail = email;
  if (token) {
    try {
      targetEmail = verifyResetToken(token);
    } catch (err) {
      const e = new Error("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
      e.statusCode = 400;
      throw e;
    }
  }
  if (!targetEmail || !newPassword) {
    const e = new Error("Thiếu email hoặc mật khẩu mới");
    e.statusCode = 400;
    throw e;
  }
  const user = await findUserByEmail(targetEmail);
  if (!user) {
    const e = new Error("User not found");
    e.statusCode = 404;
    throw e;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updateUserPasswordHash(user.id, passwordHash);
  return true;
}

// Logout (local): không cần gọi Cognito, chỉ trả về success
export async function logout({ accessToken }) {
  return { success: true, message: "Logged out successfully" };
}
