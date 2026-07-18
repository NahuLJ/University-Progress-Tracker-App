import api from './api';
import type { LoginDto, RegisterDto, AuthResponse } from '../types/auth.types';

export const authService = {
    async login(data: LoginDto): Promise<AuthResponse> {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    async register(data: RegisterDto): Promise<AuthResponse> {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async obtenerPerfil(): Promise<AuthResponse['usuario']> {
        const response = await api.get('/auth/perfil');
        return response.data;
    },
};