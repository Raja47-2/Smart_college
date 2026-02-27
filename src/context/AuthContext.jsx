import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, logoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (token) {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    const parsedUser = {
                        id: payload.id || null,
                        email: payload.email || (storedUser && JSON.parse(storedUser).email) || null,
                        role: payload.role || (storedUser && JSON.parse(storedUser).role) || null,
                        name: (storedUser && JSON.parse(storedUser).name) || payload.name || null,
                    };
                    setUser(parsedUser);
                }
            } else if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Failed to parse auth token/user', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const data = await loginUser(email, password);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    const userObj = {
                        id: payload.id || null,
                        email: payload.email || data.email || null,
                        role: payload.role || data.role || null,
                        name: data.name || payload.name || null,
                    };
                    setUser(userObj);
                    localStorage.setItem('user', JSON.stringify(userObj));
                    return userObj;
                }
            }
        } catch (e) {
            console.error('Failed to decode token after login', e);
        }
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    };

    const logout = () => {
        logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
