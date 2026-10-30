"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../../lib/api';

export interface User {
    _id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    isLoggedIn: boolean;
    user: User | null;
    isLoading: boolean;
    login: (userData: User, token: string) => void;
    logout: () => void;
    checkAuth: () => Promise<boolean>;
}

const TOKEN_KEY = 'ciphervault_token';
const USER_KEY = 'ciphervault_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Synchronous immediate cache restoration to prevent login flash & false redirects
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            // Check persistent localStorage first, then fallback to sessionStorage
            const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('token') || sessionStorage.getItem(TOKEN_KEY);
            const rawUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem('user') || sessionStorage.getItem(USER_KEY);

            if (token && rawUser) {
                const parsedUser = JSON.parse(rawUser);
                setUser(parsedUser);
                setIsLoggedIn(true);

                // Ensure tokens are synced in both localStorage and sessionStorage
                localStorage.setItem(TOKEN_KEY, token);
                localStorage.setItem(USER_KEY, rawUser);
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('user', rawUser);
            }
        } catch (err) {
            console.error('[Auth] Failed to restore local session:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Background session verification with backend
    const checkAuth = useCallback(async (): Promise<boolean> => {
        if (typeof window === 'undefined') return false;

        const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('token');
        if (!token) {
            setIsLoggedIn(false);
            setUser(null);
            return false;
        }

        try {
            const res = await api.get('/auth/me');
            if (res.data && res.data._id) {
                const verifiedUser: User = {
                    _id: res.data._id,
                    name: res.data.name,
                    email: res.data.email,
                };
                setUser(verifiedUser);
                setIsLoggedIn(true);
                localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
                sessionStorage.setItem('user', JSON.stringify(verifiedUser));
                return true;
            }
            return false;
        } catch (error: any) {
            // Check if explicitly rejected by backend (401 / 403)
            if (error?.response?.status === 401 || error?.response?.status === 403) {
                console.warn('[Auth] Session expired or revoked by server. Clearing credentials.');
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                setUser(null);
                setIsLoggedIn(false);
                return false;
            }

            // In case of network interruption or offline mode, preserve existing session!
            console.log('[Auth] Network unreachable during session verification. Preserving local session.');
            return !!user;
        }
    }, [user]);

    // Verify session in background once mounted
    useEffect(() => {
        const token = typeof window !== 'undefined' ? (localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('token')) : null;
        if (token) {
            checkAuth();
        }
    }, [checkAuth]);

    const login = (userData: User, token: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(userData));
        }
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.warn('[Auth] Logout API call failed, proceeding with client cleanup');
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                sessionStorage.removeItem(TOKEN_KEY);
                sessionStorage.removeItem(USER_KEY);
                window.location.href = '/';
            }
            setUser(null);
            setIsLoggedIn(false);
        }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, isLoading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

