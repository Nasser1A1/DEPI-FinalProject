import { create } from 'zustand';
import { authService, User } from '@/services/auth.service';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: () => void;
    refreshAuth: () => Promise<void>;
    uploadProfilePicture: (file: File) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: authService.getStoredUser(),
    isAuthenticated: authService.isAuthenticated(),
    isLoading: false,

    login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const response = await authService.login({ email, password });
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true });
        try {
            const response = await authService.register({ email, password, full_name: fullName });
            set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            await authService.logout();
        } finally {
            set({
                user: null,
                isAuthenticated: false
            });
        }
    },

    loadUser: () => {
        const user = authService.getStoredUser();
        const isAuthenticated = authService.isAuthenticated();
        set({ user, isAuthenticated });
    },

    refreshAuth: async () => {
        try {
            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: true });
        } catch (error) {
            set({ user: null, isAuthenticated: false });
            throw error;
        }
    },

    uploadProfilePicture: async (file: File) => {
        try {
            const updatedUser = await authService.uploadProfilePicture(file);
            set({ user: updatedUser });
        } catch (error) {
            throw error;
        }
    },
}));
