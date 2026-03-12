import { Link } from 'react-router-dom';
import type { Post } from '../types';
import { formatDate } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';

interface PostCardProps {
    post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
    const { isDark } = useTheme();

    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';
    const footerBorder = isDark ? '#44403c' : '#fef3e2';

    const readTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));

    return (
        <div style={{
            backgroundColor: card,
            border: `1px solid ${border}`,
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s, transform 0.2s',
        }}
             onMouseEnter={e => {
                 (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(245,158,42,0.15)';
                 (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
             }}
             onMouseLeave={e => {
                 (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                 (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
             }}>

            {post.imageUrl ? (
                <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                    <img src={`https://maps-and-roads-backend-production.up.railway.app${post.imageUrl}`} alt={post.title}
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {post.categoryName && (
                        <div style={{
                            position: 'absolute', top: '12px', right: '12px',
                            backgroundColor: 'rgba(255,255,255,0.92)',
                            color: '#e07f0a', fontSize: '11px', fontWeight: 700,
                            padding: '4px 10px', borderRadius: '20px',
                            backdropFilter: 'blur(4px)'
                        }}>
                            {post.categoryIcon} {post.categoryName}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{
                    height: '200px',
                    background: isDark
                        ? 'linear-gradient(135deg, #292524, #44403c)'
                        : 'linear-gradient(135deg, #fef3e2, #fde8c8)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '52px',
                    position: 'relative'
                }}>
                    🌍
                    {post.categoryName && (
                        <div style={{
                            position: 'absolute', top: '12px', right: '12px',
                            backgroundColor: isDark ? 'rgba(41,37,36,0.92)' : 'rgba(255,255,255,0.92)',
                            color: '#e07f0a', fontSize: '11px', fontWeight: 700,
                            padding: '4px 10px', borderRadius: '20px'
                        }}>
                            {post.categoryIcon} {post.categoryName}
                        </div>
                    )}
                </div>
            )}

            <div style={{ padding: '20px' }}>
                {post.location && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        backgroundColor: isDark ? '#44403c' : '#fef3e2',
                        color: '#e07f0a', fontSize: '11px', fontWeight: 600,
                        padding: '4px 10px', borderRadius: '20px', marginBottom: '12px'
                    }}>
                        📍 {post.location}
                    </div>
                )}

                <h2 style={{
                    fontFamily: 'Georgia, serif',
                    color: text, fontSize: '18px',
                    fontWeight: 700, lineHeight: 1.4, marginBottom: '8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {post.title}
                </h2>

                <p style={{
                    color: subtext, fontSize: '13px',
                    lineHeight: 1.7, marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {post.content}
                </p>

                <div style={{
                    paddingTop: '14px',
                    borderTop: `1px solid ${footerBorder}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ color: '#a8a29e', fontSize: '11px' }}>👁️ {post.viewCount}</span>
                            <span style={{ color: '#a8a29e', fontSize: '11px' }}>❤️ {post.likeCount}</span>
                            <span style={{ color: '#a8a29e', fontSize: '11px' }}>✍️ {post.username}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ color: '#a8a29e', fontSize: '11px' }}>🕐 {formatDate(post.createdAt)}</span>
                            <span style={{
                                backgroundColor: isDark ? '#44403c' : '#fef3e2',
                                color: '#e07f0a', fontSize: '11px', fontWeight: 600,
                                padding: '2px 8px', borderRadius: '20px'
                            }}>📖 {readTime} dəq oxu</span>
                        </div>
                    </div>
                    <Link to={`/posts/${post.id}`}
                          style={{ color: '#f59e2a', fontSize: '13px', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                        Oxu →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PostCard;