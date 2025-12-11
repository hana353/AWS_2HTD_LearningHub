// src/services/axios.js
import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use((config) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  } else if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = new AxiosHeaders(config.headers);
  }

  // Check cả access_token và token (vì login lưu là "token")
  const token = 
    localStorage.getItem("access_token") || 
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 'ERR';
    const message = error.response?.data?.message || error.message || "Request failed";

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

    return Promise.reject(new Error(`[${status}] ${message}`));
  }
);

export default apiClient;
export const api = apiClient;