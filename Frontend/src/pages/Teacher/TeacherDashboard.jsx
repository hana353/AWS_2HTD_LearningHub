import React, { useState, useMemo, useEffect } from 'react';
import { Users, Layers, FilePlus, PieChart, Calendar as CalendarIcon, ArrowUpRight } from 'lucide-react';
import { getTeacherCourses } from '../../services/teacherService';
import { getExams } from '../../services/teacherService';
import { getMyProfile } from '../../services/profileService';

/**
 * Teacher Dashboard - Professional UI
 * - Removed: "Create Class" feature
 * - Added: Smooth animations, polished UI, glassmorphism touches
 */

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  // --- CSS Animation Styles ---
  const styles = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0; 
    }
    .delay-100 { animation-delay: 0.1s; }
    .delay-200 { animation-delay: 0.2s; }
    .delay-300 { animation-delay: 0.3s; }
    .delay-400 { animation-delay: 0.4s; }
    
    .progress-bar {
      transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;

  // --- DATA FROM API ---
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [userName, setUserName] = useState("Giáo viên");

  // Load data từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy profile để hiển thị tên người dùng
        try {
          const profile = await getMyProfile();
          if (profile?.fullName) {
            setUserName(profile.fullName);
          }
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
          // Không set error nếu không lấy được profile, chỉ dùng default "Giáo viên"
        }
        
        // Load courses (classes)
        const coursesData = await getTeacherCourses();
        const mappedClasses = (Array.isArray(coursesData) ? coursesData : []).map((course) => ({
          id: course.courseId,
          name: course.title || course.name,
          students: course.students || 0,
          level: course.level || '',
          schedule: course.schedule || ''
        }));
        setClasses(mappedClasses);

        // Load exams
        const examsData = await getExams();
        const mappedExams = (Array.isArray(examsData) ? examsData : []).map((exam) => ({
          id: exam.id,
          title: exam.title,
          classId: exam.course_id || null,
          duration: exam.duration_minutes || 0,
          questions: exam.questions_count || 0,
          published: exam.published || false
        }));
        setExams(mappedExams);

        // Assignments - Load từ API nếu có
        setAssignments([]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- LOGIC ---
  const stats = useMemo(() => {
    const totalStudents = classes.reduce((s, c) => s + c.students, 0);
    const totalClasses = classes.length;
    const pendingTests = exams.filter(e => !e.published).length;
    
    // Tính % hoàn thành trung bình
    const totalSubmissions = assignments.reduce((s, a) => s + a.submissions, 0);
    const totalRequired = assignments.reduce((s, a) => s + a.total, 0);
    const avgCompletion = totalRequired > 0 ? Math.round((totalSubmissions / totalRequired) * 100) : 0;
    
    return { totalStudents, totalClasses, pendingTests, avgCompletion, totalSubmissions, totalRequired };
  }, [classes, assignments, exams]);

  // Xử lý sự kiện
  const publishExam = (id) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, published: true } : e));
  };

  const deleteExam = (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đề thi này?')) return;
    setExams(prev => prev.filter(e => e.id !== id));
  };

  // --- COMPONENTS ---
  
  const StatCard = ({ title, value, icon, colorClass, sub, delay }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:shadow-lg transition-all duration-300 animate-fade-in-up ${delay}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          {sub && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
          {React.cloneElement(icon, { className: `w-6 h-6 ${colorClass.replace('bg-', 'text-')}` })}
        </div>
      </div>
    </div>
  );

  const MiniBarChart = ({ data }) => {
    const max = Math.max(...data, 1);
    const [animated, setAnimated] = useState(false);
    useEffect(() => setAnimated(true), []);

    return (
      <div className="flex items-end justify-between h-24 gap-2 px-2">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer">
             <div className="text-[10px] text-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{v}</div>
             <div 
                className="w-full bg-indigo-50 rounded-t-md relative overflow-hidden transition-all duration-300 group-hover:bg-indigo-100"
                style={{ height: '100%' }}
             >
                <div 
                    className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-md transition-all duration-1000 ease-out opacity-80 group-hover:opacity-100"
                    style={{ height: animated ? `${(v / max) * 100}%` : '0%' }}
                />
             </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <style>{styles}</style>

      {/* --- HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Xin chào,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              {userName}!
            </span>{" "}
            🚀
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <CalendarIcon size={14} /> 
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      )}

      {/* --- STAT CARDS --- */}
      {!loading && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Tổng Học Viên"
          value={stats.totalStudents}
          icon={<Users />}
          colorClass="bg-blue-500"
          delay="delay-0"
        />
        <StatCard
          title="Lớp Đang Dạy"
          value={stats.totalClasses}
          icon={<Layers />}
          colorClass="bg-purple-500"
          delay="delay-100"
        />
        <StatCard
          title="Test Chờ Duyệt"
          value={stats.pendingTests}
          icon={<FilePlus />}
          colorClass="bg-amber-500"
          sub={stats.pendingTests > 0 ? "Cần xử lý ngay" : "Đã hoàn thành"}
          delay="delay-200"
        />
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg text-white animate-fade-in-up delay-300 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1">Tỉ lệ nộp bài</p>
                <h3 className="text-3xl font-bold">{stats.avgCompletion}%</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <PieChart size={24} className="text-white" />
              </div>
            </div>
            <div className="mt-4">
               <div className="flex justify-between text-xs text-indigo-200 mb-1">
                 <span>Tiến độ chung</span>
                 <span>{stats.totalSubmissions}/{stats.totalRequired}</span>
               </div>
               <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                 <div className="h-full bg-white/90 rounded-full progress-bar" style={{ width: `${stats.avgCompletion}%` }}></div>
               </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-lg">          </div>
        </div>
      </div>
      )}

      {/* --- MAIN CONTENT GRID --- */}
      {!loading && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Classes & Assignments */}
        <div className="lg:col-span-2 space-y-8 animate-fade-in-up delay-200">
          
          {/* Class List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Tiến Độ Các Lớp</h3>
              <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4 text-left">Lớp Học</th>
                    <th className="px-6 py-4 text-center">Sĩ Số</th>
                    <th className="px-6 py-4 text-left w-1/3">Mức độ hoàn thành</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classes.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-400 text-sm">
                        Chưa có lớp học nào
                      </td>
                    </tr>
                  ) : (
                    classes.map((cls) => {
                     const clsAssignments = assignments.filter(a => a.classId === cls.id);
                     const clsSub = clsAssignments.reduce((acc, cur) => acc + cur.submissions, 0);
                     const clsTotal = clsAssignments.reduce((acc, cur) => acc + cur.total, 0);
                     const pct = clsTotal > 0 ? Math.round((clsSub / clsTotal) * 100) : 0;

                     return (
                      <tr key={cls.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                              {cls.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{cls.name}</div>
                              <div className="text-xs text-gray-500">{cls.level} • {cls.schedule}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600 font-medium">
                          {cls.students}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="font-medium text-gray-700">{pct}%</span>
                              <span className="text-gray-400">{clsSub}/{clsTotal} bài nộp</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full progress-bar ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-orange-400'}`} 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50">
                            <ArrowUpRight size={18} />
                          </button>
                        </td>
                      </tr>
                     );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Assignments */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 text-lg">Bài Tập & Đề Thi Gần Đây</h3>
            </div>
            {assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all duration-300 group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-white border border-gray-200 text-gray-500 uppercase tracking-wide group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                        {a.classId || 'Chưa gán lớp'}
                      </span>
                      {a.due && (
                        <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                          Hạn: {new Date(a.due).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1 line-clamp-1 group-hover:text-indigo-700">{a.title}</h4>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                      <span>{a.submissions} học viên đã nộp</span>
                      {a.total > 0 && (
                        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${(a.submissions/a.total)*100}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                Chưa có bài tập nào
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Charts & Actions */}
        <div className="space-y-8 animate-fade-in-up delay-300">
          
          {/* Weekly Activity Chart */}
          {weeklyActivity.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="mb-6">
                <h4 className="font-bold text-gray-800">Hoạt Động Tuần Này</h4>
                <p className="text-xs text-gray-500">Số lượng tương tác & bài nộp</p>
              </div>
              <MiniBarChart data={weeklyActivity} />
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-xs text-gray-500">
                <span>Thứ 2</span>
                <span>Thứ 4</span>
                <span>Thứ 6</span>
                <span>CN</span>
              </div>
            </div>
          )}

          {/* Pending Exams */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                Chờ Publish
              </h4>
              <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-md text-gray-600">{exams.filter(e => !e.published).length} bài</span>
            </div>

            <div className="space-y-3">
              {exams.filter(e => !e.published).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                   Tất cả bài thi đã được publish!
                </div>
              ) : (
                exams.filter(e => !e.published).map(e => (
                  <div key={e.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-2">
                      <div className="font-semibold text-gray-800 text-sm">{e.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{e.classId} • {e.duration} phút</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => publishExam(e.id)}
                        className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                      >
                        Publish Ngay
                      </button>
                      <button 
                        onClick={() => deleteExam(e.id)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


        </div>
      </div>
      )}
    </div>
  );
}