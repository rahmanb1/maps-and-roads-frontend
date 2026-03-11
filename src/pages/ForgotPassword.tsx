import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess('Şifrə sıfırlama linki emailinizə göndərildi!');
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

    return (
        <div style={{ backgroundColor: '#fffbf7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', backgroundColor: '#fef3e2',
                        borderRadius: '16px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px'
                    }}>
                        🔑
                    </div>
                    <h1 style={{ fontFamily: 'Georgia, serif', color: '#1c1917', fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>
                        Şifrəni Unutdun?
                    </h1>
                    <p style={{ color: '#a8a29e', fontSize: '14px' }}>
                        Email ünvanınızı daxil edin, link göndərəcəyik
                    </p>
                </div>

                <div style={{
                    backgroundColor: '#ffffff', border: '1px solid #fde8c8',
                    borderRadius: '20px', padding: '32px',
                    boxShadow: '0 4px 24px rgba(245,158,42,0.08)'
                }}>
                    {error && (
                        <div style={{
                            backgroundColor: '#fef2f2', color: '#dc2626',
                            border: '1px solid #fecaca', borderRadius: '10px',
                            padding: '12px 16px', fontSize: '13px', marginBottom: '20px'
                        }}>
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div style={{
                            backgroundColor: '#f0fdf4', color: '#16a34a',
                            border: '1px solid #bbf7d0', borderRadius: '10px',
                            padding: '16px', fontSize: '14px', textAlign: 'center'
                        }}>
                            <p style={{ fontSize: '32px', marginBottom: '8px' }}>📧</p>
                            <p style={{ fontWeight: 600, marginBottom: '4px' }}>{success}</p>
                            <p style={{ fontSize: '12px', color: '#4ade80' }}>
                                Link 1 saat ərzində etibarlıdır
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ color: '#44403c', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={inputStyle}
                                    placeholder="email@gmail.com"
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
                                {loading ? 'Göndərilir...' : 'Link Göndər'}
                            </button>
                        </form>
                    )}
                </div>

                <p style={{ textAlign: 'center', color: '#a8a29e', fontSize: '13px', marginTop: '20px' }}>
                    <Link to="/login" style={{ color: '#f59e2a', fontWeight: 600, textDecoration: 'none' }}>
                        ← Girişə qayıt
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;