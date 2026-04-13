import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import { ok } from '../helpers/response.helper';

export async function prioridadesRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    const prioridades = await prisma.prioridad.findMany({ orderBy: { orden: 'asc' } });
    return reply.send(ok(prioridades));
  });
}
