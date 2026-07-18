import { createContext } from 'react';

export interface AuthContextType {
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
