export function calcularFortaleza(password: string): number {
    let puntaje = 0;

    if (password.length >= 8) puntaje += 20;
    if (password.length >= 12) puntaje += 10;

    if (/[A-Z]/.test(password)) puntaje += 20;
    if (/[a-z]/.test(password)) puntaje += 15;
    if (/[0-9]/.test(password)) puntaje += 20;
    if (/[!@#$%^&*]/.test(password)) puntaje += 25;

    if (password.length < 6) puntaje = Math.min(puntaje, 30);

    return Math.min(puntaje, 100);
}