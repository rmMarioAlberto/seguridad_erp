import { FastifyInstance } from 'fastify';
import { config } from '../config';
import { authHook } from '../hooks/auth.hook';
import { createPermissionsHook } from '../hooks/permissions.hook';

export async function usersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authHook);

  app.get('/users', {
    onRequest: [createPermissionsHook(['users:view', 'groups:manage-members'])],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.post('/users', {
    onRequest: [createPermissionsHook('users:create')],
  }, async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.get('/users/me', async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.get('/users/permissions/catalog', async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}/users/permissions/catalog`, {
      queryString: req.query as any
    });
  });

  app.get('/users/:id', async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.patch('/users/:id', async (req, reply) => {
    const user = req.user as any;
    const { id } = req.params as any;

    const isAdmin = user.permisos_globales?.includes('users:edit');
    const isSelf = Number(id) === Number(user.sub) && user.permisos_globales?.includes('profile:edit');

    if (!isAdmin && !isSelf) {
      return reply.code(403).send({
        statusCode: 403,
        intOpCode: 'SxGW',
        data: null,
        message: 'No tienes permisos para editar este perfil'
      });
    }

    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });

  app.delete('/users/:id', async (req, reply) => {
    const user = req.user as any;
    const { id } = req.params as any;

    const isAdmin = user.permisos_globales?.includes('users:delete');
    const isSelf = Number(id) === Number(user.sub) && user.permisos_globales?.includes('profile:delete');

    if (!isAdmin && !isSelf) {
      return reply.code(403).send({
        statusCode: 403,
        intOpCode: 'SxGW',
        data: null,
        message: 'No tienes permisos para eliminar esta cuenta'
      });
    }

    return reply.from(`${config.USER_SERVICE_URL}${req.url}`);
  });
}
