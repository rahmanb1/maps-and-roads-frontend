import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import MDEditor from '@uiw/react-md-editor';
import { useTheme } from '../context/ThemeContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Category { id: number; name: string; icon: string; }
interface LatLng { lat: number; lng: number; }

const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (latlng: LatLng) => void }) => {
    useMapEvents({ click(e) { onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
    return null;
};

const EditPost = () => {
    const { id } = useParams<{ id: string }>();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [location, setLocation] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
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
        boxSizing: 'border-box' as const,
    };

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return; }
        const fetchData = async () => {
            try {
                const [postRes, catRes] = await Promise.all([
                    api.get(`/posts/${id}`),
                    api.get('/categories')
                ]);
                setTitle(postRes.data.title);
                setContent(postRes.data.content);
                setLocation(postRes.data.location || '');
                setImageUrl(postRes.data.imageUrl || null);
                if (postRes.data.imageUrl) setPreview(`http://localhost:8080${postRes.data.imageUrl}`);
                if (postRes.data.categoryId) setCategoryId(postRes.data.categoryId);
                // Mövcud koordinatları yüklə
                if (postRes.data.latitude && postRes.data.longitude) {
                    setLatitude(postRes.data.latitude);
                    setLongitude(postRes.data.longitude);
                    setShowMap(true);
                }
                setCategories(catRes.data);
            } catch { console.error('Məlumatlar yüklənmədi'); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [id, isAuthenticated]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
    };

    const handleImageUpload = async (): Promise<string | null> => {
        if (!image) return imageUrl;
        const formData = new FormData();
        formData.append('file', image);
        try {
            const response = await api.post('/images/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            return response.data.imageUrl;
        } catch { return imageUrl; }
    };

    const geocodeLocation = async (locationName: string) => {
        if (!locationName.trim()) return;
        setGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
                { headers: { 'Accept-Language': 'az' } }
            );
            const data = await res.json();
            if (data && data.length > 0) {
                setLatitude(parseFloat(data[0].lat));
                setLongitude(parseFloat(data[0].lon));
                setShowMap(true);
            }
        } catch { console.error('Geocoding xətası'); }
        finally { setGeocoding(false); }
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocation(val);
        if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
        if (val.trim().length > 2) {
            geocodeTimer.current = setTimeout(() => geocodeLocation(val), 1000);
        }
    };

    const handleMapClick = async (latlng: LatLng) => {
        setLatitude(latlng.lat);
        setLongitude(latlng.lng);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`,
                { headers: { 'Accept-Language': 'az' } }
            );
            const data = await res.json();
            if (data?.display_name) {
                const parts = data.display_name.split(',');
                setLocation(parts.slice(0, 2).join(',').trim());
            }
        } catch { console.error('Reverse geocoding xətası'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSaving(true);
        try {
            const newImageUrl = await handleImageUpload();
            await api.put(`/posts/${id}`, {
                title, content, location, imageUrl: newImageUrl, categoryId,
                latitude, longitude
            });
            navigate(`/posts/${id}`);
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Post yenilənmədi');
        } finally { setSaving(false); }
    };

    const handleEditorImageUpload = async () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await api.post('/images/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                const url = `http://localhost:8080${response.data.imageUrl}`;
                setContent((prev) => prev + `\n![image](${url})\n`);
            } catch { console.error('Şəkil yüklənmədi'); }
        };
        input.click();
    };

    if (loading) return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: '40px', paddingBottom: '60px', transition: 'background-color 0.3s' }}>
            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px' }}>

                <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px', marginBottom: '12px' }}>
                        ✏️ Redaktə
                    </div>
                    <h1 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '32px', fontWeight: 700, marginBottom: '6px' }}>Postu Dəyişdir</h1>
                    <p style={{ color: '#a8a29e', fontSize: '14px' }}>Məlumatları yeniləyin</p>
                </div>

                <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                    {error && (
                        <div style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', marginBottom: '20px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        <div>
                            <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Başlıq</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Başlıq" required />
                        </div>

                        {/* Məkan + Xəritə */}
                        <div>
                            <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                📍 Məkan
                                {geocoding && <span style={{ color: '#a8a29e', fontWeight: 400, marginLeft: '8px' }}>axtarılır...</span>}
                                {latitude && longitude && <span style={{ color: '#22c55e', fontWeight: 400, marginLeft: '8px' }}>✓ tapıldı</span>}
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={handleLocationChange}
                                style={inputStyle}
                                placeholder="Məsələn: Bakı, Azərbaycan"
                            />
                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setShowMap(!showMap)}
                                        style={{ backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a', border: `1px solid ${border}`, borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                    🗺️ {showMap ? 'Xəritəni gizlət' : 'Xəritədə seç'}
                                </button>
                                {latitude && longitude && (
                                    <button type="button" onClick={() => { setLatitude(null); setLongitude(null); setShowMap(false); }}
                                            style={{ backgroundColor: 'transparent', color: '#a8a29e', border: `1px solid ${border}`, borderRadius: '10px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                        ✕ Məkanı sil
                                    </button>
                                )}
                            </div>
                            {showMap && (
                                <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${border}`, height: '300px' }}>
                                    <MapContainer
                                        center={latitude && longitude ? [latitude, longitude] : [40.4093, 49.8671]}
                                        zoom={latitude && longitude ? 12 : 6}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                        <MapClickHandler onLocationSelect={handleMapClick} />
                                        {latitude && longitude && <Marker position={[latitude, longitude]} />}
                                    </MapContainer>
                                </div>
                            )}
                        </div>

                        {/* Kateqoriya */}
                        <div>
                            <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>🏷️ Kateqoriya</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <button type="button" onClick={() => setCategoryId(null)}
                                        style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${categoryId === null ? '#f59e2a' : border}`, backgroundColor: categoryId === null ? (isDark ? '#44403c' : '#fef3e2') : inputBg, color: categoryId === null ? '#e07f0a' : '#a8a29e', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                    Yoxdur
                                </button>
                                {categories.map((cat) => (
                                    <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                                            style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${categoryId === cat.id ? '#f59e2a' : border}`, backgroundColor: categoryId === cat.id ? (isDark ? '#44403c' : '#fef3e2') : inputBg, color: categoryId === cat.id ? '#e07f0a' : '#a8a29e', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                        {cat.icon} {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Hekayə */}
                        <div>
                            <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Hekayə</label>
                            <div style={{ marginBottom: '8px' }}>
                                <button type="button" onClick={handleEditorImageUpload}
                                        style={{ backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a', border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    🖼️ Mətnə şəkil əlavə et
                                </button>
                            </div>
                            <div data-color-mode={isDark ? 'dark' : 'light'}>
                                <MDEditor value={content} onChange={(val) => setContent(val || '')} preview="edit" height={300} />
                            </div>
                        </div>

                        {/* Şəkil */}
                        <div>
                            <label style={{ color: subtext, fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>🖼️ Şəkil</label>
                            {preview && (
                                <div style={{ marginBottom: '12px', borderRadius: '12px', overflow: 'hidden', height: '200px', backgroundColor: isDark ? '#44403c' : '#fef3e2' }}>
                                    <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                </div>
                            )}
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', borderRadius: '12px', border: `2px dashed ${border}`, backgroundColor: inputBg, cursor: 'pointer', gap: '6px' }}>
                                <span style={{ fontSize: '24px' }}>📷</span>
                                <span style={{ color: '#a8a29e', fontSize: '13px' }}>{preview ? 'Şəkli dəyişmək üçün klikləyin' : 'Şəkil seçin'}</span>
                                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={() => navigate(`/posts/${id}`)}
                                    style={{ flex: 1, backgroundColor: isDark ? '#44403c' : '#f5f5f4', color: isDark ? '#e7e5e4' : '#78716c', padding: '13px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                Ləğv et
                            </button>
                            <button type="submit" disabled={saving}
                                    style={{ flex: 1, backgroundColor: '#f59e2a', color: '#ffffff', padding: '13px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'Segoe UI, sans-serif' }}>
                                {saving ? 'Saxlanılır...' : 'Saxla →'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditPost;