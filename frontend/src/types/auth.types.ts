export interface Usuario {
    id: number;
    usuarioId: number;
    nombre: string;
    email: string;
}

export interface AuthResponse {
    token: string;
    usuario: Usuario;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    nombre: string;
    email: string;
    password: string;
    confirmarPassword: string;
}