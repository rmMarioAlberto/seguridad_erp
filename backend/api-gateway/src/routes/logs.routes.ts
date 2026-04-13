import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { authHook } from '../hooks/auth.hook';
import { createPermissionsHook } from '../hooks/permissions.hook';

export async function logsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authHook);

  app.get('/internal/logs', {
    onRequest: [createPermissionsHook('logs:view')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.get('/internal/logs/metricas', {
    onRequest: [createPermissionsHook('metrics:view')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.get('/internal/logs/summary', {
    onRequest: [createPermissionsHook('metrics:view')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });
}
