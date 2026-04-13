import { FastifyRequest, FastifyReply } from 'fastify';
import { buildResponse } from '../helpers/response.helper';
import { config } from '../config';

async function getUserPermissionsForGroup(
  userId: number,
  groupId: number,
): Promise<string[]> {
  try {
    const res = await fetch(
      `${config.USER_SERVICE_URL}/groups/${groupId}/users/${userId}/permissions`
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch (error) {
    console.error('Error checking permissions:', error);
    return [];
  }
}

export function createPermissionsHook(requiredPermission: string | string[] | null) {
  return async function permissionsHook(req: FastifyRequest, reply: FastifyReply) {
    if (!requiredPermission) return;

    const user = req.user as { sub: number; permisos_globales?: string[] };
    if (!user) {
        return reply.code(401).send(buildResponse(401, 'SxGW', null));
    }

    const requiredPerms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

    // 1. Chequeo de permisos GLOBALES primero
    const globalPerms = user.permisos_globales || [];
    const hasGlobal = requiredPerms.some(p => globalPerms.includes(p));

    if (hasGlobal) {
        return; // Usuario tiene permiso a nivel de sistema para cualquiera de las opciones
    }

    const groupId =
      (req.params as any)?.groupId ??
      (req.query as any)?.grupo_id ??
      (req.body as any)?.grupo_id;

    if (!groupId) {
      // Si no hay groupId y no pasó el chequeo global, bloqueamos con 403 (Prohibido)
      return reply.code(403).send(buildResponse(403, 'SxGW', null));
    }

    const permisos = await getUserPermissionsForGroup(user.sub, Number(groupId));

    const hasGroupPerm = requiredPerms.some(p => permisos.includes(p));

    if (!hasGroupPerm) {
      return reply.code(403).send(buildResponse(403, 'SxGW', null));
    }
  };
}
