# Módulo Auth — Especificación Técnica

## Endpoints de la API

### POST /api/auth/register

Registra un nuevo usuario en el sistema.

**Request Body:**
```json
{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "password": "SecurePass123!",
    "confirmarPassword": "SecurePass123!"
}
```

**Códigos de Respuesta:**

| Código | Descripción |
|---|---|
| 201 | Usuario creado exitosamente. Retorna `{ token, usuario }` |
| 400 | Error de validación (email duplicado, contraseña no cumple requisitos, passwords no coinciden) |
| 409 | El email ya se encuentra registrado |

### POST /api/auth/login

Inicia sesión con credenciales existentes.

**Request Body:**
```json
{
    "email": "juan@example.com",
    "password": "SecurePass123!"
}
```

**Códigos de Respuesta:**

| Código | Descripción |
|---|---|
| 200 | Autenticación exitosa. Retorna `{ token, usuario }` |
| 401 | Credenciales inválidas (email no existe o contraseña incorrecta) |

### GET /api/auth/perfil

Retorna los datos del usuario autenticado (requiere token JWT en header `Authorization: Bearer <token>`).

**Códigos de Respuesta:**

| Código | Descripción |
|---|---|
| 200 | `{ id, nombre, email, fechaRegistro }` |
| 401 | Token ausente o inválido |

---

## DTOs (Data Transfer Objects)

### RegistrarUsuarioDto

```typescript
import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegistrarUsuarioDto {
    @ApiProperty({ example: 'Juan Pérez' })
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    nombre: string;

    @ApiProperty({ example: 'juan@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
        message: 'La contraseña debe contener mayúscula, minúscula, número y carácter especial',
    })
    password: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    confirmarPassword: string;
}
```

### LoginDto

```typescript
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'juan@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    password: string;
}
```

---

## Lógica del Service

### AuthService

El servicio se encarga de orquestar el registro, la autenticación y la generación de tokens.

```typescript
@Injectable()
export class AuthService {
    constructor(
        private readonly usuariosService: UsuariosService,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegistrarUsuarioDto): Promise<{ token: string; usuario: Partial<Usuario> }> {
        // 1. Validar que confirmarPassword coincida con password
        if (dto.password !== dto.confirmarPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        // 2. Verificar si el email ya existe
        const existe = await this.usuariosService.buscarPorEmail(dto.email);
        if (existe) {
            throw new ConflictException('El email ya está registrado');
        }

        // 3. Hashear la contraseña con bcrypt (salt rounds = 12)
        const hash = await bcrypt.hash(dto.password, 12);

        // 4. Crear el usuario en la base de datos
        const usuario = await this.usuariosService.crear({
            nombre: dto.nombre,
            email: dto.email,
            passwordHash: hash,
        });

        // 5. Generar el token JWT
        const token = this.generarToken(usuario);

        return { token, usuario: this.sanitizarUsuario(usuario) };
    }

    async login(dto: LoginDto): Promise<{ token: string; usuario: Partial<Usuario> }> {
        // 1. Buscar usuario por email
        const usuario = await this.usuariosService.buscarPorEmail(dto.email);
        if (!usuario) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // 2. Verificar contraseña
        const valida = await bcrypt.compare(dto.password, usuario.passwordHash);
        if (!valida) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // 3. Generar token
        const token = this.generarToken(usuario);

        return { token, usuario: this.sanitizarUsuario(usuario) };
    }

    private generarToken(usuario: Usuario): string {
        const payload: JwtPayload = {
            sub: usuario.usuarioId,
            email: usuario.email,
        };
        return this.jwtService.sign(payload, { expiresIn: '7d' });
    }

    private sanitizarUsuario(usuario: Usuario): Partial<Usuario> {
        const { passwordHash, ...datosSeguros } = usuario;
        return datosSeguros;
    }
}
```

---

## Guardianes y Estrategias

### JwtAuthGuard

```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any) {
        if (err || !user) {
            throw err || new UnauthorizedException('Token inválido o expirado');
        }
        return user;
    }
}
```

### JwtStrategy (Passport)

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: JwtPayload): Promise<{ usuarioId: number; email: string }> {
        // El payload ya fue verificado por Passport. Retornamos los datos que se inyectarán en @Request().user
        return { usuarioId: payload.sub, email: payload.email };
    }
}
```

### Decorador @Public

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

---

## Configuración del Módulo

```typescript
@Module({
    imports: [
        UsuariosModule,
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '7d' },
            }),
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
```
