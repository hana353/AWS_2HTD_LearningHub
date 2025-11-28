// src/routes/auth.routes.js

import express from "express";
import {
  register,
  login,
  logout,
  me,
  debugToken,
  confirmEmail,
  resendConfirmCode,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,  
      stripUnknown: true,  
    });

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    req.body = value;
    next();
  };
}

router.post("/register", validateBody(registerSchema), register);

router.post("/login", validateBody(loginSchema), login);

router.post("/logout", logout);

router.post("/confirm-email", confirmEmail);

router.post("/resend-confirm-code", resendConfirmCode);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, me);

router.get("/debug-token", authMiddleware, debugToken);

export default router;
