/// <reference types="vite/client" />
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = sessionStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const requestUrl = error.config?.url || '';

        // Only redirect to login for auth-specific 401 errors
        if (error.response?.status === 401 && requestUrl.includes('/auth')) {
            // Token expired or invalid - clear auth data
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            sessionStorage.removeItem('user');

            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
        } else if (error.response?.status === 429) {
            toast.error('Too many requests. Please slow down.');
        } else if ((error.response?.status || 0) >= 500) {
            toast.error('Server error. Please try again later.');
        }

        return Promise.reject(error);
    }
);

export default apiClient;
