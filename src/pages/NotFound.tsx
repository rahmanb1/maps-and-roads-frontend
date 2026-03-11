import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {Helmet} from "react-helmet-async";

const NotFound = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const bg = isDark ? '#1c1917' : '#fffbf7';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';
    const border = isDark ? '#44403c' : '#fde8c8';

    return (
        <div style={{
            backgroundColor: bg, minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', transition: 'background-color 0.3s'
        }}>
            <Helmet>
                <title>404 — Səhifə Tapılmadı | Maps & Roads</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <div style={{ textAlign: 'center', maxWidth: '480px' }}>
                <div style={{ fontSize: '80px', marginBottom: '16px' }}>🗺️</div>
                <h1 style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '72px', fontWeight: 700,
                    lineHeight: 1, marginBottom: '8px', color: '#f59e2a'
                }}>
                    404
                </h1>
                <h2 style={{
                    fontFamily: 'Georgia, serif', color: text,
                    fontSize: '24px', fontWeight: 700, marginBottom: '12px'
                }}>
                    Səhifə tapılmadı
                </h2>
                <p style={{ color: subtext, fontSize: '15px', lineHeight: 1.7, marginBottom: '32px' }}>
                    Axtardığınız səhifə mövcud deyil və ya köçürülüb.
                    Bəlkə səyahət zamanı yanlış yola düşdünüz? 😄
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(-1)}
                            style={{
                                backgroundColor: isDark ? '#44403c' : '#fef3e2',
                                color: '#e07f0a', border: `1px solid ${border}`,
                                borderRadius: '12px', padding: '12px 24px',
                                fontSize: '14px', fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif'
                            }}>
                        ← Geri qayıt
                    </button>
                    <button onClick={() => navigate('/')}
                            style={{
                                backgroundColor: '#f59e2a', color: '#ffffff',
                                border: 'none', borderRadius: '12px',
                                padding: '12px 24px', fontSize: '14px', fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif'
                            }}>
                        🏠 Ana səhifə
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;