import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { authHook } from '../hooks/auth.hook';
import { createPermissionsHook } from '../hooks/permissions.hook';

export async function groupsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authHook);

  app.get('/groups', async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.get('/groups/:id', async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.post('/groups', {
    onRequest: [createPermissionsHook('groups:create')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.put('/groups/:id', {
    onRequest: [createPermissionsHook('groups:edit')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.delete('/groups/:id', {
    onRequest: [createPermissionsHook('groups:delete')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.post('/groups/:id/members', {
    onRequest: [createPermissionsHook('groups:manage-members')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.delete('/groups/:id/members/:userId', {
    onRequest: [createPermissionsHook('groups:manage-members')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.get('/groups/:id/permissions', {
    onRequest: [createPermissionsHook(['groups:manage-members', 'tickets:view', 'global:tickets:view'])],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.get('/groups/:id/users/:userId/permissions', {
    onRequest: [createPermissionsHook('groups:manage-members')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.put('/groups/:groupId/users/:userId/permissions', {
    onRequest: [createPermissionsHook('groups:manage-members')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });
}
