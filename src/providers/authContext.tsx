import React, { createContext, useContext } from 'react';
import { useLocalStorage } from 'react-use';
import apiService from '../services/apiService';
import { jwtDecode } from "jwt-decode";
import { ApiResponse } from '../types/IApiResponse';
import { AuthState } from '../types/IAppUser';


interface AuthContextType {
    auth: AuthState | null | undefined;
    login: (username: string, password: string, appName: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [auth, setAuth] = useLocalStorage<AuthState | null>('QualifyApp', null);

    const login = async (username: string, password: string, appName: string) => {
        const response: ApiResponse<AuthState> = await apiService.login({ appName, username, password });
        if (response.succeeded && response.data) {
            const tokenData: any = jwtDecode(response.data.token);
            const roles = (tokenData.role || tokenData.roles).split(",");
            response.data.roles = roles;
            setAuth(response.data); // Updates localStorage automatically
            if (response.data.token) {
                apiService.setToken(response.data.token);
            }
        } else {
            throw new Error(response.error || 'Invalid credentials');
        }
    };

    const logout = () => {
        setAuth(null); // Clears localStorage automatically
        apiService.setToken(null); // Clear token in apiService
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};