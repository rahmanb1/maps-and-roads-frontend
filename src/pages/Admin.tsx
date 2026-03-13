import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import type { Post } from '../types';
import { useTheme } from '../context/ThemeContext';

interface UserAdmin { id: number; username: string; email: string; }
interface Stats { totalUsers: number; totalPosts: number; totalComments: number; }
interface Category { id: number; name: string; icon: string; }
interface ConfirmDialog { open: boolean; message: string; type: 'confirm' | 'success'; onConfirm: () => void; }

const Admin = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const bg = isDark ? '#1c1917' : '#fffbf7';
    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';
    const inputBg = isDark ? '#1c1917' : '#fffbf7';
    const tableHead = isDark ? '#1c1917' : '#fffbf7';
    const tableRow = isDark ? '#292524' : '#ffffff';
    const tableBorder = isDark ? '#44403c' : '#fef3e2';

    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts' | 'categories'>('stats');
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [dialog, setDialog] = useState<ConfirmDialog>({ open: false, message: '', type: 'confirm', onConfirm: () => {} });

    const inputStyle = {
        width: '100%', padding: '12px 16px',
        borderRadius: '12px', border: `1px solid ${border}`,
        backgroundColor: inputBg, color: text,
        fontSize: '14px', outline: 'none',
        fontFamily: 'Segoe UI, sans-serif',
    };

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') { navigate('/'); return; }
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [statsRes, usersRes, postsRes, catRes] = await Promise.all([
                api.get('/admin/stats'), api.get('/admin/users'),
                api.get('/admin/posts'), api.get('/categories'),
            ]);
            setStats(statsRes.data); setUsers(usersRes.data);
            setPosts(postsRes.data); setCategories(catRes.data);
        } catch { console.error('Admin məlumatları yüklənmədi'); }
        finally { setLoading(false); }
    };

    const openDialog = (message: string, onConfirm: () => void, type: 'confirm' | 'success' = 'confirm') =>
        setDialog({ open: true, message, onConfirm, type });
    const closeDialog = () => setDialog({ open: false, message: '', type: 'confirm', onConfirm: () => {} });

    const handleDeleteUser = (id: number) => {
        openDialog('Bu istifadəçini silmək istəyirsiniz?', async () => {
            try { await api.delete(`/admin/users/${id}`); setUsers(prev => prev.filter(u => u.id !== id)); closeDialog(); setTimeout(() => openDialog('İstifadəçi uğurla silindi!', () => closeDialog(), 'success'), 100); }
            catch { console.error('İstifadəçi silinmədi'); closeDialog(); }
        });
    };
    const handleMakeAdmin = async (id: number) => {
        try { await api.put(`/admin/users/${id}/make-admin`); openDialog('İstifadəçi uğurla admin edildi!', () => closeDialog(), 'success'); }
        catch { console.error('Admin edilmədi'); }
    };
    const handleApprovePost = async (id: number) => {
        try { await api.put(`/admin/posts/${id}/approve`); setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p)); openDialog('Post uğurla təsdiqləndi!', () => closeDialog(), 'success'); }
        catch { console.error('Post təsdiqlənmədi'); }
    };
    const handleRejectPost = async (id: number) => {
        try { await api.put(`/admin/posts/${id}/reject`); setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p)); openDialog('Post rədd edildi!', () => closeDialog(), 'success'); }
        catch { console.error('Post rədd edilmədi'); }
    };
    const handleDeletePost = (id: number) => {
        openDialog('Bu postu silmək istəyirsiniz?', async () => {
            try { await api.delete(`/admin/posts/${id}`); setPosts(prev => prev.filter(p => p.id !== id)); closeDialog(); setTimeout(() => openDialog('Post uğurla silindi!', () => closeDialog(), 'success'), 100); }
            catch { console.error('Post silinmədi'); closeDialog(); }
        });
    };
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault(); setCategoryError('');
        if (!newCategoryName.trim()) { setCategoryError('Kateqoriya adı boş ola bilməz'); return; }
        try {
            const response = await api.post('/categories', { name: newCategoryName.trim(), icon: '🌍' });
            setCategories(prev => [...prev, response.data]); setNewCategoryName('');
            openDialog('Kateqoriya uğurla əlavə edildi!', () => closeDialog(), 'success');
        } catch { setCategoryError('Bu kateqoriya artıq mövcuddur'); }
    };
    const handleDeleteCategory = (id: number) => {
        openDialog('Bu kateqoriyanı silmək istəyirsiniz?', async () => {
            try { await api.delete(`/categories/${id}`); setCategories(prev => prev.filter(c => c.id !== id)); closeDialog(); setTimeout(() => openDialog('Kateqoriya uğurla silindi!', () => closeDialog(), 'success'), 100); }
            catch { console.error('Kateqoriya silinmədi'); closeDialog(); }
        });
    };

    if (loading) return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    const tabs = [
        { key: 'stats', label: '📊 Statistika' },
        { key: 'users', label: '👥 İstifadəçilər' },
        { key: 'posts', label: '📝 Postlar' },
        { key: 'categories', label: '🏷️ Kateqoriyalar' },
    ] as const;

    return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: '40px', paddingBottom: '60px', transition: 'background-color 0.3s' }}>

            {/* Dialog */}
            {dialog.open && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '32px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>{dialog.type === 'success' ? '✅' : '⚠️'}</div>
                        <p style={{ color: text, fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>{dialog.message}</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            {dialog.type === 'confirm' && (
                                <button onClick={closeDialog}
                                        style={{ backgroundColor: isDark ? '#44403c' : '#f5f5f4', color: subtext, border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                    Ləğv et
                                </button>
                            )}
                            <button onClick={dialog.type === 'success' ? closeDialog : dialog.onConfirm}
                                    style={{ backgroundColor: dialog.type === 'success' ? '#f59e2a' : '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                {dialog.type === 'success' ? 'Tamam' : 'Təsdiqlə'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>

                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px', marginBottom: '12px' }}>
                        ⚙️ İdarəetmə
                    </div>
                    <h1 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '32px', fontWeight: 700, marginBottom: '6px' }}>Admin Paneli</h1>
                    <p style={{ color: '#a8a29e', fontSize: '14px' }}>Saytı idarə edin</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', backgroundColor: isDark ? '#292524' : '#fef3e2', padding: '4px', borderRadius: '14px', width: 'fit-content', flexWrap: 'wrap' }}>
                    {tabs.map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '8px 20px', borderRadius: '10px', border: 'none',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    fontFamily: 'Segoe UI, sans-serif',
                                    backgroundColor: activeTab === tab.key ? card : 'transparent',
                                    color: activeTab === tab.key ? '#e07f0a' : '#a8a29e',
                                    boxShadow: activeTab === tab.key ? '0 2px 8px rgba(245,158,42,0.15)' : 'none',
                                    transition: 'all 0.2s'
                                }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Statistika */}
                {activeTab === 'stats' && stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {[
                            { label: 'Ümumi İstifadəçi', value: stats.totalUsers, icon: '👥', color: '#3b82f6' },
                            { label: 'Ümumi Post', value: stats.totalPosts, icon: '📝', color: '#f59e2a' },
                            { label: 'Ümumi Şərh', value: stats.totalComments, icon: '💬', color: '#10b981' },
                            { label: 'Kateqoriya', value: categories.length, icon: '🏷️', color: '#8b5cf6' },
                        ].map((item) => (
                            <div key={item.label} style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                                <div style={{ width: '48px', height: '48px', backgroundColor: isDark ? '#44403c' : '#fef3e2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>
                                    {item.icon}
                                </div>
                                <p style={{ color: item.color, fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>{item.value}</p>
                                <p style={{ color: '#a8a29e', fontSize: '13px' }}>{item.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* İstifadəçilər */}
                {activeTab === 'users' && (
                    <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${tableBorder}` }}>
                            <p style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '18px', fontWeight: 700 }}>İstifadəçilər ({users.length})</p>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ backgroundColor: tableHead }}>
                                {['ID', 'İstifadəçi adı', 'Email', 'Əməliyyat'].map(h => (
                                    <th key={h} style={{ color: '#a8a29e', fontSize: '12px', fontWeight: 600, textAlign: 'left', padding: '12px 24px', borderBottom: `1px solid ${tableBorder}` }}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {users.map((u, index) => (
                                <tr key={u.id} style={{ backgroundColor: tableRow, borderBottom: index < users.length - 1 ? `1px solid ${tableBorder}` : 'none' }}>
                                    <td style={{ color: '#a8a29e', fontSize: '13px', padding: '14px 24px' }}>{u.id}</td>
                                    <td style={{ color: text, fontSize: '13px', fontWeight: 600, padding: '14px 24px' }}>{u.username}</td>
                                    <td style={{ color: subtext, fontSize: '13px', padding: '14px 24px' }}>{u.email}</td>
                                    <td style={{ padding: '14px 24px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleMakeAdmin(u.id)}
                                                    style={{ backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                                Admin et
                                            </button>
                                            <button onClick={() => handleDeleteUser(u.id)}
                                                    style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                                Sil
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Postlar */}
                {activeTab === 'posts' && (
                    <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${tableBorder}` }}>
                            <p style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '18px', fontWeight: 700 }}>Postlar ({posts.length})</p>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ backgroundColor: tableHead }}>
                                {['ID', 'Başlıq', 'Müəllif', 'Baxış', 'Əməliyyat'].map(h => (
                                    <th key={h} style={{ color: '#a8a29e', fontSize: '12px', fontWeight: 600, textAlign: 'left', padding: '12px 24px', borderBottom: `1px solid ${tableBorder}` }}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {posts.map((p, index) => (
                                <tr key={p.id} style={{ backgroundColor: tableRow, borderBottom: index < posts.length - 1 ? `1px solid ${tableBorder}` : 'none' }}>
                                    <td style={{ color: '#a8a29e', fontSize: '13px', padding: '14px 24px' }}>{p.id}</td>
                                    <td style={{ color: text, fontSize: '13px', fontWeight: 600, padding: '14px 24px', maxWidth: '240px' }}>
                                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                                    </td>
                                    <td style={{ color: subtext, fontSize: '13px', padding: '14px 24px' }}>{p.username}</td>
                                    <td style={{ color: subtext, fontSize: '13px', padding: '14px 24px' }}>👁️ {p.viewCount}</td>
                                    <td style={{ padding: '14px 24px' }}>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {p.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => handleApprovePost(p.id)}
                                                            style={{ backgroundColor: isDark ? '#14532d' : '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                                        ✓ Təsdiqlə
                                                    </button>
                                                    <button onClick={() => handleRejectPost(p.id)}
                                                            style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                                        ✗ Rədd et
                                                    </button>
                                                </>
                                            )}
                                            {p.status === 'APPROVED' && (
                                                <span style={{ backgroundColor: isDark ? '#14532d' : '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>
                                                    ✓ Təsdiqlənib
                                                </span>
                                            )}
                                            {p.status === 'REJECTED' && (
                                                <span style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>
                                                    ✗ Rədd edilib
                                                </span>
                                            )}
                                            <button onClick={() => handleDeletePost(p.id)}
                                                    style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                                Sil
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Kateqoriyalar */}
                {activeTab === 'categories' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>➕ Yeni Kateqoriya</h3>
                            {categoryError && (
                                <div style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>
                                    {categoryError}
                                </div>
                            )}
                            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '160px' }}>
                                    <label style={{ color: isDark ? '#a8a29e' : '#44403c', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Kateqoriya adı</label>
                                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} style={inputStyle} placeholder="Məsələn: Avropa" />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button type="submit" style={{ backgroundColor: '#f59e2a', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', whiteSpace: 'nowrap' }}>
                                        Əlavə et
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${tableBorder}` }}>
                                <p style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '18px', fontWeight: 700 }}>Kateqoriyalar ({categories.length})</p>
                            </div>
                            {categories.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <p style={{ fontSize: '32px', marginBottom: '8px' }}>🏷️</p>
                                    <p style={{ color: '#a8a29e', fontSize: '14px' }}>Hələ kateqoriya yoxdur</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr style={{ backgroundColor: tableHead }}>
                                        {['ID', 'İkon', 'Ad', 'Əməliyyat'].map(h => (
                                            <th key={h} style={{ color: '#a8a29e', fontSize: '12px', fontWeight: 600, textAlign: 'left', padding: '12px 24px', borderBottom: `1px solid ${tableBorder}` }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {categories.map((cat, index) => (
                                        <tr key={cat.id} style={{ backgroundColor: tableRow, borderBottom: index < categories.length - 1 ? `1px solid ${tableBorder}` : 'none' }}>
                                            <td style={{ color: '#a8a29e', fontSize: '13px', padding: '14px 24px' }}>{cat.id}</td>
                                            <td style={{ fontSize: '22px', padding: '14px 24px' }}>{cat.icon}</td>
                                            <td style={{ color: text, fontSize: '13px', fontWeight: 600, padding: '14px 24px' }}>{cat.name}</td>
                                            <td style={{ padding: '14px 24px' }}>
                                                <button onClick={() => handleDeleteCategory(cat.id)}
                                                        style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;