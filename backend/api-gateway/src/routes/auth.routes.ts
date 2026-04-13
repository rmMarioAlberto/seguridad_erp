import { FastifyInstance } from 'fastify';
import { config } from '../config';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}/auth/login`);
  });

  app.post('/auth/register', async (req, reply) => {
    return reply.from(`${config.USER_SERVICE_URL}/auth/register`);
  });

}
