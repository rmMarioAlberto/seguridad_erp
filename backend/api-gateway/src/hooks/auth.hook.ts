import { FastifyRequest, FastifyReply } from 'fastify';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { PUBLIC_ROUTES } from '../helpers/permissions.map';
import { buildResponse } from '../helpers/response.helper';

export async function authHook(req: FastifyRequest, reply: FastifyReply) {
  const isPublic = PUBLIC_ROUTES.some(route => req.url.startsWith(route));
  if (isPublic || req.method === 'OPTIONS') return;

  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1] ?? (req as any).cookies?.['jwt_token'];

  if (!token) {
    return reply.code(401).send(buildResponse(401, 'SxGW', null));
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, { clockTolerance: 60 }) as any;
    
    // Inject user info and groups into request for downstream services
    (req as any).user = {
      sub: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      groups: decoded.groups || [],
      permisos_globales: decoded.permisos_globales || []
    };

    // Add headers for microservices
    req.headers['x-user-id'] = decoded.sub.toString();
    req.headers['x-user-groups'] = (decoded.groups || []).join(',');
    req.headers['x-user-global-permissions'] = (decoded.permisos_globales || []).join(',');
  } catch (error: any) {
    console.error('[GATEWAY AUTH ERROR]:', error.message || error);
    return reply.code(401).send(buildResponse(401, 'SxGW', null));
  }
}
