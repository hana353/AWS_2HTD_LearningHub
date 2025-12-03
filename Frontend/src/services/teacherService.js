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
