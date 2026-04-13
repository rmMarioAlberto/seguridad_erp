import { FastifyInstance } from 'fastify';
import { config } from '../config';

export async function estadosRoutes(app: FastifyInstance) {
  app.get('/estados', async (req, reply) => {
    return reply.from(`${config.TICKETS_SERVICE_URL}/estados`);
  });
}
