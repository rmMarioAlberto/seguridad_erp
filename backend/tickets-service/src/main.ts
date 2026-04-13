import Fastify from 'fastify';
import { config } from './config';
import { ticketsRoutes } from './routes/tickets.routes';
import { estadosRoutes } from './routes/estados.routes';
import { prioridadesRoutes } from './routes/prioridades.routes';

const app = Fastify({ 
  logger: {
    transport: {
      target: 'pino-pretty'
    }
  } 
});

async function bootstrap() {
  await app.register(ticketsRoutes, { prefix: '/tickets' });
  await app.register(estadosRoutes, { prefix: '/estados' });
  await app.register(prioridadesRoutes, { prefix: '/prioridades' });

  app.setErrorHandler((error, _req, reply) => {
    const statusCode = error.statusCode ?? 500;
    app.log.error(error);
    reply.code(statusCode).send({
      statusCode,
      intOpCode: `SxTK${statusCode}`,
      data: null,
    });
  });

  try {
    if (process.env.NODE_ENV !== 'production') {
      await app.listen({ port: Number(config.PORT), host: '0.0.0.0' });
      console.log(`🚀 Tickets Service listo en http://localhost:${config.PORT}`);
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();

// Exportar para Vercel
export default async function handler(req: any, res: any) {
  await app.ready();
  app.server.emit('request', req, res);
}
