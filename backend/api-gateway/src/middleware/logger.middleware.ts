import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';

export async function loggerHook(req: FastifyRequest, reply: FastifyReply) {
  const start = Date.now();
  (req as any).startTime = start;
}

export async function onResponseHook(request: FastifyRequest, reply: FastifyReply) {
  const start = (request as any).startTime || Date.now();
  const duracion = Date.now() - start;
  const user = (request as any).user;

  // Reportar al Logs Service (User Service)
  fetch(`${config.USER_SERVICE_URL}/internal/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      servicio: 'apigateway',
      endpoint: request.url,
      metodo: request.method,
      usuario_id: user?.sub ?? null,
      ip: request.ip,
      status: reply.statusCode,
      duracion,
    }),
  }).catch((err) => {
    // Silently handle logging errors
  });
}
