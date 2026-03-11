import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

interface Notification {
    id: number;
    message: string;
    type: string;
    postId: number;
    read: boolean;
    createdAt: string;
}

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const { isDark, toggleTheme } = useTheme();

    const bg = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch {
            console.error('Bildiriş sayı yüklənmədi');
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch {
            console.error('Bildirişlər yüklənmədi');
        }
    };

    const handleNotifOpen = async () => {
        if (!notifOpen) {
            await fetchNotifications();
            if (unreadCount > 0) {
                await api.put('/notifications/mark-all-read');
                setUnreadCount(0);
            }
        }
        setNotifOpen(!notifOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    return (
        <nav style={{
            backgroundColor: bg,
            borderBottom: `1px solid ${border}`,
            boxShadow: '0 1px 8px rgba(245,158,42,0.08)',
            transition: 'background-color 0.3s'
        }} className="px-6 py-4 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto flex justify-between items-center">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                    <img
                        src="/logo.png"
                        alt="Maps & Roads"
                        style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
                    />
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-5">
                    {/* Xəritə linki — həm auth həm qonaq üçün */}
                    <Link to="/map"
                          style={{ color: subtext, fontSize: '13px', fontWeight: 500 }}
                          className="hover:opacity-70 transition">
                        🗺️ Xəritə
                    </Link>

                    {isAuthenticated ? (
                        <>
                            {user?.role === 'ADMIN' && (
                                <Link to="/admin"
                                      style={{ color: '#e07f0a', fontSize: '13px', fontWeight: 500 }}
                                      className="hover:opacity-70 transition">
                                    ⚙️ Admin
                                </Link>
                            )}
                            <Link to="/create"
                                  style={{
                                      backgroundColor: '#f59e2a', color: '#ffffff',
                                      fontSize: '13px', fontWeight: 600,
                                      padding: '8px 18px', borderRadius: '10px',
                                      textDecoration: 'none'
                                  }}
                                  className="hover:opacity-90 transition">
                                + Yeni Post
                            </Link>

                            {/* Bildiriş ikonu */}
                            <div ref={notifRef} style={{ position: 'relative' }}>
                                <button onClick={handleNotifOpen}
                                        style={{
                                            position: 'relative', background: 'none',
                                            border: 'none', cursor: 'pointer',
                                            padding: '6px', borderRadius: '10px',
                                            backgroundColor: notifOpen ? (isDark ? '#44403c' : '#fef3e2') : 'transparent'
                                        }}>
                                    <span style={{ fontSize: '20px' }}>🔔</span>
                                    {unreadCount > 0 && (
                                        <span style={{
                                            position: 'absolute', top: '0', right: '0',
                                            backgroundColor: '#dc2626', color: '#ffffff',
                                            fontSize: '10px', fontWeight: 700,
                                            width: '16px', height: '16px',
                                            borderRadius: '50%', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notifOpen && (
                                    <div style={{
                                        position: 'absolute', right: 0, top: '44px',
                                        width: '340px', backgroundColor: bg,
                                        border: `1px solid ${border}`, borderRadius: '16px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                        zIndex: 1000, overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            padding: '16px 20px',
                                            borderBottom: `1px solid ${border}`,
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <h3 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '16px', fontWeight: 700 }}>
                                                Bildirişlər
                                            </h3>
                                        </div>

                                        <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: '32px', textAlign: 'center' }}>
                                                    <p style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</p>
                                                    <p style={{ color: '#a8a29e', fontSize: '13px' }}>Hələ bildiriş yoxdur</p>
                                                </div>
                                            ) : (
                                                notifications.map((n) => (
                                                    <div key={n.id}
                                                         onClick={() => { if (n.postId) navigate(`/posts/${n.postId}`); setNotifOpen(false); }}
                                                         style={{
                                                             padding: '14px 20px',
                                                             borderBottom: `1px solid ${border}`,
                                                             cursor: n.postId ? 'pointer' : 'default',
                                                             backgroundColor: n.read ? bg : (isDark ? '#292524' : '#fffbf7'),
                                                             display: 'flex', gap: '12px', alignItems: 'flex-start'
                                                         }}
                                                         onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDark ? '#44403c' : '#fef3e2')}
                                                         onMouseLeave={e => (e.currentTarget.style.backgroundColor = n.read ? bg : (isDark ? '#292524' : '#fffbf7'))}>
                                                        <span style={{ fontSize: '20px', flexShrink: 0 }}>
                                                            {n.type === 'LIKE' ? '❤️' : '💬'}
                                                        </span>
                                                        <div>
                                                            <p style={{ color: text, fontSize: '13px', lineHeight: 1.5 }}>{n.message}</p>
                                                            <p style={{ color: '#a8a29e', fontSize: '11px', marginTop: '4px' }}>
                                                                {new Date(n.createdAt).toLocaleDateString('az-AZ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mesaj ikonu */}
                            <Link to="/messages"
                                  style={{
                                      position: 'relative', background: 'none',
                                      border: 'none', cursor: 'pointer',
                                      padding: '6px', borderRadius: '10px',
                                      display: 'flex', alignItems: 'center',
                                      textDecoration: 'none',
                                      backgroundColor: 'transparent'
                                  }}>
                                <span style={{ fontSize: '20px' }}>💬</span>
                            </Link>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Link to="/profile"
                                      style={{
                                          backgroundColor: isDark ? '#44403c' : '#fef3e2',
                                          color: '#e07f0a', fontWeight: 600, fontSize: '13px',
                                          padding: '6px 14px', borderRadius: '20px', textDecoration: 'none'
                                      }}>
                                    {user?.username}
                                </Link>
                                <button onClick={toggleTheme}
                                        style={{
                                            background: 'none', border: `1px solid ${border}`,
                                            borderRadius: '10px', padding: '6px 10px',
                                            cursor: 'pointer', fontSize: '16px',
                                            backgroundColor: isDark ? '#44403c' : 'transparent'
                                        }}>
                                    {isDark ? '☀️' : '🌙'}
                                </button>
                                <button onClick={handleLogout}
                                        style={{ color: subtext, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
                                        className="hover:text-red-400 transition">
                                    Çıxış
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <button onClick={toggleTheme}
                                    style={{
                                        background: 'none', border: `1px solid ${border}`,
                                        borderRadius: '10px', padding: '6px 10px',
                                        cursor: 'pointer', fontSize: '16px',
                                        backgroundColor: isDark ? '#44403c' : 'transparent'
                                    }}>
                                {isDark ? '☀️' : '🌙'}
                            </button>
                            <Link to="/login"
                                  style={{ color: subtext, fontSize: '13px', fontWeight: 500 }}
                                  className="hover:text-stone-900 transition">
                                Giriş
                            </Link>
                            <Link to="/register"
                                  style={{
                                      backgroundColor: '#f59e2a', color: '#ffffff',
                                      fontSize: '13px', fontWeight: 600,
                                      padding: '8px 18px', borderRadius: '10px',
                                      textDecoration: 'none'
                                  }}
                                  className="hover:opacity-90 transition">
                                Qeydiyyat
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobil Hamburger */}
                <button className="md:hidden"
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px', borderRadius: '8px',
                            backgroundColor: menuOpen ? (isDark ? '#44403c' : '#fef3e2') : 'transparent'
                        }}>
                    <div style={{ width: '22px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ display: 'block', height: '2px', backgroundColor: text, borderRadius: '2px', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
                        <span style={{ display: 'block', height: '2px', backgroundColor: text, borderRadius: '2px', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
                        <span style={{ display: 'block', height: '2px', backgroundColor: text, borderRadius: '2px', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
                    </div>
                </button>
            </div>

            {/* Mobil Menyu */}
            {menuOpen && (
                <div style={{
                    backgroundColor: bg, borderTop: `1px solid ${border}`,
                    padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px'
                }} className="md:hidden">
                    {/* Xəritə — həmişə görünür */}
                    <Link to="/map" onClick={() => setMenuOpen(false)}
                          style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              color: text, fontSize: '14px', fontWeight: 500,
                              padding: '10px 16px', borderRadius: '12px',
                              textDecoration: 'none',
                              backgroundColor: isDark ? '#44403c' : '#fffbf7',
                              border: `1px solid ${border}`
                          }}>
                        🗺️ Səyahət Xəritəsi
                    </Link>

                    {isAuthenticated ? (
                        <>
                            <Link to="/profile"
                                  style={{
                                      display: 'flex', alignItems: 'center', gap: '8px',
                                      backgroundColor: isDark ? '#44403c' : '#fef3e2',
                                      color: '#e07f0a', fontWeight: 600, fontSize: '13px',
                                      padding: '5px 14px 5px 5px', borderRadius: '20px', textDecoration: 'none'
                                  }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                                    {user?.avatarUrl ? (
                                        <img src={`http://localhost:8080${user.avatarUrl}`}
                                             alt={user.username}
                                             style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f59e2a, #e07f0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {user?.username}
                            </Link>
                            <Link to="/create" onClick={() => setMenuOpen(false)}
                                  style={{
                                      display: 'flex', alignItems: 'center', gap: '10px',
                                      backgroundColor: '#f59e2a', color: '#ffffff',
                                      fontWeight: 600, fontSize: '14px',
                                      padding: '10px 16px', borderRadius: '12px', textDecoration: 'none'
                                  }}>
                                ✏️ Yeni Post
                            </Link>
                            {user?.role === 'ADMIN' && (
                                <Link to="/admin" onClick={() => setMenuOpen(false)}
                                      style={{
                                          display: 'flex', alignItems: 'center', gap: '10px',
                                          color: '#e07f0a', fontSize: '14px', fontWeight: 500,
                                          padding: '10px 16px', borderRadius: '12px',
                                          textDecoration: 'none',
                                          backgroundColor: isDark ? '#44403c' : '#fffbf7',
                                          border: `1px solid ${border}`
                                      }}>
                                    ⚙️ Admin Paneli
                                </Link>
                            )}
                            <button onClick={() => { handleNotifOpen(); setMenuOpen(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        color: text, fontSize: '14px', fontWeight: 500,
                                        padding: '10px 16px', borderRadius: '12px',
                                        background: 'none', border: `1px solid ${border}`,
                                        cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', width: '100%'
                                    }}>
                                🔔 Bildirişlər
                                {unreadCount > 0 && (
                                    <span style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '20px' }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            <Link to="/messages" onClick={() => setMenuOpen(false)}
                                  style={{
                                      display: 'flex', alignItems: 'center', gap: '10px',
                                      color: text, fontSize: '14px', fontWeight: 500,
                                      padding: '10px 16px', borderRadius: '12px',
                                      textDecoration: 'none',
                                      backgroundColor: isDark ? '#44403c' : '#fffbf7',
                                      border: `1px solid ${border}`
                                  }}>
                                💬 Mesajlar
                            </Link>
                            <button onClick={toggleTheme}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        color: subtext, fontSize: '14px', fontWeight: 500,
                                        padding: '10px 16px', borderRadius: '12px',
                                        background: 'none', border: `1px solid ${border}`,
                                        cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', width: '100%'
                                    }}>
                                {isDark ? '☀️' : '🌙'}
                            </button>
                            <button onClick={handleLogout}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        color: '#dc2626', fontSize: '14px', fontWeight: 500,
                                        padding: '10px 16px', borderRadius: '12px',
                                        background: 'none', border: '1px solid #fecaca',
                                        cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', width: '100%'
                                    }}>
                                🚪 Çıxış
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={toggleTheme}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        color: subtext, fontSize: '14px', fontWeight: 500,
                                        padding: '10px 16px', borderRadius: '12px',
                                        background: 'none', border: `1px solid ${border}`,
                                        cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', width: '100%'
                                    }}>
                                {isDark ? '☀️' : '🌙'}
                            </button>
                            <Link to="/login" onClick={() => setMenuOpen(false)}
                                  style={{
                                      display: 'flex', alignItems: 'center', gap: '10px',
                                      color: subtext, fontSize: '14px', fontWeight: 500,
                                      padding: '10px 16px', borderRadius: '12px',
                                      textDecoration: 'none',
                                      backgroundColor: isDark ? '#44403c' : '#fffbf7',
                                      border: `1px solid ${border}`
                                  }}>
                                🔑 Giriş
                            </Link>
                            <Link to="/register" onClick={() => setMenuOpen(false)}
                                  style={{
                                      display: 'flex', alignItems: 'center', gap: '10px',
                                      backgroundColor: '#f59e2a', color: '#ffffff',
                                      fontWeight: 600, fontSize: '14px',
                                      padding: '10px 16px', borderRadius: '12px', textDecoration: 'none'
                                  }}>
                                🌍 Qeydiyyat
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;