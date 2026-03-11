import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { Helmet } from 'react-helmet-async';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPost {
    id: number;
    title: string;
    location: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    username: string;
    categoryName: string;
    categoryIcon: string;
}

// Xəritəni seçilmiş postun üzərinə aparan komponent
const FlyToMarker = ({ post }: { post: MapPost | null }) => {
    const map = useMap();
    useEffect(() => {
        if (post) {
            map.flyTo([post.latitude, post.longitude], 10, { duration: 1.2 });
        }
    }, [post]);
    return null;
};

const TravelMap = () => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<MapPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<MapPost | null>(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const bg = isDark ? '#1c1917' : '#fffbf7';
    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';

    useEffect(() => {
        fetchMapPosts();
    }, []);

    const fetchMapPosts = async () => {
        try {
            const res = await api.get('/posts/map');
            setPosts(Array.isArray(res.data) ? res.data : []);
        } catch { console.error('Xəritə postları yüklənmədi'); }
        finally { setLoading(false); }
    };

    // Unikal kateqoriyalar
    const categories = Array.from(
        new Map(
            posts
                .filter(p => p.categoryName)
                .map(p => [p.categoryName, { name: p.categoryName, icon: p.categoryIcon }])
        ).values()
    );

    // Filter
    const filteredPosts = posts.filter(p => {
        const matchSearch = search.trim() === '' ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.location?.toLowerCase().includes(search.toLowerCase()) ||
            p.username.toLowerCase().includes(search.toLowerCase());
        const matchCat = activeCategory === null || p.categoryName === activeCategory;
        return matchSearch && matchCat;
    });

    const mapCenter: [number, number] = [20, 10];

    return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', transition: 'background-color 0.3s' }}>
            <Helmet>
                <title>Səyahət Xəritəsi | Maps & Roads</title>
                <meta name="description" content="Bütün səyahətçilərin getdiyi məkanlar xəritədə" />
            </Helmet>

            {/* Header */}
            <div style={{ padding: '32px 24px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a',
                            fontSize: '12px', fontWeight: 600, padding: '5px 12px',
                            borderRadius: '20px', marginBottom: '10px'
                        }}>
                            🌍 Dünya Xəritəsi
                        </div>
                        <h1 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                            Səyahət Xəritəsi
                        </h1>
                        <p style={{ color: subtext, fontSize: '14px' }}>
                            {posts.length} məkan — {new Set(posts.map(p => p.username)).size} səyahətçi
                        </p>
                    </div>

                    {/* Axtarış */}
                    <div style={{ position: 'relative', minWidth: '260px' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Məkan, post, istifadəçi..."
                            style={{
                                width: '100%', padding: '10px 16px 10px 40px',
                                borderRadius: '12px', border: `1px solid ${border}`,
                                backgroundColor: card, color: text,
                                fontSize: '14px', outline: 'none',
                                fontFamily: 'Segoe UI, sans-serif',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* Kateqoriya filterləri */}
                {categories.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <button
                            onClick={() => setActiveCategory(null)}
                            style={{
                                padding: '6px 14px', borderRadius: '20px', border: `1px solid ${activeCategory === null ? '#f59e2a' : border}`,
                                backgroundColor: activeCategory === null ? (isDark ? '#44403c' : '#fef3e2') : 'transparent',
                                color: activeCategory === null ? '#e07f0a' : subtext,
                                fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif'
                            }}>
                            Hamısı ({posts.length})
                        </button>
                        {categories.map(cat => {
                            const count = posts.filter(p => p.categoryName === cat.name).length;
                            return (
                                <button
                                    key={cat.name}
                                    onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '20px', border: `1px solid ${activeCategory === cat.name ? '#f59e2a' : border}`,
                                        backgroundColor: activeCategory === cat.name ? (isDark ? '#44403c' : '#fef3e2') : 'transparent',
                                        color: activeCategory === cat.name ? '#e07f0a' : subtext,
                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif'
                                    }}>
                                    {cat.icon} {cat.name} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Əsas məzmun */}
            <div style={{ display: 'flex', gap: '0', maxWidth: '1200px', margin: '0 auto', padding: '0 24px 40px', height: '560px' }}>

                {/* Sol panel — post siyahısı */}
                <div style={{
                    width: '300px', flexShrink: 0,
                    backgroundColor: card, border: `1px solid ${border}`,
                    borderRadius: '16px 0 0 16px', overflowY: 'auto',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '16px', borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, backgroundColor: card, zIndex: 1 }}>
                        <p style={{ color: subtext, fontSize: '12px', fontWeight: 600 }}>
                            {filteredPosts.length} məkan tapıldı
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                            <div style={{ width: '32px', height: '32px', border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center' }}>
                            <p style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</p>
                            <p style={{ color: subtext, fontSize: '13px' }}>Heç bir məkan tapılmadı</p>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => setSelectedPost(post)}
                                style={{
                                    padding: '14px 16px',
                                    borderBottom: `1px solid ${border}`,
                                    cursor: 'pointer',
                                    backgroundColor: selectedPost?.id === post.id
                                        ? (isDark ? '#3a2e1e' : '#fef3e2')
                                        : 'transparent',
                                    transition: 'background-color 0.15s',
                                    borderLeft: selectedPost?.id === post.id ? '3px solid #f59e2a' : '3px solid transparent',
                                }}
                                onMouseEnter={e => {
                                    if (selectedPost?.id !== post.id)
                                        (e.currentTarget as HTMLDivElement).style.backgroundColor = isDark ? '#2a2523' : '#fffbf7';
                                }}
                                onMouseLeave={e => {
                                    if (selectedPost?.id !== post.id)
                                        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                                }}
                            >
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    {post.imageUrl ? (
                                        <img
                                            src={`http://localhost:8080${post.imageUrl}`}
                                            alt={post.title}
                                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                                        />
                                    ) : (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: isDark ? '#44403c' : '#fef3e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                                            📍
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ color: text, fontSize: '13px', fontWeight: 600, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {post.title}
                                        </p>
                                        {post.location && (
                                            <p style={{ color: '#f59e2a', fontSize: '11px', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                📍 {post.location}
                                            </p>
                                        )}
                                        <p style={{ color: subtext, fontSize: '11px' }}>
                                            @{post.username}
                                            {post.categoryName && <span style={{ marginLeft: '6px' }}>{post.categoryIcon} {post.categoryName}</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Xəritə */}
                <div style={{ flex: 1, borderRadius: '0 16px 16px 0', overflow: 'hidden', border: `1px solid ${border}`, borderLeft: 'none' }}>
                    <MapContainer center={mapCenter} zoom={2} style={{ height: '100%', width: '100%' }} worldCopyJump>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap'
                        />
                        <FlyToMarker post={selectedPost} />
                        {filteredPosts.map(post => (
                            <Marker
                                key={post.id}
                                position={[post.latitude, post.longitude]}
                                eventHandlers={{ click: () => setSelectedPost(post) }}
                            >
                                <Popup>
                                    <div style={{ minWidth: '200px' }}>
                                        {post.imageUrl && (
                                            <img
                                                src={`http://localhost:8080${post.imageUrl}`}
                                                alt={post.title}
                                                style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                                            />
                                        )}
                                        <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#1c1917' }}>{post.title}</p>
                                        {post.location && <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '2px' }}>📍 {post.location}</p>}
                                        <p style={{ fontSize: '12px', color: '#a8a29e', marginBottom: '8px' }}>@{post.username}</p>
                                        <button
                                            onClick={() => navigate(`/posts/${post.id}`)}
                                            style={{ width: '100%', backgroundColor: '#f59e2a', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                            Oxu →
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default TravelMap;