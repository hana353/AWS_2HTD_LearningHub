// src/controllers/auth.controller.js
// Nhận request từ router, validate, gọi service và trả response

import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { successResponse, errorResponse } from "../utils/response.js";
import * as authService from "../services/auth.service.js";

// Đăng ký tài khoản
export async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const result = await authService.register(value);
    return successResponse(res, result, "User registered successfully", 201);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Đăng nhập
export async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return errorResponse(res, "Validation error", 400, details);
    }

    const result = await authService.login(value);
    return successResponse(res, result, "Login successful", 200);
  } catch (err) {
    // Bắt các lỗi đã được map trong service (ví dụ: EMAIL_NOT_VERIFIED, INVALID_CREDENTIALS, ...)
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Xác thực email (bản local, KHÔNG dùng mã code):
export async function confirmEmail(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, "email là bắt buộc", 400, [
        "email is required",
      ]);
    }

    // Bỏ xác thực bằng code, chỉ cần email là set email_verified = true
    await authService.confirmEmail({ email });
    return successResponse(res, null, "Email verified successfully", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Gửi lại mã xác thực email
export async function resendConfirmCode(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, "email là bắt buộc", 400, [
        "email is required",
      ]);
    }

    await authService.resendConfirmCode({ email });
    return successResponse(
      res,
      null,
      "Verification code resent successfully",
      200
    );
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Lấy thông tin user hiện tại
export async function me(req, res, next) {
  try {
    const userId = req.user.localUserId;
    const user = await authService.getCurrentUser(userId);
    return successResponse(res, user, "User profile", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Route debug:
export async function debugToken(req, res, next) {
  try {
    return successResponse(res, req.user, "Cognito token info", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Gửi mã quên mật khẩu
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, "email là bắt buộc", 400, [
        "email is required",
      ]);
    }

    await authService.forgotPassword({ email });
    return successResponse(
      res,
      null,
      "Forgot password code sent successfully",
      200
    );
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Đặt lại mật khẩu: nhận token (từ link email) + newPassword, hoặc email + newPassword
export async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword, token } = req.body;

    if (!newPassword) {
      return errorResponse(res, "newPassword is required", 400);
    }
    if (!token && !email) {
      return errorResponse(res, "token hoặc email là bắt buộc", 400);
    }

    await authService.resetPassword({ email, code, newPassword, token });
    return successResponse(res, null, "Password reset successfully", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}

// Logout
export async function logout(req, res, next) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return errorResponse(res, "Access token is required", 400);
    }

    const result = await authService.logout({ accessToken });
    return successResponse(res, result, "Logged out successfully", 200);
  } catch (err) {
    if (err.statusCode) {
      return errorResponse(
        res,
        err.message,
        err.statusCode,
        err.errors || null
      );
    }
    return next(err);
  }
}
