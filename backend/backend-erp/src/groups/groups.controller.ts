import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los grupos (admin) o del usuario autenticado' })
  findAll(@Request() req: any) {
    const adminPerms = [
      'groups:view', 'groups:create', 'groups:edit', 'groups:delete', 'groups:manage-members',
      'tickets:view', 'global:tickets:view'
    ];
    
    const userPerms = req.user?.permisos_globales || [];
    const hasAdminPerm = adminPerms.some(p => userPerms.includes(p));

    if (hasAdminPerm) {
      return this.groupsService.findAll();
    }
    return this.groupsService.findAllByUser(req.user.userId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Listar todos los grupos (para admin)' })
  findAllGroups() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un grupo con sus miembros' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo grupo (requiere groups:manage)' })
  create(@Body() dto: CreateGroupDto, @Request() req: any) {
    return this.groupsService.create(dto, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar nombre o descripción del grupo' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un grupo y sus relaciones' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Agregar un usuario al grupo' })
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupsService.addMember(id, dto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Quitar un usuario del grupo' })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.groupsService.removeMember(id, userId);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Obtener permisos de todos los usuarios en el grupo' })
  getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.getPermissions(id);
  }

  @Get(':id/users/:userId/permissions')
  @ApiOperation({ summary: 'Obtener permisos de un usuario específico en el grupo' })
  getUserPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.groupsService.getUserPermissions(id, userId);
  }

  @Put(':id/users/:userId/permissions')
  @ApiOperation({ summary: 'Asignar permisos a un usuario en el grupo' })
  setUserPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: SetPermissionsDto,
  ) {
    return this.groupsService.setUserPermissions(id, userId, dto);
  }
}
