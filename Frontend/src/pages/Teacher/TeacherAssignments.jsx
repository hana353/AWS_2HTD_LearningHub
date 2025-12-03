import React, { useState, useEffect } from 'react';
import { 
    FileText, Plus, Trash, Save, CheckCircle, 
    Clock, AlertCircle, X, Search, MoreVertical,
    Calendar, Users, ChevronRight, LayoutList, PenTool
} from 'lucide-react';
import { getExams, createQuestion } from '../../services/teacherService';

export default function TeacherAssignments() {
    // --- STATE & DATA ---
    const [view, setView] = useState('list'); // 'list' | 'create'
    const [filterClass, setFilterClass] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dữ liệu Lớp học (Đồng bộ với Dashboard)
    const mockClasses = [
        { id: 'CLS001', name: 'IELTS Foundation K12' },
        { id: 'CLS002', name: 'General English - Work' },
        { id: 'CLS003', name: 'IELTS Intensive 7.0+' },
        { id: 'CLS004', name: 'Communication Master' },
    ];

    // Dữ liệu Bài tập từ API
    const [assignments, setAssignments] = useState([]);

    // Fetch dữ liệu đề thi từ API
    useEffect(() => {
        const fetchExams = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getExams();
                
                // Map dữ liệu từ API sang format của component
                const mappedAssignments = response.items.map((exam) => ({
                    id: exam.id,
                    title: exam.title,
                    classId: null, // API không có thông tin lớp
                    className: 'Chưa giao (Ngân hàng đề)',
                    duration: exam.duration_minutes || 0,
                    questionsCount: 0, // API không có thông tin số câu hỏi
                    status: exam.published ? 'Active' : 'Draft',
                    dueDate: null,
                    description: exam.description,
                    passingScore: exam.passing_score,
                    createdAt: exam.created_at
                }));
                
                setAssignments(mappedAssignments);
            } catch (err) {
                setError(err.message || 'Không thể tải danh sách đề thi');
                console.error('Error fetching exams:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, []);

    // State cho Form tạo mới
    const [newExam, setNewExam] = useState({
        title: '',
        duration: 45,
        classId: '', // Lớp được gán
        dueDate: '',
        questions: [
            { id: 1, text: '', options: ['', '', '', ''], correct: 0 }
        ]
    });

    // --- LOGIC HANDLERS ---

    const handleCreateClick = () => {
        setNewExam({
            title: '',
            duration: 45,
            classId: '',
            dueDate: '',
            questions: [{ id: 1, text: '', options: ['', '', '', ''], correct: 0 }]
        });
        setView('create');
    };

    const handleAddQuestion = () => {
        setNewExam(prev => ({
            ...prev,
            questions: [...prev.questions, { 
                id: prev.questions.length + 1, 
                text: '', 
                options: ['', '', '', ''], 
                correct: 0 
            }]
        }));
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...newExam.questions];
        updatedQuestions[index][field] = value;
        setNewExam({ ...newExam, questions: updatedQuestions });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const updatedQuestions = [...newExam.questions];
        updatedQuestions[qIndex].options[oIndex] = value;
        setNewExam({ ...newExam, questions: updatedQuestions });
    };

    const handleRemoveQuestion = (index) => {
        if (newExam.questions.length === 1) return;
        const updated = newExam.questions.filter((_, i) => i !== index);
        setNewExam({ ...newExam, questions: updated });
    };

    const handleSaveExam = async () => {
        if (!newExam.title) return alert("Vui lòng nhập tên đề thi!");
        
        const selectedClass = mockClasses.find(c => c.id === newExam.classId);
        
        const examData = {
            id: Date.now(),
            title: newExam.title,
            classId: newExam.classId || null,
            className: selectedClass ? selectedClass.name : 'Chưa giao (Ngân hàng đề)',
            duration: newExam.duration,
            questionsCount: newExam.questions.length,
            status: newExam.classId ? 'Active' : 'Draft', // Nếu chọn lớp thì Active luôn, ko thì Draft
            dueDate: newExam.dueDate || 'N/A'
        };

        try {
            // Cập nhật UI trước để tránh cảm giác chậm
            setAssignments([examData, ...assignments]);

            // Map từng câu hỏi sang payload của API /api/tests/questions
            const questionPayloads = newExam.questions.map((q, index) => ({
                title: `Câu ${index + 1}: ${q.text || "Không tiêu đề"}`,
                body: q.text,
                type: "multiple_choice", // tạm thời map kiểu multiple choice
                difficulty: 2,
                tags: ["exam", "teacher_created"],
                choices: q.options.map((opt, oIndex) => ({
                    text: opt,
                    value: String.fromCharCode(65 + oIndex), // A, B, C, D...
                    isCorrect: q.correct === oIndex,
                })),
            }));

            // Gọi API tạo từng câu hỏi
            for (const payload of questionPayloads) {
                await createQuestion(payload);
            }

            alert("Lưu đề thi và câu hỏi thành công!");
            setView('list');
        } catch (error) {
            console.error("Error when saving exam/questions:", error);
            alert(error.message || "Có lỗi xảy ra khi lưu đề thi / câu hỏi");
        }
    };

    // --- RENDER HELPERS ---
    const getStatusStyle = (status) => {
        switch(status) {
            case 'Active': return 'bg-green-100 text-green-700 border-green-200';
            case 'Draft': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'Ended': return 'bg-red-100 text-red-600 border-red-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // --- VIEW: CREATE (BUILDER) ---
    if (view === 'create') {
        return (
            <div className="min-h-screen bg-gray-50 p-6 font-sans animate-fade-in-up">
                {/* Header Builder */}
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition">
                            <X size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Trình soạn thảo đề thi</h2>
                            <p className="text-sm text-gray-500">Tạo câu hỏi và giao bài cho lớp học</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Lưu nháp</button>
                        <button 
                            onClick={handleSaveExam}
                            className="px-6 py-2 bg-[#5a4d8c] text-white font-medium rounded-lg shadow-md hover:bg-[#483d73] transition flex items-center gap-2"
                        >
                            <Save size={18} /> Hoàn tất & Giao bài
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN: Cấu hình chung */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <LayoutList size={20} className="text-[#5a4d8c]" /> Thông tin chung
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tên đề thi</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                        placeholder="VD: Kiểm tra giữa kỳ..."
                                        value={newExam.title}
                                        onChange={(e) => setNewExam({...newExam, title: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Giao cho lớp (Publish)</label>
                                    <select 
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition bg-white"
                                        value={newExam.classId}
                                        onChange={(e) => setNewExam({...newExam, classId: e.target.value})}
                                    >
                                        <option value="">-- Chỉ lưu kho (Không giao ngay) --</option>
                                        {mockClasses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">Chọn lớp để đề thi được hiển thị ngay cho học viên.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Thời gian (phút)</label>
                                        <div className="relative">
                                            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                                            <input 
                                                type="number" 
                                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                                value={newExam.duration}
                                                onChange={(e) => setNewExam({...newExam, duration: Number(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Hạn nộp</label>
                                        <input 
                                            type="date" 
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                            value={newExam.dueDate}
                                            onChange={(e) => setNewExam({...newExam, dueDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Question Builder */}
                    <div className="lg:col-span-2 space-y-6">
                        {newExam.questions.map((q, qIndex) => (
                            <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-bold">Câu hỏi {qIndex + 1}</span>
                                    <button 
                                        onClick={() => handleRemoveQuestion(qIndex)}
                                        className="text-gray-400 hover:text-red-500 transition p-1"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>

                                {/* Nội dung câu hỏi */}
                                <div className="mb-4">
                                    <input 
                                        type="text" 
                                        className="w-full text-lg font-medium border-b border-gray-200 pb-2 focus:border-[#5a4d8c] outline-none transition placeholder-gray-300"
                                        placeholder="Nhập nội dung câu hỏi tại đây..."
                                        value={q.text}
                                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                    />
                                </div>

                                {/* Các đáp án */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className={`flex items-center gap-3 p-3 rounded-lg border ${q.correct === oIndex ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}>
                                            <input 
                                                type="radio" 
                                                name={`question-${q.id}`} 
                                                className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer"
                                                checked={q.correct === oIndex}
                                                onChange={() => handleQuestionChange(qIndex, 'correct', oIndex)}
                                            />
                                            <input 
                                                type="text" 
                                                className="flex-1 bg-transparent outline-none text-sm"
                                                placeholder={`Đáp án ${String.fromCharCode(65 + oIndex)}`}
                                                value={opt}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button 
                            onClick={handleAddQuestion}
                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium hover:border-[#5a4d8c] hover:text-[#5a4d8c] hover:bg-purple-50 transition flex flex-col items-center gap-2"
                        >
                            <Plus size={24} />
                            <span>Thêm câu hỏi mới</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: LIST (DEFAULT) ---
    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Ngân hàng Đề thi & Bài tập</h2>
                    <p className="text-gray-500">Quản lý, soạn thảo và giao bài tập cho các lớp.</p>
                </div>
                <button 
                    onClick={handleCreateClick}
                    className="bg-[#5a4d8c] text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-purple-100 hover:bg-[#483d73] transition flex items-center gap-2"
                >
                    <Plus size={20} /> Tạo đề thi mới
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm đề thi..." 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#5a4d8c] transition"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 whitespace-nowrap">Lọc theo lớp:</span>
                    <select 
                        className="px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#5a4d8c] text-sm"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="All">Tất cả các lớp</option>
                        {mockClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5a4d8c] mb-4"></div>
                        <p className="text-gray-500">Đang tải danh sách đề thi...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={24} />
                    <div>
                        <p className="text-red-700 font-semibold">Lỗi khi tải dữ liệu</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Assignments Grid */}
            {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments
                    .filter(a => filterClass === 'All' || a.classId === filterClass)
                    .map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition duration-300 flex flex-col h-full group">
                        
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-[#5a4d8c] rounded-xl">
                                <FileText size={24} />
                            </div>
                            <div className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusStyle(item.status)}`}>
                                {item.status === 'Active' ? 'Đang mở' : 'Bản nháp'}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2 group-hover:text-[#5a4d8c] transition">
                                {item.title}
                            </h3>
                            
                            <div className="space-y-2 text-sm text-gray-500 mb-4">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-gray-400" />
                                    <span className="truncate max-w-[200px]">{item.className}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-gray-400" />
                                    <span>{item.duration} phút • {item.questionsCount} câu hỏi</span>
                                </div>
                                {item.dueDate && (
                                    <div className="flex items-center gap-2 text-orange-600">
                                        <Calendar size={16} />
                                        <span>Hạn: {item.dueDate}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 mt-auto border-t border-gray-100 flex gap-2">
                            {item.status === 'Draft' ? (
                                <>
                                    <button className="flex-1 py-2 bg-purple-50 text-[#5a4d8c] font-medium rounded-lg hover:bg-[#5a4d8c] hover:text-white transition text-sm">
                                        Chỉnh sửa
                                    </button>
                                    <button className="flex-1 py-2 border border-[#5a4d8c] text-[#5a4d8c] font-medium rounded-lg hover:bg-purple-50 transition text-sm">
                                        Giao bài
                                    </button>
                                </>
                            ) : (
                                <button className="w-full py-2 bg-gray-50 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition text-sm flex justify-center items-center gap-2">
                                    Xem kết quả <ChevronRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Card Tạo nhanh (Add new placeholder) */}
                <button 
                    onClick={handleCreateClick}
                    className="rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center text-gray-400 hover:border-[#5a4d8c] hover:text-[#5a4d8c] hover:bg-purple-50/50 transition duration-300 min-h-[250px]"
                >
                    <div className="p-4 bg-gray-50 rounded-full mb-3 group-hover:bg-white transition">
                        <PenTool size={32} />
                    </div>
                    <span className="font-semibold">Soạn đề thi mới</span>
                </button>
            </div>
            )}

            {/* Empty State */}
            {!loading && !error && assignments.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-gray-500 text-lg mb-2">Chưa có đề thi nào</p>
                    <p className="text-gray-400 text-sm mb-6">Hãy tạo đề thi mới để bắt đầu</p>
                    <button 
                        onClick={handleCreateClick}
                        className="bg-[#5a4d8c] text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:bg-[#483d73] transition flex items-center gap-2 mx-auto"
                    >
                        <Plus size={20} /> Tạo đề thi mới
                    </button>
                </div>
            )}
        </div>
    );
}
