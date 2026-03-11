import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';
import api from '../api/axios';

interface Category {
    id: number;
    name: string;
    icon: string;
}

const Footer = () => {
    const { isDark } = useTheme();
    const subtext = isDark ? '#a8a29e' : '#a8a29e';
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
    }, []);

    return (
        <footer style={{
            backgroundColor: '#1c1917',
            borderTop: '1px solid #292524',
            marginTop: 'auto'
        }}>
            <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '64px 24px 32px' }}>

                {/* Üst hissə */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '48px',
                    marginBottom: '56px'
                }}>

                    {/* Logo & Haqqında */}
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <img src="/logo1.png" alt="Maps & Roads" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
                        </div>
                        <p style={{ color: subtext, fontSize: '13px', lineHeight: 1.8, marginBottom: '24px' }}>
                            Dünyanın dörd bir yanından səyahətçilərin hekayələri. İlham al, paylaş, kəşf et.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {[
                                { icon: '🌍', label: 'Web' },
                                { icon: '📸', label: 'Instagram' },
                                { icon: '🐦', label: 'Twitter' },
                            ].map((s) => (
                                <div key={s.label}
                                     style={{
                                         width: '36px', height: '36px',
                                         backgroundColor: '#292524',
                                         borderRadius: '10px',
                                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                                         fontSize: '16px', cursor: 'pointer',
                                         transition: 'background-color 0.2s'
                                     }}
                                     onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#44403c')}
                                     onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#292524')}>
                                    {s.icon}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Keçidlər */}
                    <div>
                        <h4 style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Keçidlər
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { to: '/', label: 'Ana Səhifə' },
                                { to: '/create', label: 'Yeni Post Yaz' },
                                { to: '/profile', label: 'Profilim' },
                                { to: '/login', label: 'Giriş' },
                                { to: '/register', label: 'Qeydiyyat' },
                            ].map((link) => (
                                <Link key={link.to} to={link.to}
                                      style={{ color: subtext, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                                      onMouseEnter={e => (e.currentTarget.style.color = '#f59e2a')}
                                      onMouseLeave={e => (e.currentTarget.style.color = '#a8a29e')}>
                                    <span style={{ color: '#44403c', fontSize: '10px' }}>▶</span>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Populyar Kateqoriyalar */}
                    <div>
                        <h4 style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Kateqoriyalar
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {categories.length === 0 ? (
                                <p style={{ color: '#57534e', fontSize: '13px' }}>Yüklənir...</p>
                            ) : (
                                categories.map((cat) => (
                                    <Link key={cat.id} to={`/?category=${cat.id}`}
                                          style={{ textDecoration: 'none' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                                            backgroundColor: '#292524', color: '#a8a29e',
                                            fontSize: '12px', fontWeight: 500,
                                            padding: '5px 12px', borderRadius: '20px',
                                            border: '1px solid #44403c',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                              onMouseEnter={e => {
                                                  (e.currentTarget as HTMLElement).style.backgroundColor = '#44403c';
                                                  (e.currentTarget as HTMLElement).style.color = '#f59e2a';
                                                  (e.currentTarget as HTMLElement).style.borderColor = '#f59e2a';
                                              }}
                                              onMouseLeave={e => {
                                                  (e.currentTarget as HTMLElement).style.backgroundColor = '#292524';
                                                  (e.currentTarget as HTMLElement).style.color = '#a8a29e';
                                                  (e.currentTarget as HTMLElement).style.borderColor = '#44403c';
                                              }}>
                                            {cat.icon} {cat.name}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Xəbərdar ol
                        </h4>
                        <p style={{ color: subtext, fontSize: '13px', lineHeight: 1.7, marginBottom: '16px' }}>
                            Yeni səyahət hekayələrindən ilk xəbər tutan ol.
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="email"
                                placeholder="Email ünvanınız"
                                style={{
                                    flex: 1, padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #292524',
                                    backgroundColor: '#292524',
                                    color: '#e7e5e4', fontSize: '13px',
                                    outline: 'none', fontFamily: 'Segoe UI, sans-serif'
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#f59e2a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#292524')}
                            />
                            <button style={{
                                backgroundColor: '#f59e2a', color: '#ffffff',
                                border: 'none', borderRadius: '10px',
                                padding: '10px 14px', fontSize: '16px',
                                fontWeight: 600, cursor: 'pointer',
                                fontFamily: 'Segoe UI, sans-serif',
                            }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e07f0a')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f59e2a')}>
                                →
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ayırıcı */}
                <div style={{ height: '1px', backgroundColor: '#292524', marginBottom: '28px' }} />

                {/* Alt hissə */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <p style={{ color: '#57534e', fontSize: '12px' }}>
                        © 2026 Maps & Roads. Bütün hüquqlar qorunur.
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                            { emoji: '🇦🇿', label: 'Azərbaycan' },
                            { emoji: '✈️', label: 'Səyahət' },
                            { emoji: '❤️', label: 'Həyat' },
                        ].map((tag) => (
                            <span key={tag.label} style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                backgroundColor: '#292524', color: '#78716c',
                                fontSize: '11px', fontWeight: 500,
                                padding: '5px 12px', borderRadius: '20px',
                                border: '1px solid #44403c'
                            }}>
                                {tag.emoji} {tag.label}
                            </span>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        {['Gizlilik', 'Şərtlər', 'Əlaqə'].map((item) => (
                            <span key={item}
                                  style={{ color: '#57534e', fontSize: '12px', cursor: 'pointer' }}
                                  onMouseEnter={e => (e.currentTarget.style.color = '#f59e2a')}
                                  onMouseLeave={e => (e.currentTarget.style.color = '#57534e')}>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;