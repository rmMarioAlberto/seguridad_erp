import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { authHook } from '../hooks/auth.hook';
import { createPermissionsHook } from '../hooks/permissions.hook';

export async function estadosRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authHook);

  app.get('/estados', {
    onRequest: [createPermissionsHook(['global:tickets:view', 'tickets:view'])]
  }, async (req, reply) => {
    return reply.from(`${config.TICKETS_SERVICE_URL}/estados`);
  });
}
