import { useEffect, useState } from 'react';
import type { Post } from '../types';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import { useTheme } from '../context/ThemeContext';
import { Helmet } from 'react-helmet-async';

interface Category {
    id: number;
    name: string;
    icon: string;
}

interface PaginatedResponse {
    posts: Post[];
    totalPages: number;
    totalElements: number;
    currentPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

const Home = () => {
    const { isDark } = useTheme();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(false);

    const bg = isDark ? '#1c1917' : '#fffbf7';
    const card = isDark ? '#292524' : '#ffffff';
    const border = isDark ? '#44403c' : '#fde8c8';
    const text = isDark ? '#e7e5e4' : '#1c1917';
    const subtext = isDark ? '#a8a29e' : '#78716c';
    const inputBg = isDark ? '#292524' : '#ffffff';

    useEffect(() => {
        fetchCategories();
        fetchPosts(0);
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch { console.error('Kateqoriyalar yüklənmədi'); }
    };

    const fetchPosts = async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get(`/posts?page=${page}&size=6`);
            const data: PaginatedResponse = response.data;
            setPosts(data.posts);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
            setHasNext(data.hasNext);
            setHasPrevious(data.hasPrevious);
        } catch { console.error('Postlar yüklənmədi'); }
        finally { setLoading(false); }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!search.trim()) {
            setIsSearchMode(false);
            setSelectedCategory(null);
            fetchPosts(0);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/posts/search?keyword=${search}`);
            setPosts(response.data);
            setSelectedCategory(null);
            setIsSearchMode(true);
            setTotalPages(1);
        } catch { console.error('Axtarış xətası'); }
        finally { setLoading(false); }
    };

    const handleCategoryFilter = async (catId: number | null) => {
        setSelectedCategory(catId);
        setSearch('');
        setIsSearchMode(false);
        setLoading(true);
        try {
            if (catId === null) {
                fetchPosts(0);
            } else {
                const response = await api.get(`/posts/category/${catId}`);
                setPosts(response.data);
                setTotalPages(1);
                setLoading(false);
            }
        } catch { console.error('Filtirləmə xətası'); setLoading(false); }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchPosts(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const pageTitle = isSearchMode
        ? `"${search}" — Axtarış | Maps & Roads`
        : selectedCategory
            ? `${categories.find(c => c.id === selectedCategory)?.name} — Maps & Roads`
            : 'Maps & Roads — Səyahət Hekayələri';

    return (
        <div style={{ backgroundColor: bg, minHeight: '100vh', transition: 'background-color 0.3s' }}>

            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content="Dünyanın dörd bir yanından səyahətçilərin hekayələri. İlham al, paylaş, kəşf et." />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content="Dünyanın dörd bir yanından səyahətçilərin hekayələri." />
                <meta property="og:type" content="website" />
            </Helmet>

            {/* Hero */}
            <div style={{
                background: isDark
                    ? 'linear-gradient(135deg, #292524 0%, #1c1917 60%, #292524 100%)'
                    : 'linear-gradient(135deg, #fef3e2 0%, #fffbf7 60%, #fde8c8 100%)',
                borderBottom: `1px solid ${border}`
            }}>
                <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '48px 24px' }}>
                    <div style={{ maxWidth: '600px' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            backgroundColor: isDark ? '#292524' : '#fef3e2',
                            border: `1px solid ${border}`,
                            borderRadius: '20px', padding: '6px 14px', marginBottom: '20px'
                        }}>
                            <span>🌍</span>
                            <span style={{ color: '#e07f0a', fontSize: '12px', fontWeight: 600 }}>Səyahət Blogu</span>
                        </div>

                        <h1 style={{
                            fontFamily: 'Georgia, serif', color: text,
                            fontSize: 'clamp(32px, 5vw, 52px)',
                            fontWeight: 700, lineHeight: 1.2, marginBottom: '16px'
                        }}>
                            Hər addımda<br />
                            <span style={{ color: '#f59e2a' }}>yeni bir hekayə</span>
                        </h1>

                        <p style={{ color: subtext, fontSize: 'clamp(14px, 2vw, 16px)', lineHeight: 1.7, marginBottom: '32px' }}>
                            Dünyanın dörd bir yanından səyahətçilərin gözündən hekayələr,
                            təcrübələr və ilham dolu anlar.
                        </p>

                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', maxWidth: '460px' }}>
                            <input type="text" placeholder="Hekayə axtar..." value={search}
                                   onChange={(e) => setSearch(e.target.value)}
                                   style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', border: `1px solid ${border}`, backgroundColor: inputBg, color: text, fontSize: '14px', outline: 'none', fontFamily: 'Segoe UI, sans-serif' }} />
                            <button type="submit"
                                    style={{ backgroundColor: '#f59e2a', color: '#ffffff', padding: '12px 22px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif', whiteSpace: 'nowrap' }}>
                                Axtar
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Kateqoriyalar */}
            {categories.length > 0 && (
                <div style={{ borderBottom: `1px solid ${border}`, backgroundColor: card }}>
                    <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button onClick={() => handleCategoryFilter(null)}
                                    style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${selectedCategory === null && !isSearchMode ? '#f59e2a' : border}`, backgroundColor: selectedCategory === null && !isSearchMode ? (isDark ? '#292524' : '#fef3e2') : (isDark ? '#1c1917' : '#fffbf7'), color: selectedCategory === null && !isSearchMode ? '#e07f0a' : subtext, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                🌍 Hamısı
                            </button>
                            {categories.map((cat) => (
                                <button key={cat.id} onClick={() => handleCategoryFilter(cat.id)}
                                        style={{ padding: '8px 16px', borderRadius: '20px', border: `1px solid ${selectedCategory === cat.id ? '#f59e2a' : border}`, backgroundColor: selectedCategory === cat.id ? (isDark ? '#292524' : '#fef3e2') : (isDark ? '#1c1917' : '#fffbf7'), color: selectedCategory === cat.id ? '#e07f0a' : subtext, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Posts */}
            <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '40px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '8px' }}>
                    <h2 style={{ fontFamily: 'Georgia, serif', color: text, fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700 }}>
                        {isSearchMode ? `🔍 Axtarış nəticələri` : selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.icon} ${categories.find(c => c.id === selectedCategory)?.name}` : 'Son Hekayələr'}
                    </h2>
                    <span style={{ color: subtext, fontSize: '13px' }}>
                        {isSearchMode || selectedCategory ? `${posts.length} hekayə` : `${totalElements} hekayə`}
                    </span>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} style={{ backgroundColor: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden' }}>
                                <div style={{ height: '200px', backgroundColor: isDark ? '#44403c' : '#fde8c8' }} />
                                <div style={{ padding: '20px' }}>
                                    <div style={{ height: '12px', backgroundColor: isDark ? '#44403c' : '#fde8c8', borderRadius: '6px', marginBottom: '12px', width: '40%' }} />
                                    <div style={{ height: '16px', backgroundColor: isDark ? '#44403c' : '#fde8c8', borderRadius: '6px', marginBottom: '8px' }} />
                                    <div style={{ height: '16px', backgroundColor: isDark ? '#44403c' : '#fde8c8', borderRadius: '6px', marginBottom: '8px', width: '80%' }} />
                                    <div style={{ height: '12px', backgroundColor: isDark ? '#44403c' : '#fde8c8', borderRadius: '6px', width: '60%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <p style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</p>
                        <p style={{ color: text, fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>Hekayə tapılmadı</p>
                        <p style={{ color: subtext, fontSize: '14px' }}>Bu kateqoriyada hələ heç bir hekayə yoxdur</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                        {posts.map((post) => (<PostCard key={post.id} post={post} />))}
                    </div>
                )}

                {/* Pagination */}
                {!isSearchMode && selectedCategory === null && totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '48px' }}>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={!hasPrevious}
                                style={{ padding: '10px 18px', borderRadius: '12px', border: `1px solid ${border}`, backgroundColor: hasPrevious ? card : (isDark ? '#292524' : '#f5f5f4'), color: hasPrevious ? '#e07f0a' : subtext, fontSize: '14px', fontWeight: 600, cursor: hasPrevious ? 'pointer' : 'not-allowed', fontFamily: 'Segoe UI, sans-serif' }}>
                            ← Əvvəlki
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
                            <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                                    style={{ width: '40px', height: '40px', borderRadius: '10px', border: `1px solid ${currentPage === pageNum ? '#f59e2a' : border}`, backgroundColor: currentPage === pageNum ? '#f59e2a' : card, color: currentPage === pageNum ? '#ffffff' : subtext, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Segoe UI, sans-serif' }}>
                                {pageNum + 1}
                            </button>
                        ))}
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={!hasNext}
                                style={{ padding: '10px 18px', borderRadius: '12px', border: `1px solid ${border}`, backgroundColor: hasNext ? card : (isDark ? '#292524' : '#f5f5f4'), color: hasNext ? '#e07f0a' : subtext, fontSize: '14px', fontWeight: 600, cursor: hasNext ? 'pointer' : 'not-allowed', fontFamily: 'Segoe UI, sans-serif' }}>
                            Növbəti →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;