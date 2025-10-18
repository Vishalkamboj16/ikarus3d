import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';
import socket from '../socket';

const AuthContext = createContext();

// Create a custom hook for easy access to the context
export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = 'http://localhost:3001';

    // Axios instance is created once and is stable
    const api = useMemo(() => axios.create({
        baseURL: API_URL,
        withCredentials: true,
    }), []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/user');
                setUser(res.data);
                if (!socket.connected) {
                    socket.connect(); // Connect socket after confirming user
                }
            } catch (error) {
                console.log('User not authenticated');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [api]); // api is a stable dependency

    // --- FIX 1: Wrap functions in useCallback ---
    // This ensures the function references are stable and don't change on every render.
    const login = useCallback(() => {
        window.location.href = `${API_URL}/auth/google`;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.get('/auth/logout');
            setUser(null);
            socket.disconnect();
        } catch (error) {
            console.error('Logout failed', error);
        }
    }, [api]);

    // --- FIX 2: Memoize the context value object ---
    // This is the most important change. The 'value' object will only be recreated if
    // 'user', 'loading', 'login', or 'logout' actually changes. This prevents
    // unnecessary re-renders of all consumer components.
    const value = useMemo(() => ({
        user,
        loading,
        login,
        logout,
    }), [user, loading, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};