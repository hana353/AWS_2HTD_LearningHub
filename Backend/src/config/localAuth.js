// src/config/localAuth.js
// JWT auth đơn giản dùng cho môi trường local (không cần Cognito)

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "dev-local-secret";
const JWT_EXPIRES_IN = "7d";

export function signUserToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role_id: user.role_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyUserToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/** Token dùng cho link đặt lại mật khẩu (1h) */
export function signResetToken(email) {
  return jwt.sign(
    { email, purpose: "password_reset" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

export function verifyResetToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  if (payload.purpose !== "password_reset") throw new Error("Invalid token purpose");
  return payload.email;
}

