import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to get token from cookie
const getTokenFromCookie = () => {
    const match = document.cookie.match(/(^| )token=([^;]+)/);
    return match ? match[2] : null;
};

// Create axios instance with default configuration
const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
    timeout: 15000, // 15 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        // First try localStorage, then cookies
        const token = localStorage.getItem('token') || getTokenFromCookie();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('API Error:', error.message);

        if (error.response?.status === 401) {
            console.log('Unauthorized - redirecting to login');
            // Clear tokens on unauthorized
            localStorage.removeItem('token');
            // Optionally redirect to login here
            // window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

// Create a direct axios instance without /api prefix for full URL calls
const directApi = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Apply same interceptors to direct API
directApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || getTokenFromCookie();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

directApi.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('Direct API Error:', error.message);

        if (error.response?.status === 401) {
            console.log('Unauthorized - redirecting to login');
            localStorage.removeItem('token');
        }

        return Promise.reject(error);
    }
);

export default api;
export { directApi, API_URL };