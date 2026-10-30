import axios from 'axios';

// Defensive URL resolver that handles accidental comma-separated or malformed environment strings
const getBaseUrl = (): string => {
    const raw = process.env.NEXT_PUBLIC_API_URL;
    if (!raw) return 'http://localhost:5000/api';

    if (raw.includes(',')) {
        const parts = raw.split(',').map(u => u.trim()).filter(Boolean);
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            const local = parts.find(p => p.includes('localhost') || p.includes('127.0.0.1'));
            if (local) return local.replace(/\/+$/, '');
        }
        return (parts[0] || 'http://localhost:5000/api').replace(/\/+$/, '');
    }

    return raw.trim().replace(/\/+$/, '');
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;

