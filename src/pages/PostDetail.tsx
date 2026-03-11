import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { Post, Comment } from '../types';
import { useAuth } from '../context/useAuth';
import { formatDate } from '../utils/dateUtils';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../context/ThemeContext';
import { Helmet } from 'react-helmet-async';

const getReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
};

const REACTIONS = [
    { type: 'LIKE', emoji: '❤️', label: 'Sevdim' },
    { type: 'WOW', emoji: '😮', label: 'Heyrətləndim' },
    { type: 'HAHA', emoji: '😂', label: 'Güldüm' },
    { type: 'SAD', emoji: '😢', label: 'Kədərləndim' },
    { type: 'CLAP', emoji: '👏', label: 'Alqışladım' },
];

interface CommentItemProps {
    comment: Comment;
    user: { username: string } | null;
    isAuthenticated: boolean;
    navigate: (path: string) => void;
    editingCommentId: number | null;
    editingContent: string;
    setEditingContent: (v: string) => void;
    replyingToId: number | null;
    replyContent: string;
    setReplyContent: (v: string) => void;
    handleEditComment: (c: Comment) => void;
    handleUpdateComment: (id: number) => void;
    handleDeleteComment: (id: number) => void;
    handleReply: (parentId: number) => void;
    setEditingCommentId: (id: number | null) => void;
    setReplyingToId: (id: number | null) => void;
    depth: number;
    isDark: boolean;
    authorAvatarUrl?: string;
}

const CommentItem = ({
                         comment, user, isAuthenticated, navigate,
                         editingCommentId, editingContent, setEditingContent,
                         replyingToId, replyContent, setReplyContent,
                         handleEditComment, handleUpdateComment, handleDeleteComment,
                         handleReply, setEditingCommentId, setReplyingToId, depth, isDark
                     }: CommentItemProps) => {
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#57534e';
    const cardBg = depth === 0 ? (isDark ? '#292524' : '#fffbf7') : (isDark ? '#1c1917' : '#ffffff');
    const inputBg = isDark ? '#292524' : '#ffffff';

    return (
        <div style={{
            backgroundColor: cardBg, border: `1px solid ${border}`,
            borderRadius: '14px', padding: '14px',
            marginLeft: depth > 0 ? '20px' : '0',
            borderLeft: depth > 0 ? `3px solid ${border}` : `1px solid ${border}`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: text, fontSize: depth === 0 ? '13px' : '12px', fontWeight: 600 }}>
    <div style={{
        width: depth === 0 ? '24px' : '20px',
        height: depth === 0 ? '24px' : '20px',
        borderRadius: '50%', overflow: 'hidden', flexShrink: 0
    }}>
        {comment.avatarUrl ? (
            <img src={`http://localhost:8080${comment.avatarUrl}`}
                 alt={comment.username}
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
            <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #f59e2a, #e07f0a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: depth === 0 ? '10px' : '9px', fontWeight: 700, color: '#ffffff'
            }}>
                {comment.username.charAt(0).toUpperCase()}
            </div>
        )}
    </div>
                    {depth > 0 && <span style={{ color: '#a8a29e' }}>↩</span>}
                    {comment.username}
</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {isAuthenticated && (
                        <button onClick={() => { setReplyingToId(comment.id); setReplyContent(`@${comment.username} `); }}
                                style={{ color: '#a8a29e', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                            💬 Cavabla
                        </button>
                    )}
                    {user?.username === comment.username && (
                        <>
                            <button onClick={() => handleEditComment(comment)}
                                    style={{ color: '#e07f0a', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                Dəyişdir
                            </button>
                            <button onClick={() => handleDeleteComment(comment.id)}
                                    style={{ color: '#dc2626', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                Sil
                            </button>
                        </>
                    )}
                </div>
            </div>

            {editingCommentId === comment.id ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={editingContent} onChange={(e) => setEditingContent(e.target.value)}
                           style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border}`, backgroundColor: inputBg, color: text, fontSize: '14px', outline: 'none', fontFamily: 'Segoe UI, sans-serif' }} />
                    <button onClick={() => handleUpdateComment(comment.id)}
                            style={{ backgroundColor: '#f59e2a', color: '#ffffff', padding: '10px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                        Saxla
                    </button>
                    <button onClick={() => setEditingCommentId(null)}
                            style={{ backgroundColor: isDark ? '#44403c' : '#f5f5f4', color: isDark ? '#e7e5e4' : '#78716c', padding: '10px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                        Ləğv
                    </button>
                </div>
            ) : (
                <>
                    <p style={{ color: subtext, fontSize: '14px', lineHeight: '1.7' }}>{comment.content}</p>
                    {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                        <p style={{ color: '#a8a29e', fontSize: '11px', marginTop: '4px' }}>✏️ dəyişdirildi</p>
                    )}
                </>
            )}

            {replyingToId === comment.id && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${border}`, display: 'flex', gap: '8px' }}>
                    <input value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
                           placeholder={`${comment.username}-ə cavab...`}
                           style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border}`, backgroundColor: inputBg, color: text, fontSize: '14px', outline: 'none', fontFamily: 'Segoe UI, sans-serif' }}
                           autoFocus />
                    <button onClick={() => handleReply(comment.id)}
                            style={{ backgroundColor: '#f59e2a', color: '#ffffff', padding: '10px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                        Göndər
                    </button>
                    <button onClick={() => setReplyingToId(null)}
                            style={{ backgroundColor: isDark ? '#44403c' : '#f5f5f4', color: isDark ? '#e7e5e4' : '#78716c', padding: '10px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                        Ləğv
                    </button>
                </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id} comment={reply} user={user}
                            isAuthenticated={isAuthenticated} navigate={navigate}
                            editingCommentId={editingCommentId} editingContent={editingContent}
                            setEditingContent={setEditingContent} replyingToId={replyingToId}
                            replyContent={replyContent} setReplyContent={setReplyContent}
                            handleEditComment={handleEditComment} handleUpdateComment={handleUpdateComment}
                            handleDeleteComment={handleDeleteComment} handleReply={handleReply}
                            setEditingCommentId={setEditingCommentId} setReplyingToId={setReplyingToId}
                            depth={depth + 1} isDark={isDark}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const PostDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [myReaction, setMyReaction] = useState<string>('');
    const [showReactions, setShowReactions] = useState(false);
    const [likers, setLikers] = useState<{ username: string; reactionType: string }[]>([]);
    const [showLikers, setShowLikers] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [dialog, setDialog] = useState<{ open: boolean; onConfirm: () => void }>({ open: false, onConfirm: () => {} });
    const [readProgress, setReadProgress] = useState(0);

    const reactionRef = useRef<HTMLDivElement>(null);
    const { isAuthenticated, user } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const bg = isDark ? '#1c1917' : '#fffbf7';
    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';
    const inputBg = isDark ? '#292524' : '#fffbf7';

    useEffect(() => {
        fetchPost(); fetchComments(); fetchLikers();
        if (isAuthenticated) fetchBookmarkStatus();
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) setShowReactions(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Progress bar — scroll izləmə
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            setReadProgress(Math.min(100, Math.round(progress)));
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Səhifə dəyişəndə progress sıfırla
    useEffect(() => {
        setReadProgress(0);
        window.scrollTo(0, 0);
    }, [id]);

    const fetchPost = async () => {
        try { const r = await api.get(`/posts/${id}`); setPost(r.data); }
        catch { console.error('Post yüklənmədi'); }
        finally { setLoading(false); }
    };
    const fetchComments = async () => {
        try { const r = await api.get(`/comments/post/${id}`); setComments(r.data); }
        catch { console.error('Şərhlər yüklənmədi'); }
    };
    const fetchLikers = async () => {
        try {
            const response = await api.get(`/likes/post/${id}/users`);
            setLikers(response.data);
            if (isAuthenticated && user?.username) {
                const myLike = response.data.find(
                    (l: { username: string; reactionType: string }) => l.username === user.username
                );
                if (myLike) { setLiked(true); setMyReaction(myLike.reactionType); }
                else { setLiked(false); setMyReaction(''); }
            }
        } catch { console.error('Bəyənənlər yüklənmədi'); }
    };
    const fetchBookmarkStatus = async () => {
        try { const r = await api.get(`/bookmarks/${id}/status`); setBookmarked(r.data.bookmarked); }
        catch { console.error('Bookmark status yüklənmədi'); }
    };
    const handleReaction = async (reactionType: string) => {
        if (!isAuthenticated) { navigate('/login'); return; }
        setShowReactions(false);
        try {
            const response = await api.post(`/likes/post/${id}?reactionType=${reactionType}`);
            setPost((prev) => prev ? { ...prev, likeCount: response.data.likeCount } : prev);
            await fetchLikers();
        } catch { console.error('Reaction xətası'); }
    };
    const handleBookmark = async () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        try { const r = await api.post(`/bookmarks/${id}/toggle`); setBookmarked(r.data.bookmarked); }
        catch { console.error('Bookmark xətası'); }
    };
    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) { navigate('/login'); return; }
        try { await api.post(`/comments/post/${id}`, { content: newComment }); setNewComment(''); fetchComments(); }
        catch { console.error('Şərh əlavə edilmədi'); }
    };
    const handleEditComment = (comment: Comment) => { setEditingCommentId(comment.id); setEditingContent(comment.content); };
    const handleUpdateComment = async (commentId: number) => {
        try { await api.put(`/comments/${commentId}`, { content: editingContent }); setEditingCommentId(null); setEditingContent(''); fetchComments(); }
        catch { console.error('Şərh yenilənmədi'); }
    };
    const handleDeleteComment = async (commentId: number) => {
        try { await api.delete(`/comments/${commentId}`); fetchComments(); }
        catch { console.error('Şərh silinmədi'); }
    };
    const handleReply = async (parentId: number) => {
        if (!isAuthenticated) { navigate('/login'); return; }
        try { await api.post(`/comments/post/${id}`, { content: replyContent, parentId }); setReplyingToId(null); setReplyContent(''); fetchComments(); }
        catch { console.error('Cavab əlavə edilmədi'); }
    };
    const handleDeletePost = () => {
        setDialog({ open: true, onConfirm: async () => {
                try { await api.delete(`/posts/${id}`); navigate('/'); }
                catch { console.error('Post silinmədi'); }
                setDialog({ open: false, onConfirm: () => {} });
            }});
    };

    if (loading) return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    );
    if (!post) return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#a8a29e' }}>Post tapılmadı</p>
        </div>
    );

    return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: '40px', paddingBottom: '60px', transition: 'background-color 0.3s' }}>

            <Helmet>
                <title>{post.title} — Maps & Roads</title>
                <meta name="description" content={post.content.replace(/[#*`]/g, '').slice(0, 155)} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.content.replace(/[#*`]/g, '').slice(0, 155)} />
                {post.imageUrl && <meta property="og:image" content={`http://localhost:8080${post.imageUrl}`} />}
                <meta property="og:type" content="article" />
                <meta property="article:author" content={post.username} />
                <meta property="og:url" content={window.location.href} />
            </Helmet>

            {/* Progress Bar */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0,
                height: '3px', zIndex: 9999,
                backgroundColor: isDark ? '#292524' : '#fde8c8'
            }}>
                <div style={{
                    height: '100%',
                    width: `${readProgress}%`,
                    background: 'linear-gradient(90deg, #f59e2a, #e07f0a)',
                    transition: 'width 0.1s ease',
                    borderRadius: '0 2px 2px 0',
                    boxShadow: '0 0 8px rgba(245,158,42,0.6)'
                }} />
            </div>

            {/* Oxuma faizi göstəricisi — sağ alt künc */}
            {readProgress > 0 && readProgress < 100 && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    zIndex: 9999,
                    backgroundColor: isDark ? '#292524' : '#ffffff',
                    border: `1px solid ${border}`,
                    borderRadius: '50%',
                    width: '52px', height: '52px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    flexDirection: 'column'
                }}>
                    <svg width="52" height="52" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                        <circle cx="26" cy="26" r="23" fill="none" stroke={isDark ? '#44403c' : '#fde8c8'} strokeWidth="2.5" />
                        <circle cx="26" cy="26" r="23" fill="none" stroke="#f59e2a" strokeWidth="2.5"
                                strokeDasharray={`${2 * Math.PI * 23}`}
                                strokeDashoffset={`${2 * Math.PI * 23 * (1 - readProgress / 100)}`}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.2s ease' }}
                        />
                    </svg>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e2a', position: 'relative', zIndex: 1 }}>
                        {readProgress}%
                    </span>
                </div>
            )}

            {readProgress === 100 && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    zIndex: 9999,
                    backgroundColor: '#f59e2a',
                    borderRadius: '50%',
                    width: '52px', height: '52px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(245,158,42,0.4)',
                    fontSize: '22px'
                }}>
                    ✓
                </div>
            )}

            {dialog.open && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '32px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
                        <p style={{ color: text, fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Bu postu silmək istəyirsiniz?</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button onClick={() => setDialog({ open: false, onConfirm: () => {} })}
                                    style={{ backgroundColor: isDark ? '#44403c' : '#f5f5f4', color: subtext, border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                Ləğv et
                            </button>
                            <button onClick={dialog.onConfirm}
                                    style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                Təsdiqlə
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>
                <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
                    {post.imageUrl ? (
                        <div style={{ height: '320px', overflow: 'hidden' }}>
                            <img src={`http://localhost:8080${post.imageUrl}`} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
                        <div style={{ height: '180px', background: isDark ? 'linear-gradient(135deg, #292524, #44403c)' : 'linear-gradient(135deg, #fef3e2, #fde8c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>🌍</div>
                    )}

                    <div style={{ padding: '32px' }}>
                        {post.location && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px', marginBottom: '16px' }}>
                                📍 {post.location}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <h1 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '32px', fontWeight: 700, lineHeight: 1.3, flex: 1, marginRight: '16px' }}>
                                {post.title}
                            </h1>
                            {user?.username === post.username && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => navigate(`/posts/${id}/edit`)}
                                            style={{ backgroundColor: isDark ? '#44403c' : '#fef3e2', color: '#e07f0a', border: `1px solid ${border}`, borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', whiteSpace: 'nowrap' }}>
                                        Dəyişdir
                                    </button>
                                    <button onClick={handleDeletePost}
                                            style={{ backgroundColor: isDark ? '#3b1f1f' : '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', whiteSpace: 'nowrap' }}>
                                        Sil
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#a8a29e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ✍️ <span onClick={() => navigate(`/users/${post.username}`)} style={{ cursor: 'pointer', color: '#e07f0a', fontWeight: 600 }}>
                                    {post.username}
                                </span>
                            </span>
                            {[
                                { icon: '👁️', text: `${post.viewCount} baxış` },
                                { icon: '❤️', text: `${post.likeCount} bəyənmə` },
                                { icon: '⏱️', text: `${getReadTime(post.content)} dəq oxunuş` },
                                { icon: '🕐', text: formatDate(post.createdAt) },
                            ].map((item) => (
                                <span key={item.text} style={{ color: '#a8a29e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {item.icon} {item.text}
                                </span>
                            ))}
                        </div>

                        <div style={{ color: isDark ? '#d6d3d1' : '#44403c', lineHeight: '1.9', fontSize: '15px', marginBottom: '28px' }} className="post-content">
                            <ReactMarkdown>{post.content}</ReactMarkdown>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div ref={reactionRef} style={{ position: 'relative' }}>
                                <button onClick={() => isAuthenticated ? setShowReactions(!showReactions) : navigate('/login')}
                                        style={{ backgroundColor: liked ? (isDark ? '#44403c' : '#fef3e2') : (isDark ? '#292524' : '#fffbf7'), color: liked ? '#e07f0a' : subtext, border: `1px solid ${border}`, borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                    {myReaction ? REACTIONS.find(r => r.type === myReaction)?.emoji : '🤍'}
                                    {' '}{post.likeCount} Bəyən
                                </button>
                                {showReactions && (
                                    <div style={{ position: 'absolute', bottom: '52px', left: '0', backgroundColor: card, border: `1px solid ${border}`, borderRadius: '50px', padding: '8px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', gap: '4px', zIndex: 100 }}>
                                        {REACTIONS.map((r) => (
                                            <button key={r.type} onClick={() => handleReaction(r.type)} title={r.label}
                                                    style={{ background: myReaction === r.type ? (isDark ? '#44403c' : '#fef3e2') : 'none', border: myReaction === r.type ? '2px solid #f59e2a' : '2px solid transparent', cursor: 'pointer', fontSize: '24px', padding: '6px 8px', borderRadius: '50%', transition: 'transform 0.15s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.35)')}
                                                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                                                {r.emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={handleBookmark}
                                    style={{ backgroundColor: bookmarked ? (isDark ? '#44403c' : '#fef3e2') : (isDark ? '#292524' : '#fffbf7'), color: bookmarked ? '#e07f0a' : subtext, border: `1px solid ${border}`, borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                                🔖 {bookmarked ? 'Saxlanıb' : 'Saxla'}
                            </button>
                        </div>

                        {likers.length > 0 && (
                            <div style={{ marginTop: '16px', backgroundColor: isDark ? '#292524' : '#fffbf7', border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 18px' }}>
                                <button onClick={() => setShowLikers(!showLikers)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtext, fontSize: '13px', fontWeight: 600, padding: '0', fontFamily: 'Segoe UI, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{likers.length} nəfər reaksiya verdi</span>
                                    <span style={{ color: '#a8a29e', fontSize: '11px' }}>{showLikers ? '▲' : '▼'}</span>
                                </button>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                                    {[...new Set(likers.map(l => l.reactionType))].map(type => (
                                        <span key={type} style={{ fontSize: '16px' }}>{REACTIONS.find(r => r.type === type)?.emoji}</span>
                                    ))}
                                </div>
                                {showLikers && (
                                    <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '12px', borderTop: `1px solid ${border}` }}>
                                        {likers.map((liker) => (
                                            <span key={liker.username} style={{ backgroundColor: card, color: '#e07f0a', fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {REACTIONS.find(r => r.type === liker.reactionType)?.emoji || '❤️'} {liker.username}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Paylaşma düymələri */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <p style={{ color: '#a8a29e', fontSize: '13px', display: 'flex', alignItems: 'center', marginRight: '4px' }}>Paylaş:</p>
                    {[
                        { label: 'WhatsApp', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.118 1.528 5.855L.057 23.985l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.919 9.919 0 01-5.087-1.395l-.361-.215-3.762.986 1.004-3.672-.236-.376A9.919 9.919 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/></svg>), url: `https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}` },
                        { label: 'X', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill={isDark ? '#ffffff' : '#000000'}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>), url: `https://x.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}` },
                        { label: 'Facebook', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>), url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                        { label: copySuccess ? 'Kopyalandı ✓' : 'Kopyala', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={subtext} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>), url: null },
                    ].map((item) => (
                        <button key={item.label}
                                onClick={() => { if (item.url) { window.open(item.url, '_blank'); } else { navigator.clipboard.writeText(window.location.href); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); } }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: isDark ? '#292524' : '#fffbf7', color: subtext, border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDark ? '#44403c' : '#fef3e2')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = isDark ? '#292524' : '#fffbf7')}>
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>

                {/* Şərhlər */}
                <div style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', marginTop: '24px' }}>
                    <h2 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>
                        Şərhlər ({comments.length})
                    </h2>

                    {isAuthenticated ? (
                        <form onSubmit={handleComment} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                   style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: `1px solid ${border}`, backgroundColor: inputBg, color: text, fontSize: '14px', outline: 'none', fontFamily: 'Segoe UI, sans-serif' }}
                                   placeholder="Şərhinizi yazın..." required />
                            <button type="submit"
                                    style={{ backgroundColor: '#f59e2a', color: '#ffffff', padding: '12px 20px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                Göndər
                            </button>
                        </form>
                    ) : (
                        <div style={{ backgroundColor: isDark ? '#44403c' : '#fef3e2', border: `1px solid ${border}`, borderRadius: '12px', padding: '14px', textAlign: 'center', marginBottom: '24px' }}>
                            <p style={{ color: subtext, fontSize: '13px' }}>
                                Şərh yazmaq üçün{' '}
                                <span onClick={() => navigate('/login')} style={{ color: '#f59e2a', fontWeight: 600, cursor: 'pointer' }}>giriş edin</span>
                            </p>
                        </div>
                    )}

                    {comments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <p style={{ fontSize: '32px', marginBottom: '8px' }}>💬</p>
                            <p style={{ color: '#a8a29e', fontSize: '14px' }}>Hələ şərh yoxdur. İlk şərhi siz yazın!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {comments.map((comment) => (
                                <CommentItem
                                    key={comment.id} comment={comment} user={user}
                                    isAuthenticated={isAuthenticated} navigate={navigate}
                                    editingCommentId={editingCommentId} editingContent={editingContent}
                                    setEditingContent={setEditingContent} replyingToId={replyingToId}
                                    replyContent={replyContent} setReplyContent={setReplyContent}
                                    handleEditComment={handleEditComment} handleUpdateComment={handleUpdateComment}
                                    handleDeleteComment={handleDeleteComment} handleReply={handleReply}
                                    setEditingCommentId={setEditingCommentId} setReplyingToId={setReplyingToId}
                                    depth={0} isDark={isDark}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetail;