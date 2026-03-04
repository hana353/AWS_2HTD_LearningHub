// src/middlewares/auth.middleware.js
// Thuần local: xác thực JWT được ký bằng secret, không dùng Cognito

import dotenv from "dotenv";
import { findUserByEmail } from "../models/user.model.js";
import { verifyUserToken } from "../config/localAuth.js";

dotenv.config();

const ROLE_ID_TO_NAME = {
  1: "Guest",
  2: "Member",
  3: "Teacher",
  4: "Admin",
};

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    const token = authHeader.split(" ")[1];

    let payload;
    try {
      payload = verifyUserToken(token);
    } catch (e) {
      const err = new Error("Invalid token");
      err.statusCode = 401;
      throw err;
    }

    const user = await findUserByEmail(payload.email);
    if (!user) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    req.user = {
      sub: user.id,
      email: user.email,
      groups: [],
      roleName: ROLE_ID_TO_NAME[user.role_id] || "Guest",
      roleId: user.role_id,
      localUserId: user.id,
      tokenPayload: payload,
    };

    return next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    err.statusCode = err.statusCode || 401;
    return next(err);
  }
}
