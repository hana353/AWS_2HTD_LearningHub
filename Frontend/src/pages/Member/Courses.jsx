import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  import { useNavigate } from "react-router-dom";
  import { Calendar, Clock, Search, ArrowRight, Loader2 } from "lucide-react";
  import { getMyCourses } from "../../services/memberService";
  
  const PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=1000&auto=format&fit=crop",
  ];
  
  const formatDate = (value) => {
    if (!value) return "Chưa có dữ liệu";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  
  const formatCurrency = (price, currency = "VND") => {
    if (price === null || price === undefined) return "Miễn phí";
    if (price === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(price);
  };
  
  const hashToIndex = (key) => {
    if (!key) return 0;
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const length = PLACEHOLDER_IMAGES.length || 1;
    return Math.abs(hash) % length;
  };
  
  const mapCourse = (course) => {
    const enrolledAt = course?.enrolledAt || null;
    const progressPercent = course?.progressPercent ?? 0;
    const status = course?.status || null;
    
    return {
      id: course?.courseId || course?.id || "",
      slug: course?.slug || "",
      title: course?.title || "Khóa học chưa đặt tên",
      shortDescription: course?.shortDescription || "",
      enrolledAt,
      enrolledDate: formatDate(enrolledAt),
      progressPercent: Number.isFinite(Number(progressPercent)) ? Number(progressPercent) : 0,
      status,
      image: PLACEHOLDER_IMAGES[hashToIndex(course?.courseId || course?.id || "")],
      hasRoute: Boolean(course?.courseId || course?.id),
    };
  };
  
  export default function Courses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const isMountedRef = useRef(true);

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    const fetchCourses = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyCourses();
        if (!isMountedRef.current) return;
        const mapped = (Array.isArray(data) ? data : []).map(mapCourse);
        setCourses(mapped);
      } catch (err) {
        if (!isMountedRef.current) return;
        setCourses([]);
        setError(err?.message || "Không thể tải dữ liệu khóa học.");
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }, []);

    useEffect(() => {
      fetchCourses();
    }, [fetchCourses]);

    const handleOpenCourse = useCallback(
      (courseId) => {
        if (!courseId) return;
        navigate(`/member/course/${courseId}`);
      },
      [navigate]
    );

    const totalCourses = courses.length;
    const completedCount = useMemo(
      () => courses.filter((course) => course.progressPercent >= 100).length,
      [courses]
    );
    const inProgressCount = useMemo(
      () => courses.filter((course) => course.progressPercent > 0 && course.progressPercent < 100).length,
      [courses]
    );

    const filteredCourses = useMemo(() => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      if (!normalizedSearch) return courses;
      
      return courses.filter((course) => {
        const title = course.title?.toLowerCase() || "";
        const description = course.shortDescription?.toLowerCase() || "";
        return (
          title.includes(normalizedSearch) ||
          description.includes(normalizedSearch)
        );
      });
    }, [courses, searchTerm]);
  
    return (
      <div className="w-full space-y-8 pb-10">
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-50/100 to-indigo-50/100 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-sm">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-200/40 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-indigo-200/40 rounded-full blur-[60px]"></div>
  
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#5a4d8c] mb-2">
                Khóa học của tôi
              </h1>
              <p className="text-gray-600 max-w-lg">
                Danh sách các khóa học bạn đã tham gia. Tiếp tục học tập để hoàn thành khóa học của bạn.
              </p>
            </div>

            <div className="flex gap-3 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-white/50 shadow-sm">
              <div className="px-4 py-2 text-center border-r border-gray-200">
                <div className="text-[#5a4d8c] font-bold text-xl">
                  {totalCourses}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Tổng
                </div>
              </div>
              <div className="px-4 py-2 text-center border-r border-gray-200">
                <div className="text-emerald-600 font-bold text-xl">
                  {completedCount}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Hoàn thành
                </div>
              </div>
              <div className="px-4 py-2 text-center">
                <div className="text-indigo-600 font-bold text-xl">
                  {inProgressCount}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Đang học
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <div className="flex flex-col md:flex-row justify-end items-center gap-4">
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-[#8c78ec] transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm tên hoặc mô tả khóa học..."
              className="w-full md:w-64 pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c78ec]/20 focus:border-[#8c78ec] transition-all shadow-sm"
            />
          </div>
        </div>
  
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={fetchCourses}
              className="px-4 py-2 bg-white text-red-600 rounded-xl font-semibold border border-red-200 hover:bg-red-100 transition"
            >
              Thử lại
            </button>
          </div>
        )}
  
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm h-[360px] flex flex-col animate-pulse"
              >
                <div className="h-48 rounded-2xl mb-5 bg-gray-200" />
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
                <div className="h-3 bg-gray-200 rounded mb-6 w-5/6" />
                <div className="h-10 bg-gray-200 rounded-xl mt-auto" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredCourses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => {
                  const cardKey = course.id || course.title;
                  const isCompleted = course.progressPercent >= 100;

                  return (
                    <div
                      key={cardKey}
                      className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 flex flex-col h-full relative"
                    >
                      <div className="absolute top-5 right-5 z-20 flex gap-2">
                        <span className="text-xs font-semibold text-[#8c78ec] bg-indigo-50 px-3 py-1 rounded-full">
                          {course.slug || "Khóa học"}
                        </span>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}
                        >
                          {isCompleted ? "Hoàn thành" : `${Math.round(course.progressPercent)}%`}
                        </span>
                      </div>

                      <div className="h-48 rounded-2xl mb-5 relative overflow-hidden shadow-inner group-hover:shadow-md transition-all">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <h3
                          className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#8c78ec] transition-colors line-clamp-2"
                          title={course.title}
                        >
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {course.shortDescription ||
                            "Chưa có mô tả cho khóa học này."}
                        </p>

                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Tiến độ học tập</span>
                            <span className="font-semibold">{Math.round(course.progressPercent)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                isCompleted
                                  ? "bg-emerald-500"
                                  : "bg-[#8c78ec]"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, course.progressPercent))}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400 mb-5 border-t border-gray-100 pt-4">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-[#8c78ec]" />
                            {course.enrolledDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-[#8c78ec]" />
                            Đã tham gia
                          </div>
                        </div>

                        <div className="mt-auto">
                          <button
                            onClick={() => handleOpenCourse(course.id)}
                            className="w-full py-3 rounded-xl bg-[#8c78ec] text-white font-semibold hover:bg-[#7a66d3] transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            {isCompleted ? "Xem lại khóa học" : "Tiếp tục học"}
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
  
            {!error && filteredCourses.length === 0 && searchTerm && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Search size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Không tìm thấy kết quả
                </h3>
                <p className="text-gray-500 mb-6">
                  Thử thay đổi từ khóa tìm kiếm.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                  }}
                  className="px-8 py-3 bg-[#8c78ec] text-white rounded-xl font-bold hover:bg-[#7a66d3] transition shadow-lg"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {!error && !loading && filteredCourses.length === 0 && !searchTerm && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Search size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Chưa có khóa học
                </h3>
                <p className="text-gray-500 mb-6">
                  Bạn chưa tham gia khóa học nào. Hãy khám phá các khóa học có sẵn.
                </p>
                <button
                  onClick={() => {
                    navigate("/member/dashboard");
                  }}
                  className="px-8 py-3 bg-[#8c78ec] text-white rounded-xl font-bold hover:bg-[#7a66d3] transition shadow-lg"
                >
                  Khám phá khóa học
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  