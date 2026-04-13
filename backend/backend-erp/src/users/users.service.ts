import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Verificar si el username o email ya existen
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
        permisos_globales: dto.permisos_globales || [],
      },
      select: {
        id: true,
        nombre_completo: true,
        username: true,
        email: true,
        fecha_inicio: true,
        direccion: true,
        telefono: true,
        creado_en: true,
      },
    });

    return usuario;
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombre_completo: true,
        username: true,
        email: true,
        fecha_inicio: true,
        telefono: true,
        direccion: true,
        last_login: true,
        creado_en: true,
        permisos_globales: true,
      },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre_completo: true,
        username: true,
        email: true,
        fecha_inicio: true,
        direccion: true,
        telefono: true,
        last_login: true,
        creado_en: true,
        permisos_globales: true,
        grupos: {
          include: { grupo: { select: { id: true, nombre: true } } },
        },
      },
    });
  }

  async getPermissionsCatalog(scope?: 'GLOBAL' | 'GROUP') {
    return this.prisma.permiso.findMany({
      where: scope ? { scope: scope as any } : {},
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        scope: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async update(id: number, dto: any) {
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    
    return this.prisma.usuario.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return this.prisma.usuario.delete({
      where: { id },
    });
  }
}
