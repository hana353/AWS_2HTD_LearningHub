import React, { useState, useEffect } from 'react';
import { 
    Users, BookOpen, GraduationCap, 
    ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// [FIX] Sửa lại tên hàm import đúng với adminService.js (getAdminCourses thay vì getCourses)
import { getAdminUsers, getAdminCourses } from "../../services/adminService";

// --- CSS STYLES & ANIMATIONS ---
const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes growUp {
    from { height: 0; opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .animate-grow {
    animation: growUp 1s ease-out forwards;
  }
  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }
  .hover-card-effect {
    transition: all 0.3s ease;
  }
  .hover-card-effect:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
`;


// --- COMPONENT CHÍNH ---
export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalTeachers: 0
    });
    const [loading, setLoading] = useState(true);


   useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true);

                // --- 1. Lấy Users ---
                const usersRes = await getAdminUsers(1, 1000);
                const usersList = usersRes.users || [];
                
                // Khai báo biến totalUsers
                const totalUsers = usersRes.pagination?.total || usersList.length || 0;

                // --- 2. Đếm số lượng Giảng Viên (FIX: dùng role_name) ---
                const teachersList = usersList.filter(u => {
                    // [QUAN TRỌNG] API trả về 'role_name', lấy cả 'role' để dự phòng
                    const roleVal = u.role_name || u.role || ""; 
                    
                    // Chuyển về chữ thường để so sánh (tránh lỗi viết hoa/thường)
                    const roleStr = roleVal.toString().toLowerCase().trim();
                    
                    // Kiểm tra: teacher, giangvien hoặc admin
                    return roleStr === 'teacher' || roleStr === 'giangvien' || roleStr === 'admin'; 
                });
                
                console.log("✅ Đã tìm thấy số giảng viên:", teachersList.length);

                // --- 3. Lấy Courses ---
                const coursesRes = await getAdminCourses();
                const coursesList = Array.isArray(coursesRes) ? coursesRes : (coursesRes.data || []);
                const totalCourses = coursesList.length;

                // --- 4. Cập nhật State ---
                setStats({
                    totalUsers: totalUsers,
                    totalCourses: totalCourses,
                    totalTeachers: teachersList.length
                });

            } catch (error) {
                console.error("❌ Dashboard Sync Error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    const statCards = [
        { 
            title: "Tổng Học Viên", 
            value: loading ? "..." : stats.totalUsers.toLocaleString(),
            change: "+12%", 
            trend: "up", 
            icon: Users, 
            color: "text-gray-700"
        },
        { 
            title: "Tổng Khóa Học", 
            value: loading ? "..." : stats.totalCourses.toLocaleString(),
            change: "+5%", 
            trend: "up", 
            icon: BookOpen, 
            color: "text-gray-700"
        },
        { 
            title: "Giảng Viên", 
            value: loading ? "..." : stats.totalTeachers.toLocaleString(),
            change: "+2", 
            trend: "up", 
            icon: GraduationCap, 
            color: "text-gray-700"
        }
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] p-8 font-sans">
            <style>{styles}</style>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Tổng Quan</h1>
                    <p className="text-gray-500 mt-1 font-medium">Chào mừng trở lại, Administrator!</p>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {statCards.map((item, index) => (
                    <div 
                        key={index} 
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover-card-effect animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-white border border-gray-100">
                                <item.icon className={item.color} size={24} />
                            </div>
                            {item.change && (
                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                                    item.trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                                }`}>
                                    {item.trend === 'up' ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                                    {item.change}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">{item.title}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

// Removed unused chevron helper — month control uses lucide chevrons now