import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RegistrarUsuarioDto } from './dto/registrar-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    dto: RegistrarUsuarioDto,
  ): Promise<{ token: string; usuario: Partial<Usuario> }> {
    if (dto.password !== dto.confirmarPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existe = await this.usuariosService.buscarPorEmail(dto.email);
    if (existe) {
      throw new ConflictException('El email ya está registrado');
    }

    const hash = await bcrypt.hash(dto.password, 12);

    const usuario = await this.usuariosService.crear({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash: hash,
    });

    const token = this.generarToken(usuario);

    return { token, usuario: this.sanitizarUsuario(usuario) };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ token: string; usuario: Partial<Usuario> }> {
    const usuario = await this.usuariosService.buscarPorEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valida = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!valida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

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

  async obtenerPerfil(usuarioId: number): Promise<Partial<Usuario>> {
    const usuario = await this.usuariosService.obtenerPerfil(usuarioId);
    return this.sanitizarUsuario(usuario);
  }

  private sanitizarUsuario(usuario: Usuario): Partial<Usuario> {
    const { passwordHash: _hash, ...datosSeguros } = usuario;
    void _hash;
    return datosSeguros;
  }
}
