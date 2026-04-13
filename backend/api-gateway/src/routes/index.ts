import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes';
import { usersRoutes } from './users.routes';
import { groupsRoutes } from './groups.routes';
import { ticketsRoutes } from './tickets.routes';
import { estadosRoutes } from './estados.routes';
import { logsRoutes } from './logs.routes';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(groupsRoutes);
  await app.register(ticketsRoutes);
  await app.register(estadosRoutes);
  await app.register(logsRoutes);
  
  // Health Check
  app.get('/health', async () => {
    return { status: 'OK', uptime: process.uptime(), timestamp: new Date().toISOString() };
  });
}
