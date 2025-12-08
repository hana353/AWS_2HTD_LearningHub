import React, { useState } from 'react';
import { confirmEmail, resendConfirmCode } from '../services/authService';

const primaryText = 'text-[#5a4d8c]';
const primaryBg = 'bg-[#8c78ec]';
const hoverBg = 'hover:bg-[#7a66d3]';
const lightestBg = 'bg-[#f8f6fb]';

export default function VerifyEmail({ email, onSuccess, onCancel }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('Vui lòng nhập mã xác thực');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await confirmEmail({ email, code });
            setSuccess('Xác thực email thành công!');
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (error) {
            setError(error.message || 'Mã xác thực không đúng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResendLoading(true);
        setError('');
        setSuccess('');

        try {
            await resendConfirmCode(email);
            setSuccess('Mã xác thực đã được gửi lại vào email của bạn!');
        } catch (error) {
            setError(error.message || 'Không thể gửi lại mã. Vui lòng thử lại.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${lightestBg}`}>
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực Email</h2>
                    <p className="text-gray-600 text-sm">
                        Chúng tôi đã gửi mã xác thực đến email:
                    </p>
                    <p className={`${primaryText} font-semibold mt-1`}>{email}</p>
                    <p className="text-gray-500 text-xs mt-2">
                        Vui lòng kiểm tra hộp thư và nhập mã xác thực bên dưới
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã xác thực
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition outline-none bg-gray-50 focus:bg-white text-center text-lg font-mono tracking-widest"
                            placeholder="Nhập mã 6 chữ số"
                            maxLength={6}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg ${primaryBg} ${hoverBg} transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? 'Đang xác thực...' : 'Xác thực Email'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendLoading}
                        className={`text-sm ${primaryText} hover:underline disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {resendLoading ? 'Đang gửi...' : 'Gửi lại mã xác thực'}
                    </button>
                </div>

                {onCancel && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Hủy
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

