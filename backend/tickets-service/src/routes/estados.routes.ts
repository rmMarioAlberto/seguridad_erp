import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import { ok } from '../helpers/response.helper';

export async function estadosRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    const estados = await prisma.estado.findMany({ orderBy: { id: 'asc' } });
    return reply.send(ok(estados));
  });
}
