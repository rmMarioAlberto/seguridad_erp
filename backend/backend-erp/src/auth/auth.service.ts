import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface UserInfo {
  id: number;
  nombre_completo: string;
  username: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  user: UserInfo;
  groups: { id: number; nombre: string }[];
  permisos_por_grupo: Record<string, string[]>;
  permisos_globales_nombres: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ access_token: string; user: UserInfo }> {
    const existente = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existente) {
      throw new ConflictException('El username o email ya están en uso');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre_completo: dto.nombre_completo,
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        fecha_inicio: new Date(dto.fecha_inicio),
        direccion: dto.direccion,
        telefono: dto.telefono,
        permisos_globales: [],
      },
      select: {
        id: true,
        nombre_completo: true,
        username: true,
        email: true,
      },
    });

    const payload = { 
      sub: usuario.id, 
      username: usuario.username, 
      email: usuario.email, 
      groups: [],
      permisos_globales: []
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: usuario,
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.username }],
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { last_login: new Date() },
    });

    const permisosPorGrupo = await this.buildPermisosPorGrupo(usuario.id);

    // Obtener nombres de grupos únicos para el usuario (usando grupoMiembro en lugar de permisos)
    const gruposMiembro = await this.prisma.grupoMiembro.findMany({
      where: { usuario_id: usuario.id },
      include: { grupo: { select: { id: true, nombre: true } } },
    });

    const groups = gruposMiembro.map((gm) => gm.grupo);
    const groupIds = gruposMiembro.map(gm => gm.grupo.id);
    
    // Resolver nombres de permisos globales
    const globalPerms = await this.prisma.permiso.findMany({
      where: { id: { in: usuario.permisos_globales } },
      select: { nombre: true }
    });
    const globalPermNames = globalPerms.map(p => p.nombre);

    const payload = { 
      sub: usuario.id, 
      username: usuario.username, 
      email: usuario.email, 
      groups: groupIds,
      permisos_globales: globalPermNames
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        username: usuario.username,
        email: usuario.email,
      },
      groups,
      permisos_por_grupo: permisosPorGrupo,
      permisos_globales_nombres: globalPermNames,
    };
  }

  private async buildPermisosPorGrupo(usuarioId: number): Promise<Record<string, string[]>> {
    const registros = await this.prisma.grupoUsuarioPermiso.findMany({
      where: { usuario_id: usuarioId },
      include: {
        permiso: { select: { nombre: true } },
      },
    });

    return registros.reduce<Record<string, string[]>>((acc, registro) => {
      const key = String(registro.grupo_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(registro.permiso.nombre);
      return acc;
    }, {});
  }
}
