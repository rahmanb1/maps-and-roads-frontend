import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import type { Post } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/useAuth';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface MapPost {
    id: number;
    title: string;
    location: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
}

interface UserProfileData {
    username: string;
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

const UserProfile = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'map'>('posts');
    const [mapPosts, setMapPosts] = useState<MapPost[]>([]);
    const [mapLoading, setMapLoading] = useState(false);
    const [selectedMapPost, setSelectedMapPost] = useState<MapPost | null>(null);
    const [polygon, setPolygon] = useState<[number, number][][] | null>(null);
    const [polygonLoading, setPolygonLoading] = useState(false);
    const polygonCache = useRef<Record<string, [number, number][][] | null>>({});


    const bg = isDark ? '#1c1917' : '#fffbf7';
    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';
    const statBg = isDark ? '#1c1917' : '#fffbf7';

    useEffect(() => { fetchProfile(); }, [username]);

    useEffect(() => {
        if (activeTab === 'map' && profile) fetchMapPosts();
    }, [activeTab, profile]);

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

    const fetchMapPosts = async () => {
        if (!profile) return;
        setMapLoading(true);
        try {
            const response = await api.get(`/posts/map/${profile.username}`);
            setMapPosts(Array.isArray(response.data) ? response.data : []);
        } catch { console.error('Xəritə postları yüklənmədi'); }
        finally { setMapLoading(false); }
    };



    const fetchProfile = async () => {
        try {
            const response = await api.get(`/users/profile/${username}`);
            setProfile(response.data);
        } catch { navigate('/404'); }
        finally { setLoading(false); }
    };




    if (loading) return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    if (!profile) return null;

    return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: '40px', paddingBottom: '60px', transition: 'background-color 0.3s' }}>

            <Helmet>
                <title>{profile.username} — TravelBlog</title>
                <meta name="description" content={profile.bio || `${profile.username} tərəfindən ${profile.totalPosts} səyahət hekayəsi.`} />
            </Helmet>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>

                {/* Profil kartı */}
                <div style={{
                    backgroundColor: card, border: `1px solid ${border}`,
                    borderRadius: '20px', padding: '32px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.1)', marginBottom: '32px'
                }}>
                    {/* Yuxarı hissə — avatar + info */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        {/* Avatar */}
                        <div style={{
                            width: '88px', height: '88px',
                            borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                            boxShadow: '0 4px 16px rgba(245,158,42,0.35)'
                        }}>
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : `https://maps-and-roads-backend-production.up.railway.app${profile.avatarUrl}`}
                                     alt={profile.username}
                                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%',
                                    background: 'linear-gradient(135deg, #f59e2a, #e07f0a)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '36px', fontWeight: 700, color: '#ffffff'
                                }}>
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                <h1 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '26px', fontWeight: 700 }}>
                                    {profile.username}
                                </h1>
                                {profile.role === 'ADMIN' && (
                                    <span style={{
                                        backgroundColor: isDark ? '#44403c' : '#fef3e2',
                                        color: '#e07f0a', fontSize: '11px', fontWeight: 600,
                                        padding: '3px 10px', borderRadius: '20px'
                                    }}>
                                        ⚙️ Admin
                                    </span>
                                )}
                            </div>

                            <p style={{ color: subtext, fontSize: '14px', marginBottom: '12px' }}>
                                ✈️ Səyahət yazarı · {profile.totalPosts} post
                            </p>

                            {/* Bio */}
                            {profile.bio && (
                                <p style={{
                                    color: text, fontSize: '14px', lineHeight: 1.7,
                                    marginBottom: '14px', maxWidth: '480px'
                                }}>
                                    {profile.bio}
                                </p>
                            )}

                            {/* Sosial media linklər */}
                            {(profile.instagramUrl || profile.xUrl) && (
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {profile.instagramUrl && (
                                        <a href={profile.instagramUrl.startsWith('http') ? profile.instagramUrl : `https://instagram.com/${profile.instagramUrl}`}
                                           target="_blank" rel="noopener noreferrer"
                                           style={{
                                               display: 'flex', alignItems: 'center', gap: '6px',
                                               backgroundColor: isDark ? '#44403c' : '#fef3e2',
                                               color: '#e07f0a', fontSize: '12px', fontWeight: 600,
                                               padding: '6px 12px', borderRadius: '20px',
                                               border: `1px solid ${border}`, textDecoration: 'none',
                                               transition: 'all 0.2s'
                                           }}
                                           onMouseEnter={e => {
                                               (e.currentTarget as HTMLElement).style.backgroundColor = '#f59e2a';
                                               (e.currentTarget as HTMLElement).style.color = '#ffffff';
                                           }}
                                           onMouseLeave={e => {
                                               (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? '#44403c' : '#fef3e2';
                                               (e.currentTarget as HTMLElement).style.color = '#e07f0a';
                                           }}>
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
                                           style={{
                                               display: 'flex', alignItems: 'center', gap: '6px',
                                               backgroundColor: isDark ? '#44403c' : '#fef3e2',
                                               color: isDark ? '#e7e5e4' : '#1c1917', fontSize: '12px', fontWeight: 600,
                                               padding: '6px 12px', borderRadius: '20px',
                                               border: `1px solid ${border}`, textDecoration: 'none',
                                               transition: 'all 0.2s'
                                           }}
                                           onMouseEnter={e => {
                                               (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? '#e7e5e4' : '#1c1917';
                                               (e.currentTarget as HTMLElement).style.color = isDark ? '#1c1917' : '#ffffff';
                                           }}
                                           onMouseLeave={e => {
                                               (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? '#44403c' : '#fef3e2';
                                               (e.currentTarget as HTMLElement).style.color = isDark ? '#e7e5e4' : '#1c1917';
                                           }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                            X
                                        </a>
                                    )}
                                </div>
                            )}
                            {/* Mesaj göndər düyməsi */}
                            {user && user.username !== profile.username && (
                                <button
                                    onClick={() => navigate(`/messages/${profile.username}`)}
                                    style={{
                                        marginTop: '12px',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        backgroundColor: '#f59e2a', color: '#ffffff',
                                        fontSize: '13px', fontWeight: 600,
                                        padding: '8px 16px', borderRadius: '20px',
                                        border: 'none', cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                                    💬 Mesaj göndər
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Statistika */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[
                            { label: 'Post', value: profile.totalPosts, icon: '📝' },
                            { label: 'Bəyənmə', value: profile.totalLikes, icon: '❤️' },
                            { label: 'Baxış', value: profile.totalViews, icon: '👁️' },
                        ].map((item) => (
                            <div key={item.label} style={{
                                backgroundColor: statBg, border: `1px solid ${border}`,
                                borderRadius: '14px', padding: '16px', textAlign: 'center'
                            }}>
                                <p style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</p>
                                <p style={{ color: '#f59e2a', fontSize: '24px', fontWeight: 700, marginBottom: '2px' }}>
                                    {item.value}
                                </p>
                                <p style={{ color: '#a8a29e', fontSize: '12px' }}>{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: isDark ? '#292524' : '#fef3e2', padding: '4px', borderRadius: '14px', width: 'fit-content' }}>
                    {([{ key: 'posts', label: '📝 Postlar' }, { key: 'map', label: '🗺️ Xəritə' }] as const).map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', backgroundColor: activeTab === tab.key ? card : 'transparent', color: activeTab === tab.key ? '#e07f0a' : '#a8a29e', boxShadow: activeTab === tab.key ? '0 2px 8px rgba(245,158,42,0.15)' : 'none', transition: 'all 0.2s' }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Postlar */}
                {activeTab === 'posts' && (
                    <>
                        <h2 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                            {profile.username}-in Postları ({profile.totalPosts})
                        </h2>
                        {profile.posts.length === 0 ? (
                            <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                                <p style={{ fontSize: '40px', marginBottom: '12px' }}>✍️</p>
                                <p style={{ color: text, fontSize: '18px', fontWeight: 600 }}>Hələ heç bir post yoxdur</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                {profile.posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Xəritə */}
                {activeTab === 'map' && (
                    <div>
                        <h2 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                            🗺️ {profile.username}-in Səyahət Xəritəsi
                        </h2>
                        <p style={{ color: '#a8a29e', fontSize: '13px', marginBottom: '20px' }}>
                            {mapPosts.length} məkan
                        </p>
                        {mapLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                                <div style={{ width: '36px', height: '36px', border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            </div>
                        ) : mapPosts.length === 0 ? (
                            <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                                <p style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</p>
                                <p style={{ color: text, fontSize: '18px', fontWeight: 600 }}>Hələ heç bir məkan yoxdur</p>
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
                                             style={{ padding: '10px 14px', borderBottom: `1px solid ${border}`, cursor: 'pointer', backgroundColor: selectedMapPost?.id === post.id ? (isDark ? '#3a2e1e' : '#fef3e2') : 'transparent', borderLeft: selectedMapPost?.id === post.id ? '3px solid #f59e2a' : '3px solid transparent', transition: 'background-color 0.15s' }}>
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
                                    <MapContainer center={mapPosts.length > 0 ? [mapPosts[0].latitude, mapPosts[0].longitude] : [20, 10]} zoom={4} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                        <FlyToMarker post={selectedMapPost} />
                                        {polygon && polygon.map((ring, i) => (
                                            <Polygon key={i} positions={ring} pathOptions={{ color: '#f59e2a', fillColor: '#22c55e', fillOpacity: 0.25, weight: 2, opacity: 0.8 }} />
                                        ))}
                                        {mapPosts.map((post) => (
                                            <Marker key={post.id} position={[post.latitude, post.longitude]} eventHandlers={{ click: () => setSelectedMapPost(post) }}>
                                                <Popup>
                                                    <div style={{ minWidth: '180px' }}>
                                                        {post.imageUrl && <img src={post.imageUrl?.startsWith("http") ? post.imageUrl : `https://maps-and-roads-backend-production.up.railway.app${post.imageUrl}`} alt={post.title} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />}
                                                        <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#1c1917' }}>{post.title}</p>
                                                        {post.location && <p style={{ fontSize: '12px', color: '#78716c', marginBottom: '8px' }}>📍 {post.location}</p>}
                                                        <a href={`/posts/${post.id}`} style={{ display: 'block', backgroundColor: '#f59e2a', color: '#fff', textAlign: 'center', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>Oxu →</a>
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

export default UserProfile;