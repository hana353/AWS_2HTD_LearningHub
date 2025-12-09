import apiClient from "./https";

/**
 * Lấy danh sách đề thi/bài kiểm tra
 * @returns {Promise<Object>} Danh sách đề thi với pagination
 */
export async function getExams() {
  try {
    const res = await apiClient.get("/api/tests/exams");
    const result = res.data;

    if (!result.success || !result.data) {
      throw new Error(result.message || "Failed to fetch exams");
    }

    return result.data;
  } catch (error) {
    // Bắt buộc re-throw để component phía trên xử lý tiếp
    throw error;
  }
}

/**
 * Tạo đề thi mới
 * API: POST /api/tests/exams
 * @param {Object} payload - { courseId, title, description, durationMinutes, passingScore, randomizeQuestions }
 * @returns {Promise<Object>} Dữ liệu đề thi vừa tạo
 */
export async function createExam(payload) {
  try {
    const res = await apiClient.post("/api/tests/exams", payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to create exam");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Cập nhật đề thi
 * API: PUT /api/tests/exams/:examId
 * @param {string} examId - ID của đề thi
 * @param {Object} payload - { courseId, title, description, durationMinutes, passingScore, randomizeQuestions }
 * @returns {Promise<Object>} Dữ liệu đề thi đã cập nhật
 */
export async function updateExam(examId, payload) {
  if (!examId) {
    throw new Error("examId is required");
  }

  try {
    const res = await apiClient.put(`/api/tests/exams/${examId}`, payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to update exam");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Xóa đề thi
 * API: DELETE /api/tests/exams/:examId
 * @param {string} examId - ID của đề thi
 * @returns {Promise<Object>} Kết quả xóa
 */
export async function deleteExam(examId) {
  if (!examId) {
    throw new Error("examId is required");
  }

  try {
    const res = await apiClient.delete(`/api/tests/exams/${examId}`);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to delete exam");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Publish/Unpublish đề thi
 * API: PATCH /api/tests/exams/:examId/publish
 * @param {string} examId - ID của đề thi
 * @param {boolean} published - true để publish, false để unpublish
 * @returns {Promise<Object>} Dữ liệu đề thi đã cập nhật
 */
export async function publishExam(examId, published) {
  if (!examId) {
    throw new Error("examId is required");
  }

  try {
    const res = await apiClient.patch(`/api/tests/exams/${examId}/publish`, {
      published: published
    });
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to publish exam");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Tạo câu hỏi cho đề thi
 * API: POST /api/tests/questions
 * @param {Object} payload
 * @returns {Promise<Object>} Dữ liệu câu hỏi vừa tạo
 */
export async function createQuestion(payload) {
  try {
    const res = await apiClient.post("/api/tests/questions", payload);
    const result = res.data;

    // Tuỳ theo cấu trúc response của backend có thể điều chỉnh lại phần này
    if (result && result.success === false) {
      throw new Error(result.message || "Failed to create question");
    }

    return result.data ?? result;
  } catch (error) {
    // Yêu cầu: catch chỉ dùng để throw error ra ngoài
    throw error;
  }
}

/**
 * Lấy danh sách câu hỏi của một đề thi
 * API: GET /api/tests/exams/:examId/questions
 * @param {string} examId - ID của đề thi
 * @returns {Promise<Array>} Danh sách câu hỏi
 */
export async function getExamQuestions(examId) {
  if (!examId) {
    throw new Error("examId is required");
  }

  try {
    const res = await apiClient.get(`/api/tests/exams/${examId}/questions`);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to fetch exam questions");
    }

    // Đảm bảo luôn trả về một mảng
    const data = result.data ?? result ?? [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy chi tiết một câu hỏi trong đề thi
 * API: GET /api/tests/exams/:examId/questions/:questionId
 * @param {string} examId - ID của đề thi
 * @param {string} questionId - ID của câu hỏi
 * @returns {Promise<Object>} Chi tiết câu hỏi
 */
export async function getExamQuestion(examId, questionId) {
  if (!examId || !questionId) {
    throw new Error("examId and questionId are required");
  }

  try {
    const res = await apiClient.get(`/api/tests/exams/${examId}/questions/${questionId}`);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to fetch exam question");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Tạo câu hỏi cho một đề thi cụ thể
 * API: POST /api/tests/exams/:examId/questions
 * @param {string} examId - ID của đề thi
 * @param {Object} payload - Dữ liệu câu hỏi
 * @returns {Promise<Object>} Dữ liệu câu hỏi vừa tạo
 */
export async function createExamQuestion(examId, payload) {
  if (!examId) {
    throw new Error("examId is required");
  }

  try {
    const res = await apiClient.post(`/api/tests/exams/${examId}/questions`, payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to create exam question");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Cập nhật câu hỏi trong đề thi
 * API: PUT /api/tests/exams/:examId/questions/:questionId
 * @param {string} examId - ID của đề thi
 * @param {string} questionId - ID của câu hỏi
 * @param {Object} payload - Dữ liệu câu hỏi cập nhật
 * @returns {Promise<Object>} Dữ liệu câu hỏi đã cập nhật
 */
export async function updateExamQuestion(examId, questionId, payload) {
  if (!examId || !questionId) {
    throw new Error("examId and questionId are required");
  }

  try {
    const res = await apiClient.put(`/api/tests/exams/${examId}/questions/${questionId}`, payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to update exam question");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Xóa câu hỏi khỏi đề thi
 * API: DELETE /api/tests/exams/:examId/questions/:questionId
 * @param {string} examId - ID của đề thi
 * @param {string} questionId - ID của câu hỏi
 * @returns {Promise<Object>} Kết quả xóa
 */
export async function deleteExamQuestion(examId, questionId) {
  if (!examId || !questionId) {
    throw new Error("examId and questionId are required");
  }

  try {
    const res = await apiClient.delete(`/api/tests/exams/${examId}/questions/${questionId}`);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to delete exam question");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy danh sách khóa học của giảng viên
 * API: GET /api/teacher/courses
 * Backend đang trả về mảng các khóa học (không bọc trong success/data)
 * @returns {Promise<Array>} Danh sách khóa học
 */
export async function getTeacherCourses() {
  try {
    const res = await apiClient.get("/api/teacher/courses");
    // Theo Postman: response là một mảng các course
    return res.data;
  } catch (error) {
    // Re-throw để component xử lý hiển thị lỗi
    throw error;
  }
}

/**
 * Lấy danh sách bài giảng (lectures) của một khóa học
 * API: GET /api/admin/courses/:courseId/lectures
 * @param {string} courseId
 * @returns {Promise<Array>} Danh sách bài giảng
 */
export async function getCourseLectures(courseId) {
  if (!courseId) {
    throw new Error("courseId is required");
  }

  try {
    const res = await apiClient.get(`/api/admin/courses/${courseId}/lectures`);
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Tạo bài giảng mới cho một khóa học
 * API: POST /api/admin/courses/:courseId/lectures
 * @param {string} courseId
 * @param {Object} payload
 * @returns {Promise<Object>} Bài giảng vừa tạo
 */
export async function createCourseLecture(courseId, payload) {
  if (!courseId) {
    throw new Error("courseId is required");
  }

  try {
    const res = await apiClient.post(
      `/api/admin/courses/${courseId}/lectures`,
      payload
    );
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Cập nhật bài giảng
 * API: PUT /api/admin/courses/:courseId/lectures/:lectureId
 * @param {string} courseId
 * @param {string} lectureId
 * @param {Object} payload
 * @returns {Promise<Object>} Bài giảng đã cập nhật
 */
export async function updateCourseLecture(courseId, lectureId, payload) {
  if (!courseId || !lectureId) {
    throw new Error("courseId and lectureId are required");
  }

  try {
    const res = await apiClient.patch(
      `/api/admin/courses/${courseId}/lectures/${lectureId}`,
      payload
    );
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Xóa bài giảng
 * API: DELETE /api/admin/courses/:courseId/lectures/:lectureId
 * @param {string} courseId
 * @param {string} lectureId
 * @returns {Promise<Object>} Kết quả xóa
 */
export async function deleteCourseLecture(courseId, lectureId) {
  if (!courseId || !lectureId) {
    throw new Error("courseId and lectureId are required");
  }

  try {
    const res = await apiClient.delete(
      `/api/admin/courses/${courseId}/lectures/${lectureId}`
    );
    return res.data;
  } catch (error) {
    throw error;
  }
}
