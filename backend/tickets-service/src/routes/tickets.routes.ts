import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import { ok, fail } from '../helpers/response.helper';

// Schema de creación
const createTicketSchema = {
  body: {
    type: 'object',
    required: ['titulo', 'grupo_id', 'estado_id', 'prioridad_id', 'autor_id'],
    properties: {
      titulo:       { type: 'string', minLength: 3, maxLength: 500 },
      descripcion:  { type: 'string' },
      grupo_id:     { type: 'integer', minimum: 1 },
      estado_id:    { type: 'integer', minimum: 1 },
      prioridad_id: { type: 'integer', minimum: 1 },
      asignado_id:  { type: 'integer' },
      autor_id:     { type: 'integer', minimum: 1 },
      fecha_final:  { type: 'string', format: 'date-time' },
    },
    additionalProperties: false,
  },
};

// Schema de actualización de estado
const updateStatusSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'integer' } },
  },
  body: {
    type: 'object',
    required: ['estado_id', 'usuario_id'],
    properties: {
      estado_id:  { type: 'integer', minimum: 1 },
      usuario_id: { type: 'integer' },
    },
    additionalProperties: false,
  },
};

const createCommentSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'integer' } },
  },
  body: {
    type: 'object',
    required: ['contenido', 'usuario_id'],
    properties: {
      contenido: { type: 'string', minLength: 1 },
      usuario_id: { type: 'integer' },
    },
    additionalProperties: false,
  },
};

export async function ticketsRoutes(app: FastifyInstance) {
  // GET /?grupo_id=&estado_id=&prioridad_id=&asignado_id=
  app.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          grupo_id:     { type: 'integer' },
          estado_id:    { type: 'integer' },
          prioridad_id: { type: 'integer' },
          asignado_id:  { type: 'integer' },
          page:         { type: 'integer', default: 1 },
          limit:        { type: 'integer', default: 20 },
        },
      },
    },
  }, async (req, reply) => {
    const { grupo_id, estado_id, prioridad_id, asignado_id, page = 1, limit = 20 } = req.query as any;
    const userId = Number(req.headers['x-user-id']);
    if (Number.isNaN(userId)) {
      return reply.code(401).send(fail(401, 'Usuario no identificado o sesión inválida'));
    }
    
    const userGroupsHeader = req.headers['x-user-groups'] as string;
    const userGroups = userGroupsHeader ? userGroupsHeader.split(',').filter(Boolean).map(Number) : [];
    
    const globalPermsHeader = req.headers['x-user-global-permissions'] as string;
    const globalPerms = globalPermsHeader ? globalPermsHeader.split(',').filter(Boolean) : [];
    
    const hasGlobalView = globalPerms.includes('global:tickets:view') || 
                         globalPerms.includes('tickets:view');

    console.log(`[TICKETS-SVC] Request by user ${userId}. Groups: ${userGroupsHeader}. GlobalPerms: ${globalPermsHeader}`);
    const where: any = {};
    
    if (hasGlobalView) {
      // Admin global ve todo, solo filtramos si pidió un grupo específico
      if (grupo_id) where.grupo_id = Number(grupo_id);
    } else {
      // Usuario regular: Aplicar lógica de pertenencia y permisos de grupo
      
      // 1. Obtener grupos donde tiene permiso explícito de 'tickets:view'
      const groupsWithViewPerm = await prisma.grupoUsuarioPermiso.findMany({
        where: {
          usuario_id: userId,
          permiso: { nombre: 'tickets:view' }
        },
        select: { grupo_id: true }
      });
      const viewPermGroupIds = groupsWithViewPerm.map(g => g.grupo_id);

      // 3. Si se filtra por un grupo específico
      if (grupo_id) {
        const targetGroupId = Number(grupo_id);
        const hasViewInTarget = viewPermGroupIds.includes(targetGroupId);
        
        if (hasViewInTarget) {
          // Si tiene permiso de view en ese grupo, ve todos los tickets de ese grupo
          where.grupo_id = targetGroupId;
        } else if (userGroups.includes(targetGroupId)) {
          // Si es miembro pero NO tiene view, solo ve los suyos dentro de ese grupo
          where.grupo_id = targetGroupId;
          where.OR = [
            { autor_id: userId },
            { asignado_id: userId }
          ];
        } else {
          // Ni miembro ni permiso -> No ve nada
          return reply.send(ok({ tickets: [], total: 0, page, limit }));
        }
      } else {
        // Vista general (Home): Combinamos accesos de todos sus grupos
        console.log(`[TICKETS-SVC] Home view for user ${userId}. Membership groups: ${JSON.stringify(userGroups)}. View perms for groups: ${JSON.stringify(viewPermGroupIds)}`);
        
        where.AND = [
            { grupo_id: { in: userGroups } },
            {
                OR: [
                    { autor_id: userId },
                    { asignado_id: userId },
                    ...(viewPermGroupIds.length > 0 ? [{ grupo_id: { in: viewPermGroupIds } }] : [])
                ]
            }
        ];
      }
    }

    if (estado_id)    where.estado_id    = Number(estado_id);
    if (prioridad_id) where.prioridad_id = Number(prioridad_id);
    if (asignado_id)  where.asignado_id  = Number(asignado_id);

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          estado:    { select: { id: true, nombre: true, color: true } },
          prioridad: { select: { id: true, nombre: true, orden: true } },
          autor:     { select: { id: true, nombre_completo: true, username: true } },
          asignado:  { select: { id: true, nombre_completo: true, username: true } },
          grupo:     { select: { id: true, nombre: true } },
        },
        orderBy: { creado_en: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return reply.send(ok({ tickets, total, page, limit }));
  });

  // GET /:id
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
      include: {
        estado:    { select: { id: true, nombre: true, color: true } },
        prioridad: { select: { id: true, nombre: true } },
        autor:     { select: { id: true, nombre_completo: true } },
        asignado:  { select: { id: true, nombre_completo: true } },
        grupo:     { select: { id: true, nombre: true } },
        comentarios: {
          include: { autor: { select: { id: true, nombre_completo: true } } },
          orderBy: { creado_en: 'asc' },
        },
        historial: { 
          orderBy: { creado_en: 'desc' }, 
          take: 10,
          include: { usuario: { select: { id: true, nombre_completo: true } } }
        },
      },
    });

    if (!ticket) return reply.code(404).send(fail(404));
    return reply.send(ok(ticket));
  });

  // POST /
  app.post('/', { schema: createTicketSchema }, async (req, reply) => {
    const body = req.body as any;

    const ticket = await prisma.ticket.create({
      data: {
        titulo:       body.titulo,
        descripcion:  body.descripcion,
        grupo_id:     body.grupo_id,
        estado_id:    body.estado_id,
        prioridad_id: body.prioridad_id,
        asignado_id:  body.asignado_id ?? null,
        autor_id:     body.autor_id,
        fecha_final:  body.fecha_final ? new Date(body.fecha_final) : null,
      },
      include: {
        estado:    { select: { id: true, nombre: true, color: true } },
        prioridad: { select: { id: true, nombre: true, orden: true } },
        autor:     { select: { id: true, nombre_completo: true, username: true } },
        asignado:  { select: { id: true, nombre_completo: true, username: true } },
        grupo:     { select: { id: true, nombre: true } },
      },
    });

    // Registrar en historial
    await prisma.historialTicket.create({
      data: {
        ticket_id:  ticket.id,
        usuario_id: body.autor_id,
        accion:     'Ticket creado',
        detalles:   { titulo: ticket.titulo },
      },
    });

    return reply.code(201).send(ok(ticket, 201));
  });

  // PUT /:id
  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const userId = Number(req.headers['x-user-id']);
    const ticketId = Number(id);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return reply.code(404).send(fail(404));

    // Permisos Globales
    const globalPerms = (req.headers['x-user-global-permissions'] as string || '').split(',');
    const isGlobalAdmin = globalPerms.includes('global:tickets:edit') || 
                         globalPerms.includes('tickets:edit');

    // Permisos de Grupo
    const hasGroupEdit = await prisma.grupoUsuarioPermiso.findFirst({
        where: {
          grupo_id: ticket.grupo_id,
          usuario_id: userId,
          permiso: { nombre: 'tickets:edit' }
        }
    });

    const isOwner = ticket.autor_id === userId;

    if (!isGlobalAdmin && !hasGroupEdit && !isOwner) {
      return reply.code(403).send(fail(403, 'No tienes permiso para editar este ticket'));
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        titulo:       body.titulo ?? ticket.titulo,
        descripcion:  body.descripcion ?? ticket.descripcion,
        estado_id:    body.estado_id ?? ticket.estado_id,
        prioridad_id: body.prioridad_id ?? ticket.prioridad_id,
        asignado_id:  body.asignado_id !== undefined ? body.asignado_id : ticket.asignado_id,
        fecha_final:  body.fecha_final ? new Date(body.fecha_final) : ticket.fecha_final,
      },
      include: {
        estado:    { select: { id: true, nombre: true, color: true } },
        prioridad: { select: { id: true, nombre: true, orden: true } },
        autor:     { select: { id: true, nombre_completo: true, username: true } },
        asignado:  { select: { id: true, nombre_completo: true, username: true } },
        grupo:     { select: { id: true, nombre: true } },
      },
    });

    await prisma.historialTicket.create({
      data: {
        ticket_id:  updated.id,
        usuario_id: userId,
        accion:     'Ticket actualizado',
        detalles:   { cambios: body },
      },
    });

    return reply.send(ok(updated));
  });

  // PATCH /:id/status
  app.patch('/:id/status', { schema: updateStatusSchema }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { estado_id, usuario_id } = req.body as any;
    const userId = Number(usuario_id);
    const ticketId = Number(id);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return reply.code(404).send(fail(404));

    // Permisos Globales
    const globalPerms = (req.headers['x-user-global-permissions'] as string || '').split(',');
    const isGlobalAdmin = globalPerms.includes('global:tickets:move') || 
                         globalPerms.includes('tickets:move');

    // Permisos de Grupo
    const hasGroupMove = await prisma.grupoUsuarioPermiso.findFirst({
        where: {
          grupo_id: ticket.grupo_id,
          usuario_id: userId,
          permiso: { nombre: 'tickets:move' }
        }
    });

    const isOwner = ticket.autor_id === userId;
    const isAssignee = ticket.asignado_id === userId;

    if (!isGlobalAdmin && !hasGroupMove && !isOwner && !isAssignee) {
      return reply.code(403).send(fail(403, 'No tienes permiso para mover este ticket'));
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { estado_id: Number(estado_id) },
      include: {
        estado:    { select: { id: true, nombre: true, color: true } },
        prioridad: { select: { id: true, nombre: true, orden: true } },
        autor:     { select: { id: true, nombre_completo: true, username: true } },
        asignado:  { select: { id: true, nombre_completo: true, username: true } },
        grupo:     { select: { id: true, nombre: true } },
      },
    });

    await prisma.historialTicket.create({
      data: {
        ticket_id:  updated.id,
        usuario_id: userId,
        accion:     'Estado cambiado',
        detalles:   { estado_anterior: ticket.estado_id, estado_nuevo: estado_id },
      },
    });

    return reply.send(ok(updated));
  });

  // DELETE /:id
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = Number(req.headers['x-user-id']);
    const ticketId = Number(id);
    
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return reply.code(404).send(fail(404));

    // Permisos Globales
    const globalPerms = (req.headers['x-user-global-permissions'] as string || '').split(',');
    const isGlobalAdmin = globalPerms.includes('global:tickets:delete') || 
                         globalPerms.includes('tickets:delete');

    // Permisos de Grupo
    const hasGroupDelete = await prisma.grupoUsuarioPermiso.findFirst({
        where: {
          grupo_id: ticket.grupo_id,
          usuario_id: userId,
          permiso: { nombre: 'tickets:delete' }
        }
    });

    const isOwner = ticket.autor_id === userId;

    if (!isGlobalAdmin && !hasGroupDelete && !isOwner) {
      return reply.code(403).send(fail(403, 'No tienes permiso para eliminar este ticket'));
    }

    // Eliminar dependientes en transacción o cascada
    await prisma.$transaction([
      prisma.comentario.deleteMany({ where: { ticket_id: ticketId } }),
      prisma.historialTicket.deleteMany({ where: { ticket_id: ticketId } }),
      prisma.ticket.delete({ where: { id: ticketId } }),
    ]);

    return reply.send(ok(null));
  });

  // POST /:id/comments
  app.post('/:id/comments', { schema: createCommentSchema }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { contenido, usuario_id } = req.body as any;
    const userId = Number(usuario_id);
    const ticketId = Number(id);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return reply.code(404).send(fail(404));

    // Permisos Globales
    const globalPerms = (req.headers['x-user-global-permissions'] as string || '').split(',');
    const isGlobalAdmin = globalPerms.includes('global:tickets:comment') || 
                         globalPerms.includes('tickets:comment');

    // Permisos de Grupo
    const hasGroupComment = await prisma.grupoUsuarioPermiso.findFirst({
        where: {
          grupo_id: ticket.grupo_id,
          usuario_id: userId,
          permiso: { nombre: 'tickets:comment' }
        }
    });

    const isOwner = ticket.autor_id === userId;
    const isAssignee = ticket.asignado_id === userId;

    if (!isGlobalAdmin && !hasGroupComment && !isOwner && !isAssignee) {
      return reply.code(403).send(fail(403, 'No tienes permiso para comentar en este ticket'));
    }

    const [comentario] = await prisma.$transaction([
      prisma.comentario.create({
        data: {
          ticket_id: ticketId,
          autor_id: userId,
          contenido: contenido,
        },
        include: { autor: { select: { id: true, nombre_completo: true } } }
      }),
      prisma.historialTicket.create({
        data: {
          ticket_id: ticketId,
          usuario_id: userId,
          accion: 'Comentario agregado',
          detalles: { contenido: contenido.substring(0, 50) + (contenido.length > 50 ? '...' : '') },
        },
      }),
    ]);

    return reply.send(ok(comentario, 201));
  });
}
