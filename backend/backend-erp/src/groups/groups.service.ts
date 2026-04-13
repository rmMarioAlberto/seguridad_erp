import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(usuarioId: number) {
    return this.prisma.grupo.findMany({
      where: {
        OR: [
          { creador_id: usuarioId },
          { miembros: { some: { usuario_id: usuarioId } } },
        ],
      },
      include: {
        creador: { select: { id: true, nombre_completo: true, username: true } },
        _count: { select: { miembros: true, tickets: true } },
      },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.grupo.findMany({
      include: {
        creador: { select: { id: true, nombre_completo: true, username: true } },
        _count: { select: { miembros: true, tickets: true } },
      },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findOne(id: number) {
    const grupo = await this.prisma.grupo.findUnique({
      where: { id },
      include: {
        creador: { select: { id: true, nombre_completo: true, username: true } },
        miembros: {
          include: {
            usuario: { select: { id: true, nombre_completo: true, username: true, email: true } },
          },
        },
        _count: { select: { tickets: true } },
      },
    });

    if (!grupo) throw new NotFoundException(`Grupo con id ${id} no encontrado`);
    return grupo;
  }

  async create(dto: CreateGroupDto, creadorId: number) {
    const grupo = await this.prisma.grupo.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        creador_id: creadorId,
      },
    });

    // El creador se agrega automáticamente como miembro
    await this.prisma.grupoMiembro.create({
      data: { grupo_id: grupo.id, usuario_id: creadorId },
    });

    // Obtener todos los permisos con alcance GROUP
    const groupPerms = await this.prisma.permiso.findMany({
      where: { scope: 'GROUP' }
    });

    if (groupPerms.length > 0) {
      await this.prisma.grupoUsuarioPermiso.createMany({
        data: groupPerms.map(p => ({
          grupo_id: grupo.id,
          usuario_id: creadorId,
          permiso_id: p.id
        })),
        skipDuplicates: true
      });
    }

    return grupo;
  }

  async update(id: number, dto: UpdateGroupDto) {
    await this.assertExists(id);
    return this.prisma.grupo.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.assertExists(id);
    // Eliminar permisos y miembros antes de borrar el grupo
    await this.prisma.grupoUsuarioPermiso.deleteMany({ where: { grupo_id: id } });
    await this.prisma.grupoMiembro.deleteMany({ where: { grupo_id: id } });
    return this.prisma.grupo.delete({ where: { id } });
  }

  async addMember(grupoId: number, dto: AddMemberDto) {
    await this.assertExists(grupoId);

    const yaEsMiembro = await this.prisma.grupoMiembro.findUnique({
      where: {
        grupo_id_usuario_id: { grupo_id: grupoId, usuario_id: dto.usuario_id },
      },
    });

    if (yaEsMiembro) {
      throw new ConflictException('El usuario ya es miembro del grupo');
    }

    return this.prisma.grupoMiembro.create({
      data: { grupo_id: grupoId, usuario_id: dto.usuario_id },
    });
  }

  async removeMember(grupoId: number, usuarioId: number) {
    await this.assertExists(grupoId);
    await this.prisma.grupoUsuarioPermiso.deleteMany({
      where: { grupo_id: grupoId, usuario_id: usuarioId },
    });
    return this.prisma.grupoMiembro.delete({
      where: {
        grupo_id_usuario_id: { grupo_id: grupoId, usuario_id: usuarioId },
      },
    });
  }

  async getPermissions(grupoId: number) {
    await this.assertExists(grupoId);

    const registros = await this.prisma.grupoUsuarioPermiso.findMany({
      where: { grupo_id: grupoId },
      include: {
        usuario: { select: { id: true, nombre_completo: true, username: true } },
        permiso: { select: { id: true, nombre: true } },
      },
    });

    // Agrupar por usuario
    const porUsuario: Record<number, { usuario: object; permisos: string[] }> = {};
    for (const r of registros) {
      if (!porUsuario[r.usuario_id]) {
        porUsuario[r.usuario_id] = { usuario: r.usuario, permisos: [] };
      }
      porUsuario[r.usuario_id].permisos.push(r.permiso.nombre);
    }

    return Object.values(porUsuario);
  }

  async getUserPermissions(grupoId: number, usuarioId: number): Promise<string[]> {
    const registros = await this.prisma.grupoUsuarioPermiso.findMany({
      where: { grupo_id: grupoId, usuario_id: usuarioId },
      include: { permiso: { select: { nombre: true } } },
    });
    return registros.map((r) => r.permiso.nombre);
  }

  async setUserPermissions(grupoId: number, usuarioId: number, dto: SetPermissionsDto) {
    await this.assertExists(grupoId);

    // Eliminar permisos actuales del usuario en el grupo
    await this.prisma.grupoUsuarioPermiso.deleteMany({
      where: { grupo_id: grupoId, usuario_id: usuarioId },
    });

    if (dto.permisos.length === 0) return { message: 'Permisos eliminados' };

    // Obtener IDs de los permisos por nombre
    const permisoEntities = await this.prisma.permiso.findMany({
      where: { nombre: { in: dto.permisos } },
    });

    const permisoIds = permisoEntities.map((p) => p.id);

    await this.prisma.grupoUsuarioPermiso.createMany({
      data: permisoIds.map((permisoId) => ({
        grupo_id: grupoId,
        usuario_id: usuarioId,
        permiso_id: permisoId,
      })),
      skipDuplicates: true,
    });

    return { message: 'Permisos actualizados', permisos: dto.permisos };
  }

  private async assertExists(id: number) {
    const grupo = await this.prisma.grupo.findUnique({ where: { id } });
    if (!grupo) throw new NotFoundException(`Grupo con id ${id} no encontrado`);
  }
}
