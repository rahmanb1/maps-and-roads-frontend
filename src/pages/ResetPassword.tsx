import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('Şifrə minimum 8 simvol olmalıdır');
            return;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            setError('Şifrədə ən azı 1 xüsusi simvol olmalıdır');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Şifrələr uyğun gəlmir');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '12px 16px',
        borderRadius: '12px', border: '1px solid #fde8c8',
        backgroundColor: '#fffbf7', color: '#1c1917',
        fontSize: '14px', outline: 'none',
        fontFamily: 'Segoe UI, sans-serif',
    };

    if (!token) {
        return (
            <div style={{ backgroundColor: '#fffbf7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</p>
                    <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: 600 }}>Etibarsız link</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#fffbf7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', backgroundColor: '#fef3e2',
                        borderRadius: '16px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px'
                    }}>
                        🔒
                    </div>
                    <h1 style={{ fontFamily: 'Georgia, serif', color: '#1c1917', fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>
                        Yeni Şifrə
                    </h1>
                    <p style={{ color: '#a8a29e', fontSize: '14px' }}>
                        Yeni şifrənizi daxil edin
                    </p>
                </div>

                <div style={{
                    backgroundColor: '#ffffff', border: '1px solid #fde8c8',
                    borderRadius: '20px', padding: '32px',
                    boxShadow: '0 4px 24px rgba(245,158,42,0.08)'
                }}>
                    {success ? (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '48px', marginBottom: '12px' }}>✅</p>
                            <p style={{ color: '#16a34a', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                                Şifrə uğurla dəyişdirildi!
                            </p>
                            <p style={{ color: '#a8a29e', fontSize: '13px' }}>
                                3 saniyə sonra giriş səhifəsinə yönləndiriləcəksiniz...
                            </p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div style={{
                                    backgroundColor: '#fef2f2', color: '#dc2626',
                                    border: '1px solid #fecaca', borderRadius: '10px',
                                    padding: '12px 16px', fontSize: '13px', marginBottom: '20px'
                                }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ color: '#44403c', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Yeni Şifrə
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{ ...inputStyle, paddingRight: '44px' }}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none', border: 'none',
                                                cursor: 'pointer', color: '#a8a29e', fontSize: '16px'
                                            }}>
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    <p style={{ color: '#a8a29e', fontSize: '11px', marginTop: '4px' }}>
                                        Minimum 8 simvol, ən azı 1 xüsusi simvol (!@#$%^&*)
                                    </p>
                                </div>

                                <div>
                                    <label style={{ color: '#44403c', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Şifrəni Təsdiqlə
                                    </label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        style={inputStyle}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        backgroundColor: '#f59e2a', color: '#ffffff',
                                        padding: '13px', borderRadius: '12px',
                                        border: 'none', fontSize: '14px', fontWeight: 600,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1,
                                        fontFamily: 'Segoe UI, sans-serif'
                                    }}>
                                    {loading ? 'Yüklənir...' : 'Şifrəni Dəyiş'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;