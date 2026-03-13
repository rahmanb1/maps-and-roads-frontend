import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import PostCard from '../components/PostCard';
import type { Post } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Helmet } from 'react-helmet-async';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Nominatim-dən polygon gətir
async function fetchPolygon(location: string): Promise<[number, number][][] | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&polygon_geojson=1&limit=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'az,en' } });
        const data = await res.json();
        if (!data || data.length === 0) return null;
        const geo = data[0].geojson;
        if (!geo) return null;
        const toLatLng = (coords: number[]): [number, number] => [coords[1], coords[0]];
        if (geo.type === 'Polygon') return [geo.coordinates[0].map(toLatLng)];
        if (geo.type === 'MultiPolygon') return geo.coordinates.map((poly: number[][][]) => poly[0].map(toLatLng));
        return null;
    } catch { return null; }
}

const FlyToMarker = ({ post }: { post: MapPost | null }) => {
    const map = useMap();
    useEffect(() => {
        if (post) map.flyTo([post.latitude, post.longitude], 10, { duration: 1.2 });
    }, [post]);
    return null;
};

interface ProfileData {
    id: number;
    username: string;
    email: string;
    role: string;
    bio: string;
    instagramUrl: string;
    xUrl: string;
    avatarUrl: string;
    totalPosts: number;
    totalLikes: number;
    totalViews: number;
    posts: Post[];
}

interface MapPost {
    id: number;
    title: string;
    location: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
}

const Profile = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'map'>('posts');
    const [bookmarks, setBookmarks] = useState<Post[]>([]);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);
    const [mapPosts, setMapPosts] = useState<MapPost[]>([]);
    const [mapLoading, setMapLoading] = useState(false);
    const [selectedMapPost, setSelectedMapPost] = useState<MapPost | null>(null);
    const [polygon, setPolygon] = useState<[number, number][][] | null>(null);
    const [polygonLoading, setPolygonLoading] = useState(false);
    const polygonCache = useRef<Record<string, [number, number][][] | null>>({});
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newBio, setNewBio] = useState('');
    const [newInstagram, setNewInstagram] = useState('');
    const [newX, setNewX] = useState('');
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const bg = isDark ? '#1c1917' : '#fffbf7';
    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#44403c';
    const inputBg = isDark ? '#1c1917' : '#fffbf7';
    const statBg = isDark ? '#1c1917' : '#fffbf7';

    const inputStyle = {
        width: '100%', padding: '12px 16px',
        borderRadius: '12px', border: `1px solid ${border}`,
        backgroundColor: inputBg, color: text,
        fontSize: '14px', outline: 'none',
        fontFamily: 'Segoe UI, sans-serif',
    };

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return; }
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'bookmarks') fetchBookmarks();
        if (activeTab === 'map') fetchMapPosts();
    }, [activeTab]);

    useEffect(() => {
        if (!selectedMapPost?.location) { setPolygon(null); return; }
        const loc = selectedMapPost.location;
        if (loc in polygonCache.current) { setPolygon(polygonCache.current[loc]); return; }
        setPolygonLoading(true);
        fetchPolygon(loc).then(result => {
            polygonCache.current[loc] = result;
            setPolygon(result);
            setPolygonLoading(false);
        });
    }, [selectedMapPost]);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me');
            setProfile(response.data);
        } catch { console.error('Profil yüklənmədi'); }
        finally { setLoading(false); }
    };

    const fetchBookmarks = async () => {
        setBookmarksLoading(true);
        try {
            const response = await api.get('/bookmarks');
            setBookmarks(response.data);
        } catch { console.error('Bookmarklar yüklənmədi'); }
        finally { setBookmarksLoading(false); }
    };

    const fetchMapPosts = async () => {
        if (!profile) return;
        setMapLoading(true);
        try {
            const response = await api.get(`/posts/map/${profile.username}`);
            setMapPosts(response.data);
        } catch { console.error('Xəritə postları yüklənmədi'); }
        finally { setMapLoading(false); }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newAvatarUrl = response.data.avatarUrl;
            setProfile(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : prev);
            localStorage.setItem('avatarUrl', newAvatarUrl);
            window.dispatchEvent(new Event('storage'));
        } catch { console.error('Avatar yüklənmədi'); }
        finally { setAvatarUploading(false); }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError(''); setEditSuccess('');
        if (newUsername.length < 3) {
            setEditError('İstifadəçi adı minimum 3 simvol olmalıdır');
            return;
        }
        setEditLoading(true);
        try {
            await api.put('/users/me', {
                username: newUsername,
                bio: newBio,
                instagramUrl: newInstagram,
                xUrl: newX,
            });
            setEditSuccess('Profil yeniləndi!');
            setProfile(prev => prev ? { ...prev, username: newUsername, bio: newBio, instagramUrl: newInstagram, xUrl: newX } : prev);
            setTimeout(() => { setShowEditForm(false); setEditSuccess(''); }, 2000);
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { error?: string } } };
            setEditError(axiosError.response?.data?.error || 'Xəta baş verdi');
        } finally { setEditLoading(false); }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(''); setPasswordSuccess('');
        if (newPassword.length < 8) { setPasswordError('Yeni şifrə minimum 8 simvol olmalıdır'); return; }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            setPasswordError('Şifrədə ən azı 1 xüsusi simvol olmalıdır'); return;
        }
        setPasswordLoading(true);
        try {
            await api.put('/users/me/change-password', { currentPassword, newPassword });
            setPasswordSuccess('Şifrə uğurla dəyişdirildi!');
            setCurrentPassword(''); setNewPassword('');
            setTimeout(() => { setShowPasswordForm(false); setPasswordSuccess(''); }, 2000);
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { error?: string } } };
            setPasswordError(axiosError.response?.data?.error || 'Xəta baş verdi');
        } finally { setPasswordLoading(false); }
    };

    if (loading) return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    if (!profile) return null;

    // Xəritə mərkəzi — ilk məkanlı postun koordinatı
    const mapCenter: [number, number] = mapPosts.length > 0
        ? [mapPosts[0].latitude, mapPosts[0].longitude]
        : [40.4093, 49.8671];

    return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: '40px', paddingBottom: '60px', transition: 'background-color 0.3s' }}>
            <Helmet>
                <title>{profile.username} — Profil | TravelBlog</title>
                <meta name="robots" content="noindex" />
            </Helmet>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>

                {/* Profil Kartı */}
                <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>

                            {/* Avatar */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div
                                    onClick={() => avatarInputRef.current?.click()}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', position: 'relative', boxShadow: '0 4px 12px rgba(245,158,42,0.35)' }}>
                                    {profile.avatarUrl ? (
                                        <img src={profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : `https://maps-and-roads-backend-production.up.railway.app${profile.avatarUrl}`} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f59e2a, #e07f0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>
                                            {profile.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', fontSize: '20px' }}
                                         onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                         onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                                        {avatarUploading ? '⏳' : '📷'}
                                    </div>
                                </div>
                                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                                <div onClick={() => avatarInputRef.current?.click()}
                                     style={{ position: 'absolute', bottom: '0', right: '0', width: '24px', height: '24px', backgroundColor: '#f59e2a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', border: `2px solid ${card}`, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                                    📷
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                    <h1 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '24px', fontWeight: 700 }}>{profile.username}</h1>
                                    {profile.role === 'ADMIN' && (
                                        <span style={{ backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px' }}>⚙️ Admin</span>
                                    )}
                                </div>
                                <p style={{ color: '#a8a29e', fontSize: '14px', marginBottom: '8px' }}>✉️ {profile.email}</p>
                                {profile.bio && (
                                    <p style={{ color: subtext, fontSize: '13px', lineHeight: 1.6, marginBottom: '10px', maxWidth: '420px' }}>{profile.bio}</p>
                                )}
                                {(profile.instagramUrl || profile.xUrl) && (
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {profile.instagramUrl && (
                                            <a href={profile.instagramUrl.startsWith('http') ? profile.instagramUrl : `https://instagram.com/${profile.instagramUrl}`}
                                               target="_blank" rel="noopener noreferrer"
                                               style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px', border: `1px solid ${border}`, textDecoration: 'none' }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                                    <circle cx="12" cy="12" r="4"/>
                                                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                                                </svg>
                                                Instagram
                                            </a>
                                        )}
                                        {profile.xUrl && (
                                            <a href={profile.xUrl.startsWith('http') ? profile.xUrl : `https://x.com/${profile.xUrl}`}
                                               target="_blank" rel="noopener noreferrer"
                                               style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: isDark ? '#44403c' : '#fef3e2', color: isDark ? '#e7e5e4' : '#1c1917', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px', border: `1px solid ${border}`, textDecoration: 'none' }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                                </svg>
                                                X
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Düymələr */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button onClick={() => {
                                setShowEditForm(!showEditForm);
                                setNewUsername(profile.username);
                                setNewBio(profile.bio || '');
                                setNewInstagram(profile.instagramUrl || '');
                                setNewX(profile.xUrl || '');
                                setEditError(''); setEditSuccess('');
                                if (showPasswordForm) setShowPasswordForm(false);
                            }}
                                    style={{ backgroundColor: showEditForm ? (isDark ? '#3b1f1f' : '#fef2f2') : (isDark ? '#44403c' : '#fef3e2'), color: showEditForm ? '#dc2626' : '#e07f0a', border: `1px solid ${showEditForm ? '#fecaca' : border}`, borderRadius: '12px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                {showEditForm ? 'Ləğv et' : '✏️ Profili dəyişdir'}
                            </button>
                            <button onClick={() => {
                                setShowPasswordForm(!showPasswordForm);
                                setPasswordError(''); setPasswordSuccess('');
                                if (showEditForm) setShowEditForm(false);
                            }}
                                    style={{ backgroundColor: showPasswordForm ? (isDark ? '#3b1f1f' : '#fef2f2') : (isDark ? '#44403c' : '#fef3e2'), color: showPasswordForm ? '#dc2626' : '#e07f0a', border: `1px solid ${showPasswordForm ? '#fecaca' : border}`, borderRadius: '12px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                {showPasswordForm ? 'Ləğv et' : '🔑 Şifrə dəyişdir'}
                            </button>
                        </div>
                    </div>

                    {/* Profil Edit Formu */}
                    {showEditForm && (
                        <div style={{ backgroundColor: statBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
                            <h3 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>✏️ Profili Dəyişdir</h3>
                            {editError && <div style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>{editError}</div>}
                            {editSuccess && <div style={{ backgroundColor: isDark ? '#14532d' : '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>{editSuccess}</div>}
                            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>İstifadəçi adı</label>
                                    <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={inputStyle} placeholder="istifadeci_adi" required />
                                </div>
                                <div>
                                    <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Bio</label>
                                    <textarea value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={3} maxLength={300} placeholder="Özünüz haqqında qısa məlumat..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                                    <p style={{ color: '#a8a29e', fontSize: '11px', marginTop: '4px' }}>{newBio.length}/300</p>
                                </div>
                                <div>
                                    <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Instagram</label>
                                    <input type="text" value={newInstagram} onChange={(e) => setNewInstagram(e.target.value)} style={inputStyle} placeholder="username və ya tam link" />
                                </div>
                                <div>
                                    <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>𝕏 X (formerly Twitter)</label>
                                    <input type="text" value={newX} onChange={(e) => setNewX(e.target.value)} style={inputStyle} placeholder="username və ya tam link" />
                                </div>
                                <button type="submit" disabled={editLoading}
                                        style={{ backgroundColor: '#f59e2a', color: '#ffffff', padding: '12px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: editLoading ? 'not-allowed' : 'pointer', opacity: editLoading ? 0.7 : 1, fontFamily: 'Segoe UI, sans-serif' }}>
                                    {editLoading ? 'Yüklənir...' : 'Yadda saxla'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Şifrə Dəyişdir Formu */}
                    {showPasswordForm && (
                        <div style={{ backgroundColor: statBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
                            <h3 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>🔑 Şifrəni Dəyişdir</h3>
                            {passwordError && <div style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>{passwordError}</div>}
                            {passwordSuccess && <div style={{ backgroundColor: isDark ? '#14532d' : '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>{passwordSuccess}</div>}
                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Cari Şifrə</label>
                                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle} placeholder="••••••••" required />
                                </div>
                                <div>
                                    <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Yeni Şifrə</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="••••••••" required />
                                    <p style={{ color: '#a8a29e', fontSize: '11px', marginTop: '4px' }}>Minimum 8 simvol, ən azı 1 xüsusi simvol (!@#$%^&*)</p>
                                </div>
                                <button type="submit" disabled={passwordLoading}
                                        style={{ backgroundColor: '#f59e2a', color: '#ffffff', padding: '12px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: passwordLoading ? 'not-allowed' : 'pointer', opacity: passwordLoading ? 0.7 : 1, fontFamily: 'Segoe UI, sans-serif' }}>
                                    {passwordLoading ? 'Yüklənir...' : 'Dəyişdir'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Statistika */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[
                            { label: 'Post', value: profile.totalPosts, icon: '📝' },
                            { label: 'Bəyənmə', value: profile.totalLikes, icon: '❤️' },
                            { label: 'Baxış', value: profile.totalViews, icon: '👁️' },
                        ].map((item) => (
                            <div key={item.label} style={{ backgroundColor: statBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                                <p style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</p>
                                <p style={{ color: '#f59e2a', fontSize: '24px', fontWeight: 700, marginBottom: '2px' }}>{item.value}</p>
                                <p style={{ color: '#a8a29e', fontSize: '12px' }}>{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tab-lar */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: isDark ? '#292524' : '#fef3e2', padding: '4px', borderRadius: '14px', width: 'fit-content' }}>
                    {[
                        { key: 'posts', label: '📝 Mənim Postlarım' },
                        { key: 'bookmarks', label: '🔖 Saxlanmışlar' },
                        { key: 'map', label: '🗺️ Xəritəm' },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as 'posts' | 'bookmarks' | 'map')}
                                style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', backgroundColor: activeTab === tab.key ? card : 'transparent', color: activeTab === tab.key ? '#e07f0a' : '#a8a29e', boxShadow: activeTab === tab.key ? '0 2px 8px rgba(245,158,42,0.15)' : 'none', transition: 'all 0.2s' }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Mənim Postlarım */}
                {activeTab === 'posts' && (
                    <div>
                        <h2 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                            Mənim Postlarım ({profile.totalPosts})
                        </h2>
                        {profile.posts.length === 0 ? (
                            <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                                <p style={{ fontSize: '40px', marginBottom: '12px' }}>✍️</p>
                                <p style={{ color: text, fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Hələ heç bir post yoxdur</p>
                                <p style={{ color: '#a8a29e', fontSize: '14px', marginBottom: '20px' }}>İlk səyahət hekayənizi paylaşın!</p>
                                <button onClick={() => navigate('/create')}
                                        style={{ backgroundColor: '#f59e2a', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                    + Yeni Post
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                {profile.posts.map((post) => (
                                    <div key={post.id} style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backgroundColor: post.status === 'APPROVED' ? (isDark ? '#14532d' : '#f0fdf4') : post.status === 'REJECTED' ? (isDark ? '#3b1f1f' : '#fef2f2') : (isDark ? '#44403c' : '#fef3e2'), color: post.status === 'APPROVED' ? '#16a34a' : post.status === 'REJECTED' ? '#dc2626' : '#e07f0a' }}>
                                            {post.status === 'APPROVED' ? '✓ Təsdiqlənib' : post.status === 'REJECTED' ? '✗ Rədd edilib' : '⏳ Gözləyir'}
                                        </div>
                                        <PostCard post={post} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Saxlanmışlar */}
                {activeTab === 'bookmarks' && (
                    <div>
                        <h2 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                            Saxlanmışlar ({bookmarks.length})
                        </h2>
                        {bookmarksLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                                <div style={{ width: '36px', height: '36px', border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            </div>
                        ) : bookmarks.length === 0 ? (
                            <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔖</p>
                                <p style={{ color: text, fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Saxlanmış post yoxdur</p>
                                <p style={{ color: '#a8a29e', fontSize: '14px' }}>Bəyəndiyiniz postları saxlayın!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                {bookmarks.map((post) => (<PostCard key={post.id} post={post} />))}
                            </div>
                        )}
                    </div>
                )}

                {/* Xəritəm */}
                {activeTab === 'map' && (
                    <div>
                        <h2 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                            🗺️ Səyahət Xəritəm
                        </h2>
                        <p style={{ color: '#a8a29e', fontSize: '13px', marginBottom: '20px' }}>
                            Getdiyiniz {mapPosts.length} məkan xəritədə göstərilir
                        </p>

                        {mapLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                                <div style={{ width: '36px', height: '36px', border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            </div>
                        ) : mapPosts.length === 0 ? (
                            <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</p>
                                <p style={{ color: text, fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Hələ heç bir məkan yoxdur</p>
                                <p style={{ color: '#a8a29e', fontSize: '14px', marginBottom: '20px' }}>Post yazarkən məkan əlavə edin!</p>
                                <button onClick={() => navigate('/create')}
                                        style={{ backgroundColor: '#f59e2a', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                    + Yeni Post
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', height: '500px', border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                                {/* Sol panel */}
                                <div style={{ width: '240px', flexShrink: 0, backgroundColor: card, borderRight: `1px solid ${border}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, backgroundColor: card, zIndex: 1 }}>
                                        <p style={{ color: subtext, fontSize: '11px', fontWeight: 600 }}>{mapPosts.length} məkan</p>
                                    </div>
                                    {mapPosts.map(post => (
                                        <div key={post.id} onClick={() => setSelectedMapPost(post)}
                                             style={{
                                                 padding: '10px 14px', borderBottom: `1px solid ${border}`, cursor: 'pointer',
                                                 backgroundColor: selectedMapPost?.id === post.id ? (isDark ? '#3a2e1e' : '#fef3e2') : 'transparent',
                                                 borderLeft: selectedMapPost?.id === post.id ? '3px solid #f59e2a' : '3px solid transparent',
                                                 transition: 'background-color 0.15s',
                                             }}>
                                            <p style={{ color: text, fontSize: '12px', fontWeight: 600, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
                                            {post.location && (
                                                <p style={{ color: '#f59e2a', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    📍 {post.location}
                                                    {polygonLoading && selectedMapPost?.id === post.id && <span style={{ color: '#a8a29e', marginLeft: '4px' }}>↻</span>}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Xəritə */}
                                <div style={{ flex: 1 }}>
                                    <MapContainer center={mapCenter} zoom={4} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                        <FlyToMarker post={selectedMapPost} />
                                        {polygon && polygon.map((ring, i) => (
                                            <Polygon key={i} positions={ring} pathOptions={{ color: '#f59e2a', fillColor: '#22c55e', fillOpacity: 0.25, weight: 2, opacity: 0.8 }} />
                                        ))}
                                        {mapPosts.map((post) => (
                                            <Marker key={post.id} position={[post.latitude, post.longitude]}
                                                    eventHandlers={{ click: () => setSelectedMapPost(post) }}>
                                                <Popup>
                                                    <div style={{ minWidth: '180px' }}>
                                                        {post.imageUrl && (
                                                            <img src={post.imageUrl?.startsWith("http") ? post.imageUrl : `https://maps-and-roads-backend-production.up.railway.app${post.imageUrl}`}
                                                                 alt={post.title} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                                                        )}
                                                        <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#1c1917' }}>{post.title}</p>
                                                        {post.location && <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '8px' }}>📍 {post.location}</p>}
                                                        <a href={`/posts/${post.id}`} style={{ display: 'block', backgroundColor: '#f59e2a', color: '#fff', textAlign: 'center', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>
                                                            Oxu →
                                                        </a>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;