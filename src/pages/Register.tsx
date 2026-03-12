import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import {Helmet} from "react-helmet-async";

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const { isDark } = useTheme();

    const bg = isDark ? '#1c1917' : '#fffbf7';
    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#44403c';
    const inputBg = isDark ? '#1c1917' : '#fffbf7';

    const inputStyle = {
        width: '100%', padding: '12px 16px',
        borderRadius: '12px', border: `1px solid ${border}`,
        backgroundColor: inputBg, color: text,
        fontSize: '14px', outline: 'none',
        fontFamily: 'Segoe UI, sans-serif',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (username.length < 3) { setError('İstifadəçi adı minimum 3 simvol olmalıdır'); return; }
        if (password.length < 8) { setError('Şifrə minimum 8 simvol olmalıdır'); return; }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            setError('Şifrədə ən azı 1 xüsusi simvol olmalıdır (!@#$%^&* və s.)'); return;
        }
        setLoading(true);
        try {
            await api.post('/auth/register', { username, email, password });
            setSuccess(true);
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Qeydiyyat zamanı xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', transition: 'background-color 0.3s' }}>
            <Helmet>
                <title>Qeydiyyat — TravelBlog</title>
                <meta name="description" content="TravelBlog-a qoşulun və səyahət hekayənizi dünya ilə paylaşın." />
                <meta name="robots" content="noindex" />
            </Helmet>
            <div style={{ width: '100%', maxWidth: '400px' }}>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        backgroundColor: isDark ? '#44403c' : '#fef3e2',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px', margin: '0 auto 16px'
                    }}>
                        🌍
                    </div>
                    <h1 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>
                        Qoşulun
                    </h1>
                    <p style={{ color: '#a8a29e', fontSize: '14px' }}>
                        Səyahət hekayənizi dünya ilə paylaşın
                    </p>
                </div>

                <div style={{
                    backgroundColor: card, border: `1px solid ${border}`,
                    borderRadius: '20px', padding: '32px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
                }}>
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📧</p>
                            <h3 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                                Qeydiyyat uğurlu!
                            </h3>
                            <p style={{ color: subtext, fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
                                <strong>{email}</strong> ünvanına təsdiqləmə linki göndərildi.
                            </p>
                            <p style={{ color: '#a8a29e', fontSize: '12px', marginBottom: '20px' }}>
                                Link 24 saat ərzində etibarlıdır
                            </p>
                            <Link to="/login"
                                  style={{
                                      display: 'inline-block',
                                      backgroundColor: '#f59e2a', color: '#ffffff',
                                      padding: '12px 24px', borderRadius: '12px',
                                      fontSize: '14px', fontWeight: 600, textDecoration: 'none'
                                  }}>
                                Girişə keç →
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div style={{
                                    backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626',
                                    border: '1px solid #fecaca', borderRadius: '10px',
                                    padding: '12px 16px', fontSize: '13px', marginBottom: '20px'
                                }}>
                                    {error}
                                </div>
                            )}

                            <button onClick={() => window.location.href = 'https://maps-and-roads-backend-production.up.railway.app/oauth2/authorization/google'}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: `1px solid ${border}`, backgroundColor: card, color: text,
                                        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                        fontFamily: 'Segoe UI, sans-serif',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        marginBottom: '12px'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDark ? '#44403c' : '#fffbf7')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = card)}>
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Google ilə qeydiyyat
                            </button>

                            <button onClick={() => window.location.href = 'https://maps-and-roads-backend-production.up.railway.app/oauth2/authorization/facebook'}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '12px',
                                        border: `1px solid ${border}`, backgroundColor: card, color: text,
                                        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                        fontFamily: 'Segoe UI, sans-serif',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        marginBottom: '20px'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDark ? '#44403c' : '#fffbf7')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = card)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                Facebook ilə qeydiyyat
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: border }} />
                                <span style={{ color: '#a8a29e', fontSize: '12px' }}>və ya</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: border }} />
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        İstifadəçi adı
                                    </label>
                                    <input type="text" value={username}
                                           onChange={(e) => setUsername(e.target.value)}
                                           style={inputStyle} placeholder="rehman123" required />
                                </div>

                                <div>
                                    <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Email
                                    </label>
                                    <input type="email" value={email}
                                           onChange={(e) => setEmail(e.target.value)}
                                           style={inputStyle} placeholder="email@gmail.com" required />
                                </div>

                                <div>
                                    <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Şifrə
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPassword ? 'text' : 'password'}
                                               value={password}
                                               onChange={(e) => setPassword(e.target.value)}
                                               style={{ ...inputStyle, paddingRight: '44px' }}
                                               placeholder="••••••" required />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', fontSize: '16px' }}>
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    <p style={{ color: '#a8a29e', fontSize: '11px', marginTop: '4px' }}>
                                        Minimum 8 simvol, ən azı 1 xüsusi simvol (!@#$%^&*)
                                    </p>
                                </div>

                                <button type="submit" disabled={loading}
                                        style={{
                                            backgroundColor: '#f59e2a', color: '#ffffff',
                                            padding: '13px', borderRadius: '12px',
                                            border: 'none', fontSize: '14px', fontWeight: 600,
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            opacity: loading ? 0.7 : 1,
                                            fontFamily: 'Segoe UI, sans-serif', marginTop: '4px'
                                        }}>
                                    {loading ? 'Yüklənir...' : 'Qeydiyyat'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <p style={{ textAlign: 'center', color: '#a8a29e', fontSize: '13px', marginTop: '20px' }}>
                    Hesabın var?{' '}
                    <Link to="/login" style={{ color: '#f59e2a', fontWeight: 600, textDecoration: 'none' }}>
                        Giriş
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;