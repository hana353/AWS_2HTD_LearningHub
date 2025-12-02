// src/routes/course.routes.js
import { Router } from "express";
import {
  getAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  createLecture,
  updateLecture,
  deleteLecture,
  getPublishedCourses,
  getCourseDetail,
  enrollCourse,
  updateLectureProgress,
  getMyCourses,
} from "../controllers/course.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// =============== ADMIN / TEACHER ===============

// Danh sách course (Admin: all, Teacher: của mình)
router.get("/admin/courses", authMiddleware, getAdminCourses);

// Tạo course
router.post("/admin/courses", authMiddleware, createCourse);

// Sửa course
router.patch("/admin/courses/:courseId", authMiddleware, updateCourse);

// Xoá course
router.delete("/admin/courses/:courseId", authMiddleware, deleteCourse);

// Tạo lecture
router.post(
  "/admin/courses/:courseId/lectures",
  authMiddleware,
  createLecture
);

// Sửa lecture
router.patch(
  "/admin/courses/:courseId/lectures/:lectureId",
  authMiddleware,
  updateLecture
);

// Xoá lecture
router.delete(
  "/admin/courses/:courseId/lectures/:lectureId",
  authMiddleware,
  deleteLecture
);

// =============== PUBLIC / MEMBER ===============

// List course đã publish
router.get("/courses", getPublishedCourses);

// Chi tiết 1 course
router.get("/courses/:courseId", getCourseDetail);

// Member enroll course
router.post(
  "/courses/:courseId/enroll",
  authMiddleware,
  enrollCourse
);

// Member update progress lecture
router.post(
  "/courses/:courseId/lectures/:lectureId/progress",
  authMiddleware,
  updateLectureProgress
);

// My courses
router.get("/my/courses", authMiddleware, getMyCourses);

export default router;
