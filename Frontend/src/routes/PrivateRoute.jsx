import { Navigate } from "react-router-dom";
import React from "react";
/**
 * @typedef {Object} PrivateRouteProps
 * @property {React.ReactNode} children 
 * @property {Array<'member' | 'teacher' | 'admin'>} [allowedRoles] 
 */

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const role = localStorage.getItem("role"); // Lưu là "role" không phải "roleName"
  const roleId = localStorage.getItem("roleId");

  // Chưa login hoặc token không có
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }
  
  // Kiểm tra nếu có allowedRoles và role không hợp lệ
  if (allowedRoles && allowedRoles.length > 0) {
    // Normalize role name để so sánh (lowercase)
    const normalizedRole = role?.toLowerCase();
    const normalizedRoleId = roleId ? String(roleId) : null;
    
    // Check nếu role hoặc roleId có trong allowedRoles
    const isAllowed = allowedRoles.some(allowedRole => {
      const normalizedAllowed = allowedRole.toLowerCase();
      return normalizedRole === normalizedAllowed || 
             normalizedRoleId === normalizedAllowed ||
             (normalizedRole === 'admin' && normalizedAllowed === 'admin') ||
             (normalizedRole === 'teacher' && normalizedAllowed === 'teacher') ||
             (normalizedRole === 'member' && normalizedAllowed === 'member');
    });
    
    if (!isAllowed) {
      return <Navigate to="/auth/login" replace />;
    }
  }
  
  return children; // Cho phép truy cập nếu tất cả điều kiện đều đúng
};

export default PrivateRoute;