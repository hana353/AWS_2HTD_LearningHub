import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // bật nếu backend yêu cầu cookie
  timeout: 20000,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {};
  
  // Chỉ set Content-Type JSON nếu không phải FormData
  // FormData sẽ tự động set Content-Type với boundary
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  // Nếu là FormData, không set Content-Type để browser tự động set với boundary

  // Gắn Bearer token nếu có
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE INTERCEPTOR: chuẩn hoá lỗi
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const data = err.response?.data;
    const message =
      (typeof data === "string" && data) ||
      (data && (data.message || data.error)) ||
      err.message ||
      "Request failed";

    // Xử lý 401 Unauthorized - token hết hạn hoặc không hợp lệ
    if (status === 401) {
      // Xóa token và redirect về login
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      localStorage.removeItem("roleId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("access_token");
      
      // Chỉ redirect nếu đang ở client-side và không phải đang ở trang login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }

    // Create an Error but preserve the original axios response/data for callers
    const out = new Error(`[${status ?? "ERR"}] ${message}`);
    // attach axios response and parsed data so UI can inspect validation details
    out.response = err.response;
    out.data = data;
    out.originalError = err;
    return Promise.reject(out);
  }
);

export default api;
