import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../models/roles.model';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // TEMPORAL: Permitir acceso si el usuario está autenticado (para pruebas)
    // TODO: Revertir esto cuando el sistema de roles esté funcionando correctamente
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Si el usuario no tiene roles, permitimos acceso temporalmente
    if (!user.roles || user.roles.length === 0) {
      console.warn('⚠️  User has no roles, but access is temporarily allowed');
      return true;
    }

    // Buscamos si el usuario tiene el rol requerido o el rol de administrador
    const hasRole = user.roles.some((roleObj: any) =>
        requiredRoles.includes(roleObj.name as Role) || roleObj.name === Role.ADMIN
    );

    if (!hasRole) {
      console.warn(`⚠️  User does not have required roles: ${requiredRoles}, but access is temporarily allowed`);
      return true; // TEMPORAL: Permitir acceso
    }

    return true;
  }
}
