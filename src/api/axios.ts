import axios from 'axios';

const api = axios.create({
    baseURL: 'https://maps-and-roads-backend-production.up.railway.app/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Hər sorğuya avtomatik token əlavə et
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;