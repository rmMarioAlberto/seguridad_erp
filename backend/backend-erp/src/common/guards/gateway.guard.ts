import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class GatewayGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    const isPublic = url.includes('/auth/login') || url.includes('/auth/register');
    if (isPublic) return true;

    const internalSecret = request.headers['x-internal-secret'];
    const configuredSecret = this.configService.get<string>('INTERNAL_SECRET') || 'erp-internal-super-secret-key-2024';

    if (internalSecret !== configuredSecret) {
      console.warn(`[SECURITY] Intento de acceso directo bloqueado a NestJS desde IP: ${request.ip}`);
      throw new UnauthorizedException('Acceso directo no permitido. Debe pasar por el API Gateway.');
    }

    // Defensa Adicional: Validar JWT si está presente
    const authHeader = request.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (token) {
      try {
        const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'erp-jwt-super-secreto-2024';
        jwt.verify(token, jwtSecret);
      } catch (e) {
        throw new UnauthorizedException('Token inválido detectado en el microservicio.');
      }
    }

    return true;
  }
}
