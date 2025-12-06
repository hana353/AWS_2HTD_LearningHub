import apiClient from "./https";

/**
 * Tạo practice mới (flashcard quiz)
 * API: POST /api/practices
 * @param {Object} payload - Dữ liệu practice
 * @param {string} payload.title - Tiêu đề practice
 * @param {string} payload.description - Mô tả practice
 * @param {string} payload.category - Danh mục (ví dụ: "vocabulary")
 * @param {string} payload.topic - Chủ đề (ví dụ: "animals")
 * @param {string} payload.language - Ngôn ngữ (ví dụ: "en")
 * @param {boolean} payload.published - Trạng thái công khai
 * @param {Array} payload.cards - Mảng các thẻ flashcard
 * @returns {Promise<Object>} Practice vừa tạo
 */
export async function createPractice(payload) {
  try {
    const res = await apiClient.post("/api/practices", payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to create practice");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy danh sách practices của giáo viên
 * API: GET /api/practices/my?category=vocabulary&topic=animals
 * @param {Object} params - Query parameters
 * @param {string} params.category - Danh mục (optional)
 * @param {string} params.topic - Chủ đề (optional)
 * @returns {Promise<Array>} Danh sách practices
 */
export async function getMyPractices(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.category) {
      queryParams.append("category", params.category);
    }
    if (params.topic) {
      queryParams.append("topic", params.topic);
    }

    const queryString = queryParams.toString();
    const url = `/api/practices/my${queryString ? `?${queryString}` : ""}`;

    const res = await apiClient.get(url);
    const result = res.data;

    if (!result.success || !result.data) {
      throw new Error(result.message || "Failed to fetch practices");
    }

    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    throw error;
  }
}

/**
 * Cập nhật practice
 * API: PATCH /api/practices/:practiceSetId
 * @param {string} practiceSetId - ID của practice
 * @param {Object} payload - Dữ liệu cập nhật
 * @returns {Promise<Object>} Practice đã cập nhật
 */
export async function updatePractice(practiceSetId, payload) {
  if (!practiceSetId) {
    throw new Error("practiceSetId is required");
  }

  try {
    const res = await apiClient.patch(`/api/practices/${practiceSetId}`, payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to update practice");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Publish/Unpublish practice
 * API: PATCH /api/practices/:setPracticeId/publish
 * @param {string} setPracticeId - ID của practice
 * @param {boolean} published - true để publish, false để unpublish
 * @returns {Promise<Object>} Practice đã cập nhật
 */
export async function publishPractice(setPracticeId, published) {
  if (!setPracticeId) {
    throw new Error("setPracticeId is required");
  }

  try {
    const res = await apiClient.patch(`/api/practices/${setPracticeId}/publish`, {
      published: published
    });
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to publish practice");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Xóa practice
 * API: DELETE /api/practices/:setPracticeId
 * @param {string} setPracticeId - ID của practice
 * @returns {Promise<Object>} Kết quả xóa
 */
export async function deletePractice(setPracticeId) {
  if (!setPracticeId) {
    throw new Error("setPracticeId is required");
  }

  try {
    const res = await apiClient.delete(`/api/practices/${setPracticeId}`);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to delete practice");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Tạo card cho practice
 * API: POST /api/practices/:setPracticeId/cards
 * @param {string} setPracticeId - ID của practice
 * @param {Object} payload - Dữ liệu card
 * @returns {Promise<Object>} Card vừa tạo
 */
export async function createPracticeCard(setPracticeId, payload) {
  if (!setPracticeId) {
    throw new Error("setPracticeId is required");
  }

  try {
    const res = await apiClient.post(`/api/practices/${setPracticeId}/cards`, payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to create card");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy danh sách cards của practice
 * API: GET /api/practices/:setPracticeId/cards
 * @param {string} setPracticeId - ID của practice
 * @returns {Promise<Array>} Danh sách cards
 */
export async function getPracticeCards(setPracticeId) {
  if (!setPracticeId) {
    throw new Error("setPracticeId is required");
  }

  try {
    const res = await apiClient.get(`/api/practices/${setPracticeId}/cards`);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to fetch cards");
    }

    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy chi tiết một card
 * API: GET /api/practices/:setPracticeId/cards/:cardId
 * @param {string} setPracticeId - ID của practice
 * @param {string} cardId - ID của card
 * @returns {Promise<Object>} Chi tiết card
 */
export async function getPracticeCard(setPracticeId, cardId) {
  if (!setPracticeId || !cardId) {
    throw new Error("setPracticeId and cardId are required");
  }

  try {
    const res = await apiClient.get(`/api/practices/${setPracticeId}/cards/${cardId}`);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to fetch card");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Cập nhật card
 * API: PATCH /api/practices/:setPracticeId/cards/:cardId
 * @param {string} setPracticeId - ID của practice
 * @param {string} cardId - ID của card
 * @param {Object} payload - Dữ liệu cập nhật
 * @returns {Promise<Object>} Card đã cập nhật
 */
export async function updatePracticeCard(setPracticeId, cardId, payload) {
  if (!setPracticeId || !cardId) {
    throw new Error("setPracticeId and cardId are required");
  }

  try {
    const res = await apiClient.patch(`/api/practices/${setPracticeId}/cards/${cardId}`, payload);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to update card");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

/**
 * Xóa card
 * API: DELETE /api/practices/:setPracticeId/cards/:cardId
 * @param {string} setPracticeId - ID của practice
 * @param {string} cardId - ID của card
 * @returns {Promise<Object>} Kết quả xóa
 */
export async function deletePracticeCard(setPracticeId, cardId) {
  if (!setPracticeId || !cardId) {
    throw new Error("setPracticeId and cardId are required");
  }

  try {
    const res = await apiClient.delete(`/api/practices/${setPracticeId}/cards/${cardId}`);
    const result = res.data;

    if (result && result.success === false) {
      throw new Error(result.message || "Failed to delete card");
    }

    return result.data ?? result;
  } catch (error) {
    throw error;
  }
}

