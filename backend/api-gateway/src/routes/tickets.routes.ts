import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { authHook } from '../hooks/auth.hook';
import { createPermissionsHook } from '../hooks/permissions.hook';

export async function ticketsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authHook);

  // El servicio de tickets se encargará de filtrar por membresía y autoría
  app.get('/tickets', async (req, reply) => {
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets`);
  });

  app.get('/tickets/:id', async (req, reply) => {
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
  app.put('/tickets/:id', async (req, reply) => {
    const { id } = req.params as any;
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets/${id}`);
  });

  app.delete('/tickets/:id', async (req, reply) => {
    const { id } = req.params as any;
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets/${id}`);
  });

  app.patch('/tickets/:id/status', async (req, reply) => {
    const { id } = req.params as any;
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets/${id}/status`);
  });

  app.post('/tickets/:id/comments', async (req, reply) => {
    const { id } = req.params as any;
    return reply.from(`${config.TICKETS_SERVICE_URL}/tickets/${id}/comments`);
  });
}
