import Fastify from 'fastify';
import replyFrom from '@fastify/reply-from';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import { config } from './config';
import { registerRoutes } from './routes';
import { loggerHook, onResponseHook } from './middleware/logger.middleware';
import { buildResponse } from './helpers/response.helper';

const app = Fastify({ 
  logger: {
    transport: {
      target: 'pino-pretty'
    }
  } 
});

async function bootstrap() {
  // 1. Plugins Base
  await app.register(cors, {
    origin: '*', // Ajustar en producción
    credentials: true,
  });

  await app.register(cookie);

  await app.register(jwt, {
    secret: config.JWT_SECRET,
  });

  // 2. Global Rate Limit
  await app.register(rateLimit, {
    max: Number(config.RATE_LIMIT_MAX),
    timeWindow: Number(config.RATE_LIMIT_WINDOW_MS),
    errorResponseBuilder: () => buildResponse(429, 'SxGW', null),
  });

  // 3. Proxy Engine
  await app.register(replyFrom, {
    base: undefined, // URL base dinámica por ruta
  });

  // 4. Hooks Globales
  app.addHook('onRequest', loggerHook);
  app.addHook('onResponse', onResponseHook);

  // 5. Rutas
  await registerRoutes(app);

  // 6. Error Handlers
  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    app.log.error(error);
    reply.code(statusCode).send(buildResponse(statusCode, 'SxGW', null));
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send(buildResponse(404, 'SxGW', null));
  });

  try {
    if (process.env.NODE_ENV !== 'production') {
      await app.listen({ port: Number(config.PORT), host: '0.0.0.0' });
      console.log(`🚀 API Gateway listo en http://localhost:${config.PORT}`);
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
