import apiClient from './api';

export interface User {
    id: string;
    email: string;
    full_name: string;
    profile_picture_url?: string;
    created_at: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
}

export interface RefreshTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

class AuthService {
    async login(data: LoginRequest): Promise<AuthResponse> {
        console.log('[AUTH] Login attempt for:', data.email);
        const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
        console.log('[AUTH] Full response object:', response);
        console.log('[AUTH] Response data:', response.data);
        console.log('[AUTH] Has access_token?', !!response.data?.access_token);
        console.log('[AUTH] Has user?', !!response.data?.user);
        this.setTokens(response.data);
        return response.data;
    }

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
        this.setTokens(response.data);
        return response.data;
    }

    async logout(): Promise<void> {
        try {
            await apiClient.post('/api/auth/logout');
        } finally {
            this.clearTokens();
        }
    }

    async refreshToken(): Promise<RefreshTokenResponse> {
        const refreshToken = sessionStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await apiClient.post<RefreshTokenResponse>('/api/auth/refresh', {
            refresh_token: refreshToken,
        });

        this.setTokens(response.data);
        return response.data;
    }

    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<User>('/api/auth/me');
        sessionStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    }

    private setTokens(data: AuthResponse | RefreshTokenResponse): void {
        console.log('[AUTH] setTokens called with data:', data);
        sessionStorage.setItem('access_token', data.access_token);
        sessionStorage.setItem('refresh_token', data.refresh_token);
        console.log('[AUTH] Tokens stored. Access token:', data.access_token?.substring(0, 20) + '...');

        if ('user' in data) {
            sessionStorage.setItem('user', JSON.stringify(data.user));
            console.log('[AUTH] User stored:', data.user);
        }
    }

    private clearTokens(): void {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
    }

    getStoredUser(): User | null {
        const userStr = sessionStorage.getItem('user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Failed to parse stored user:', error);
            sessionStorage.removeItem('user');
            return null;
        }
    }

    isAuthenticated(): boolean {
        return !!sessionStorage.getItem('access_token');
    }

    async uploadProfilePicture(file: File): Promise<User> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.put<User>('/api/auth/profile-picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        // Update stored user
        sessionStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    }
}

export const authService = new AuthService();
