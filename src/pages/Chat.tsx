import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/ThemeContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/axios';
import { Helmet } from 'react-helmet-async';

interface ChatMessage {
    id: number;
    senderUsername: string;
    receiverUsername: string;
    content: string;
    fileUrl: string;
    fileType: string;
    isRead: boolean;
    isDeleted: boolean;
    createdAt: string;
    type: 'message' | 'deleted' | 'status';
    replyTo: { id: number; content: string; senderUsername: string; } | null;
}

interface OnlineStatus {
    username: string;
    status: 'online' | 'offline';
}

interface Conversation {
    username: string;
    avatarUrl: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

const Chat = () => {
    const { username: chatWith } = useParams<{ username?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ messageId: number; createdAt: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const clientRef = useRef<Client | null>(null);
    const chatWithRef = useRef<string | undefined>(chatWith);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const bg = isDark ? '#1c1917' : '#fffbf7';
    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';
    const inputBg = isDark ? '#1c1917' : '#fffbf7';

    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(Array.isArray(res.data) ? res.data : []);
        } catch {}
    }, []);

    const fetchConversationsRef = useRef(fetchConversations);
    useEffect(() => { fetchConversationsRef.current = fetchConversations; }, [fetchConversations]);

    useEffect(() => {
        chatWithRef.current = chatWith;
    }, [chatWith]);

    // Scroll — chat container içində
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!user?.username) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        const username = user.username;

        const client = new Client({
            webSocketFactory: () => new SockJS('https://maps-and-roads-backend-production.up.railway.app/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                setConnected(true);

                client.subscribe(`/topic/chat.${username}`, (frame) => {
                    const msg: ChatMessage = JSON.parse(frame.body);
                    if (msg.type === 'deleted') {
                        const deletedId = (msg as unknown as { messageId: number }).messageId;
                        setMessages(prev => prev.filter(m => m.id !== deletedId));
                        return;
                    }
                    if (msg.type === 'status') return;
                    setMessages(prev => {
                        if (prev.find(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                    fetchConversationsRef.current();
                });

                client.subscribe(`/topic/status.${username}`, (frame) => {
                    const status: OnlineStatus = JSON.parse(frame.body);
                    setOnlineUsers(prev => {
                        const next = new Set(prev);
                        if (status.status === 'online') next.add(status.username);
                        else next.delete(status.username);
                        return next;
                    });
                });

                client.publish({
                    destination: '/app/chat.status',
                    body: JSON.stringify({ status: 'online' }),
                });

                if (chatWithRef.current) {
                    client.publish({
                        destination: '/app/chat.status',
                        body: JSON.stringify({ status: 'online', targetUsername: chatWithRef.current }),
                    });
                }
            },
            onDisconnect: () => { setConnected(false); },
        });

        client.activate();
        clientRef.current = client;

        const handleUnload = () => {
            if (client.connected) {
                client.publish({
                    destination: '/app/chat.status',
                    body: JSON.stringify({ status: 'offline' }),
                });
            }
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            handleUnload();
            client.deactivate();
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [user?.username]);

    useEffect(() => { fetchConversations(); }, [fetchConversations]);

    useEffect(() => {
        if (chatWith) {
            fetchMessages(chatWith);
            fetchConversations();
        }
    }, [chatWith]);

    useEffect(() => {
        if (connected && chatWith) {
            clientRef.current?.publish({
                destination: '/app/chat.status',
                body: JSON.stringify({ status: 'online', targetUsername: chatWith }),
            });
        }
    }, [connected, chatWith]);

    const fetchMessages = async (username: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/chat/messages/${username}`);
            setMessages(Array.isArray(res.data) ? res.data : []);
        } catch {} finally { setLoading(false); }
    };

    const sendMessage = useCallback((receiverUsername: string, content: string, replyToId?: number) => {
        if (!clientRef.current?.connected) return;
        const body: Record<string, string> = { receiverUsername, content };
        if (replyToId !== undefined) body.replyToId = replyToId.toString();
        clientRef.current.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(body),
        });
    }, []);

    const handleSend = () => {
        if (!newMessage.trim() || !chatWith) return;
        sendMessage(chatWith, newMessage.trim(), replyTo?.id);
        setNewMessage('');
        setReplyTo(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !chatWith) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('receiverUsername', chatWith);
        try {
            const res = await api.post('/chat/messages/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const msg: ChatMessage = res.data;
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            fetchConversationsRef.current();
        } catch (err) {
            console.error('File upload error:', err);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (messageId: number, forEveryone: boolean) => {
        try {
            await api.delete(`/chat/messages/${messageId}?forEveryone=${forEveryone}`);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            alert(axiosErr.response?.data?.error || 'Xəta baş verdi');
        }
        setDeleteModal(null);
    };

    const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (date.toDateString() === new Date().toDateString()) return 'Bu gün';
        return date.toLocaleDateString('az-AZ');
    };

    const Avatar = ({ username, avatarUrl, size = 40 }: { username: string; avatarUrl?: string; size?: number }) => (
        <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            {avatarUrl ? (
                <img src={avatarUrl?.startsWith("http") ? avatarUrl : `https://maps-and-roads-backend-production.up.railway.app${avatarUrl}`} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f59e2a, #e07f0a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, color: '#fff' }}>
                    {username.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', paddingTop: '20px', paddingBottom: '20px' }}>
            <Helmet><title>Mesajlar — Maps & Roads</title></Helmet>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px', height: 'calc(100vh - 120px)' }}>
                <div style={{ display: 'flex', height: '100%', gap: '16px' }}>

                    {/* Sol panel */}
                    <div style={{ width: '300px', flexShrink: 0, backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${border}` }}>
                            <h2 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '18px', fontWeight: 700 }}>💬 Mesajlar</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: connected ? '#22c55e' : '#a8a29e' }} />
                                <span style={{ color: subtext, fontSize: '12px' }}>{connected ? 'Qoşuldu' : 'Qoşulmadı'}</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {conversations.length === 0 ? (
                                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '32px', marginBottom: '8px' }}>💬</p>
                                    <p style={{ color: subtext, fontSize: '13px' }}>Hələ heç bir söhbət yoxdur</p>
                                </div>
                            ) : conversations.map(conv => (
                                <div key={conv.username} onClick={() => navigate(`/messages/${conv.username}`)}
                                     style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', backgroundColor: chatWith === conv.username ? (isDark ? '#3b2f1e' : '#fef3e2') : 'transparent', borderBottom: `1px solid ${border}`, transition: 'background-color 0.2s' }}
                                     onMouseEnter={e => { if (chatWith !== conv.username) (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? '#2a2420' : '#fffbf7'; }}
                                     onMouseLeave={e => { if (chatWith !== conv.username) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                                    <div style={{ position: 'relative' }}>
                                        <Avatar username={conv.username} avatarUrl={conv.avatarUrl} size={42} />
                                        {onlineUsers.has(conv.username) && (
                                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e', border: `2px solid ${card}` }} />
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: text, fontSize: '14px', fontWeight: 600 }}>{conv.username}</span>
                                            {conv.lastMessageTime && <span style={{ color: subtext, fontSize: '11px' }}>{formatTime(conv.lastMessageTime)}</span>}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: subtext, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{conv.lastMessage || '📎 Fayl'}</span>
                                            {conv.unreadCount > 0 && <span style={{ backgroundColor: '#f59e2a', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{conv.unreadCount}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Yeni söhbət */}
                        <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}` }}>
                            <input
                                type="text"
                                placeholder="🔍 İstifadəçi adı yazın..."
                                style={{ width: '100%', backgroundColor: inputBg, border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 12px', color: text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val) {
                                            navigate(`/messages/${val}`);
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Sağ panel */}
                    <div style={{ flex: 1, backgroundColor: card, border: `1px solid ${border}`, borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {!chatWith ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <p style={{ fontSize: '48px', marginBottom: '16px' }}>✈️</p>
                                <p style={{ color: text, fontSize: '18px', fontWeight: 600, fontFamily: 'Georgia, serif' }}>Söhbət seçin</p>
                                <p style={{ color: subtext, fontSize: '14px', marginTop: '8px' }}>Sol paneldən bir söhbət seçin</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Avatar username={chatWith} avatarUrl={conversations.find(c => c.username === chatWith)?.avatarUrl} size={40} />
                                    <div>
                                        <p style={{ color: text, fontSize: '15px', fontWeight: 600 }}>{chatWith}</p>
                                        <p style={{ color: subtext, fontSize: '12px' }}>{onlineUsers.has(chatWith) ? '🟢 Online' : 'Offline'}</p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {loading ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                                            <div style={{ width: 28, height: 28, border: '3px solid #fde8c8', borderTopColor: '#f59e2a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <p style={{ color: subtext, fontSize: '14px' }}>Mesaj yoxdur. Salam deyin! 👋</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ flex: 1 }} />
                                            {messages.map((msg, idx) => {
                                                const isMine = msg.senderUsername === user?.username;
                                                const showDate = idx === 0 || formatDate(messages[idx - 1].createdAt) !== formatDate(msg.createdAt);
                                                return (
                                                    <div key={msg.id}>
                                                        {showDate && (
                                                            <div style={{ textAlign: 'center', margin: '8px 0' }}>
                                                                <span style={{ backgroundColor: isDark ? '#44403c' : '#fde8c8', color: subtext, fontSize: '11px', padding: '3px 10px', borderRadius: '10px' }}>{formatDate(msg.createdAt)}</span>
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                                                            {!isMine && <Avatar username={msg.senderUsername} size={28} />}
                                                            <div style={{ maxWidth: '65%', position: 'relative' }}
                                                                 onMouseEnter={e => { const b = (e.currentTarget as HTMLElement).querySelector('.msg-actions') as HTMLElement; if (b) b.style.opacity = '1'; }}
                                                                 onMouseLeave={e => { const b = (e.currentTarget as HTMLElement).querySelector('.msg-actions') as HTMLElement; if (b) b.style.opacity = '0'; }}>
                                                                {msg.replyTo && (
                                                                    <div style={{ backgroundColor: isDark ? '#3b2f1e' : '#fef3e2', borderLeft: '3px solid #f59e2a', borderRadius: '8px 8px 0 0', padding: '6px 10px', marginBottom: '2px' }}>
                                                                        <p style={{ color: '#f59e2a', fontSize: '11px', fontWeight: 600 }}>{msg.replyTo.senderUsername}</p>
                                                                        <p style={{ color: subtext, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{msg.replyTo.content}</p>
                                                                    </div>
                                                                )}
                                                                <div style={{ backgroundColor: isMine ? '#f59e2a' : (isDark ? '#44403c' : '#f5f5f4'), color: isMine ? '#fff' : text, padding: '10px 14px', borderRadius: msg.replyTo ? (isMine ? '0 18px 4px 18px' : '18px 0 18px 4px') : (isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'), fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                                                                    {msg.fileUrl ? (
                                                                        msg.fileType?.startsWith('image') ? (
                                                                            <img src={msg.fileUrl?.startsWith("http") ? msg.fileUrl : `https://maps-and-roads-backend-production.up.railway.app${msg.fileUrl}`} alt="fayl" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                                                                        ) : (
                                                                            <a href={msg.fileUrl?.startsWith("http") ? msg.fileUrl : `https://maps-and-roads-backend-production.up.railway.app${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: isMine ? '#fff' : '#f59e2a', textDecoration: 'underline' }}>📎 {msg.content}</a>
                                                                        )
                                                                    ) : msg.content}
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                                    <span style={{ color: subtext, fontSize: '10px' }}>{formatTime(msg.createdAt)}</span>
                                                                    {isMine && <span style={{ color: msg.isRead ? '#22c55e' : subtext, fontSize: '10px' }}>{msg.isRead ? '✓✓' : '✓'}</span>}
                                                                </div>
                                                                <div className="msg-actions" style={{ position: 'absolute', top: '0', ...(isMine ? { left: '-60px' } : { right: '-60px' }), display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }}>
                                                                    <button onClick={() => setReplyTo(msg)} style={{ background: isDark ? '#44403c' : '#fef3e2', border: 'none', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>↩</button>
                                                                    {isMine && <button onClick={() => setDeleteModal({ messageId: msg.id, createdAt: msg.createdAt })} style={{ background: isDark ? '#44403c' : '#fef3e2', border: 'none', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>🗑</button>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>

                                {/* Reply preview */}
                                {replyTo && (
                                    <div style={{ padding: '8px 16px', borderTop: `1px solid ${border}`, backgroundColor: isDark ? '#2a2420' : '#fef9f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '3px', height: '32px', backgroundColor: '#f59e2a', borderRadius: '2px' }} />
                                            <div>
                                                <p style={{ color: '#f59e2a', fontSize: '11px', fontWeight: 600 }}>{replyTo.senderUsername}</p>
                                                <p style={{ color: subtext, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{replyTo.content}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtext, fontSize: '18px' }}>×</button>
                                    </div>
                                )}

                                {/* Input */}
                                <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                                    <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: subtext, fontSize: '16px' }}>📎</button>
                                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Mesaj yazın..." style={{ flex: 1, backgroundColor: inputBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '10px 14px', color: text, fontSize: '14px', outline: 'none', fontFamily: 'Segoe UI, sans-serif' }} />
                                    <button onClick={handleSend} disabled={!newMessage.trim() || !connected} style={{ backgroundColor: newMessage.trim() && connected ? '#f59e2a' : (isDark ? '#44403c' : '#fde8c8'), color: newMessage.trim() && connected ? '#fff' : subtext, border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s' }}>➤</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: card, borderRadius: '20px', padding: '24px', width: '300px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                        <h3 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Mesajı sil</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(Date.now() - new Date(deleteModal.createdAt).getTime()) / 60000 <= 30 && (
                                <button onClick={() => handleDelete(deleteModal.messageId, true)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>🗑 Hamı üçün sil</button>
                            )}
                            <button onClick={() => handleDelete(deleteModal.messageId, false)} style={{ backgroundColor: isDark ? '#44403c' : '#fef3e2', color: text, border: `1px solid ${border}`, borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Yalnız mənim üçün sil</button>
                            <button onClick={() => setDeleteModal(null)} style={{ background: 'none', color: subtext, border: 'none', padding: '8px', fontSize: '14px', cursor: 'pointer' }}>Ləğv et</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;