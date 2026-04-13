import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { authHook } from '../hooks/auth.hook';
import { createPermissionsHook } from '../hooks/permissions.hook';

export async function ticketsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authHook);

  // El servicio de tickets se encargará de filtrar por membresía y autoría
  app.get('/tickets', {
    onRequest: [createPermissionsHook(['global:tickets:view', 'tickets:view'])]
  }, async (req, reply) => {
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets`);
  });

  app.get('/tickets/:id', {
    onRequest: [createPermissionsHook(['global:tickets:view', 'tickets:view'])]
  }, async (req, reply) => {
    const { id } = req.params as any;
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets/${id}`);
  });

  app.post('/tickets', {
    onRequest: [createPermissionsHook(['global:tickets:create'])],
  }, async (req, reply) => {
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets`);
  });

  // Los siguientes endpoints se validarán en el tickets-service para permitir "Autoría"
  // No ponemos hooks aquí porque el Gateway no conoce al creador del ticket.
  app.put('/tickets/:id', {
    onRequest: [createPermissionsHook(['global:tickets:edit', 'tickets:edit'])]
  }, async (req, reply) => {
    const { id } = req.params as any;
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets/${id}`);
  });

  app.delete('/tickets/:id', {
    onRequest: [createPermissionsHook(['global:tickets:delete', 'tickets:delete'])]
  }, async (req, reply) => {
    const { id } = req.params as any;
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets/${id}`);
  });

  app.patch('/tickets/:id/status', {
    onRequest: [createPermissionsHook(['global:tickets:move', 'tickets:move'])]
  }, async (req, reply) => {
    const { id } = req.params as any;
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets/${id}/status`);
  });

  app.post('/tickets/:id/comments', {
    onRequest: [createPermissionsHook(['global:tickets:comment', 'tickets:comment'])]
  }, async (req, reply) => {
    const { id } = req.params as any;
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets/${id}/comments`);
  });
}
