// src/controllers/course.controller.js
import {
  getAdminCoursesService,
  getCourseByIdService,
  createCourseService,
  updateCourseService,
  deleteCourseService,
  createLectureService,
  updateLectureService,
  deleteLectureService,
  getPublishedCoursesService,
  getCourseDetailService,
  enrollCourseService,
  updateLectureProgressService,
  getMyCoursesService,
} from "../services/course.service.js";

// ===== Helpers: lấy userId & roleId từ req.user =====
// auth.middleware.js đang set: { sub, email, groups, roleName, roleId, localUserId, ... }
const getUserId = (user) =>
  user?.localUserId || user?.id || user?.userId || user?.user_id || null;

const getRoleId = (user) =>
  user?.roleId ?? user?.role_id ?? user?.role ?? null;

const isAdmin = (user) => getRoleId(user) === 4;
const isTeacher = (user) => getRoleId(user) === 3;
const isAdminOrTeacher = (user) => isAdmin(user) || isTeacher(user);

// ================== ADMIN / TEACHER ==================

// GET /api/admin/courses
export const getAdminCourses = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const courses = await getAdminCoursesService(userId, isAdmin(user));
    return res.status(200).json(courses);
  } catch (err) {
    console.error("getAdminCourses error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/admin/courses
export const createCourse = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const payload = req.body;

    if (!payload.slug || !payload.title) {
      return res
        .status(400)
        .json({ message: "slug và title là bắt buộc" });
    }

    const course = await createCourseService(userId, payload);
    return res.status(201).json({
      message: "Course created",
      course,
    });
  } catch (err) {
    console.error("createCourse error:", err);

    // lỗi unique slug
    if (
      err?.originalError?.info?.number === 2627 ||
      err?.originalError?.info?.number === 2601
    ) {
      return res
        .status(400)
        .json({ message: "Slug đã tồn tại, hãy chọn slug khác" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/courses/:courseId
export const updateCourse = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId } = req.params;
    const payload = req.body;

    const existing = await getCourseByIdService(courseId);
    if (!existing) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Teacher chỉ được sửa course mình tạo
    if (!isAdmin(user) && existing.creatorId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: chỉ creator hoặc Admin được sửa" });
    }

    // merge dữ liệu
    const merged = {
      slug: payload.slug ?? existing.slug,
      title: payload.title ?? existing.title,
      shortDescription:
        payload.shortDescription ?? existing.shortDescription,
      description: payload.description ?? existing.description,
      price:
        payload.price !== undefined ? payload.price : existing.price,
      currency: payload.currency ?? existing.currency,
      published:
        payload.published !== undefined
          ? payload.published
          : existing.published,
      publishedAt: existing.publishedAt,
    };

    // logic published_at
    if (payload.published === true && !existing.published) {
      merged.publishedAt = new Date();
    } else if (payload.published === false && existing.published) {
      merged.publishedAt = null;
    }

    const updated = await updateCourseService(courseId, merged);
    if (!updated) {
      return res.status(500).json({ message: "Update course failed" });
    }

    return res.status(200).json({
      message: "Course updated",
      course: updated,
    });
  } catch (err) {
    console.error("updateCourse error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/admin/courses/:courseId
export const deleteCourse = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId } = req.params;

    const existing = await getCourseByIdService(courseId);
    if (!existing) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isAdmin(user) && existing.creatorId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: chỉ creator hoặc Admin được xoá" });
    }

    const rowsDeleted = await deleteCourseService(courseId);
    if (rowsDeleted === 0) {
      return res.status(500).json({ message: "Delete course failed" });
    }

    return res.status(200).json({
      message: "Course deleted",
      courseId,
    });
  } catch (err) {
    console.error("deleteCourse error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/admin/courses/:courseId/lectures
export const createLecture = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId } = req.params;
    const payload = req.body;

    if (!payload.title) {
      return res
        .status(400)
        .json({ message: "title của lecture là bắt buộc" });
    }

    const existingCourse = await getCourseByIdService(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isAdmin(user) && existingCourse.creatorId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: chỉ creator hoặc Admin được thêm lecture" });
    }

    const lecture = await createLectureService(courseId, payload);
    return res.status(201).json({
      message: "Lecture created",
      lecture,
    });
  } catch (err) {
    console.error("createLecture error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/courses/:courseId/lectures/:lectureId
export const updateLecture = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId, lectureId } = req.params;
    const payload = req.body;

    const existingCourse = await getCourseByIdService(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isAdmin(user) && existingCourse.creatorId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: chỉ creator hoặc Admin được sửa lecture" });
    }

    const lecture = await updateLectureService(courseId, lectureId, payload);
    if (!lecture) {
      return res
        .status(404)
        .json({ message: "Lecture not found in this course" });
    }

    return res.status(200).json({
      message: "Lecture updated",
      lecture,
    });
  } catch (err) {
    console.error("updateLecture error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/admin/courses/:courseId/lectures/:lectureId
export const deleteLecture = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdminOrTeacher(user)) {
      return res.status(403).json({ message: "Forbidden: Admin/Teacher only" });
    }

    const userId = getUserId(user);
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const { courseId, lectureId } = req.params;

    const existingCourse = await getCourseByIdService(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isAdmin(user) && existingCourse.creatorId !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: chỉ creator hoặc Admin được xoá lecture" });
    }

    const rowsDeleted = await deleteLectureService(courseId, lectureId);
    if (rowsDeleted === 0) {
      return res
        .status(404)
        .json({ message: "Lecture not found in this course" });
    }

    return res.status(200).json({
      message: "Lecture deleted",
      lectureId,
    });
  } catch (err) {
    console.error("deleteLecture error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ================== PUBLIC / MEMBER ==================

// GET /api/courses
export const getPublishedCourses = async (req, res) => {
  try {
    const courses = await getPublishedCoursesService();
    return res.status(200).json(courses);
  } catch (err) {
    console.error("getPublishedCourses error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/courses/:courseId
export const getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await getCourseDetailService(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ message: "Course not found or not published" });
    }
    return res.status(200).json(course);
  } catch (err) {
    console.error("getCourseDetail error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/courses/:courseId/enroll
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = getUserId(req.user);

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const result = await enrollCourseService(userId, courseId);
    if (result.alreadyEnrolled) {
      return res.status(200).json({
        message: "Already enrolled",
        enrollment: result.enrollment,
      });
    }

    return res.status(201).json({
      message: "Enroll success",
      enrollment: result.enrollment,
    });
  } catch (err) {
    console.error("enrollCourse error:", err);

    if (err.code === "COURSE_NOT_FOUND") {
      return res
        .status(404)
        .json({ message: "Course not found or not published" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/courses/:courseId/lectures/:lectureId/progress
export const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = getUserId(req.user);
    const { watchedSeconds, completed } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const result = await updateLectureProgressService(
      userId,
      courseId,
      lectureId,
      watchedSeconds,
      completed
    );

    return res.status(200).json({
      message: "Progress updated",
      courseProgress: {
        userId: result.userId,
        courseId: result.courseId,
        progressPercent: result.progressPercent,
        status: result.status,
      },
    });
  } catch (err) {
    console.error("updateLectureProgress error:", err);

    if (err && err.message && err.message.includes("LECTURE_NOT_IN_COURSE")) {
      return res
        .status(400)
        .json({ message: "Lecture does not belong to this course" });
    }
    if (err && err.message && err.message.includes("USER_NOT_ENROLLED")) {
      return res
        .status(403)
        .json({ message: "User is not enrolled in this course" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/my/courses
export const getMyCourses = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const status = req.query.status || null;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Cannot determine user id from token" });
    }

    const myCourses = await getMyCoursesService(userId, status);
    return res.status(200).json(myCourses);
  } catch (err) {
    console.error("getMyCourses error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
