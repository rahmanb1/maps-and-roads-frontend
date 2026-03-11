import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';

const OAuth2Success = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await api.get('/auth/oauth2/token', {
                    withCredentials: true
                });
                const { token, username, email, role } = response.data;
                login(token, username, email, role);
                navigate('/');
            } catch {
                navigate('/login?error=oauth2');
            }
        };
        fetchToken();
    }, []);

    return (
        <div style={{
            backgroundColor: '#fffbf7', minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '48px', height: '48px',
                    border: '3px solid #fde8c8', borderTopColor: '#f59e2a',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px'
                }} />
                <p style={{ color: '#78716c', fontSize: '15px' }}>
                    Giriş edilir...
                </p>
            </div>
        </div>
    );
};

export default OAuth2Success;