import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import type { Post } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/useAuth';

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


    const bg = isDark ? '#1c1917' : '#fffbf7';
    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';
    const statBg = isDark ? '#1c1917' : '#fffbf7';

    useEffect(() => { fetchProfile(); }, [username]);



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
                <title>{profile.username} — Maps & Roads</title>
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
                                <img src={`http://localhost:8080${profile.avatarUrl}`}
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

                {/* Postlar */}
                <h2 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                    {profile.username}-in Postları ({profile.totalPosts})
                </h2>

                {profile.posts.length === 0 ? (
                    <div style={{
                        backgroundColor: card, border: `1px solid ${border}`,
                        borderRadius: '20px', padding: '48px', textAlign: 'center',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
                    }}>
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
            </div>
        </div>
    );
};

export default UserProfile;