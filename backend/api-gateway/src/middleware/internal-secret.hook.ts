import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';

export async function internalSecretHook(req: FastifyRequest, reply: FastifyReply) {
    // Inyectar el secreto siempre para que los microservicios confíen en la petición
    req.headers['x-internal-secret'] = config.INTERNAL_SECRET;
}
