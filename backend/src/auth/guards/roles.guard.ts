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

    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException('No roles assigned');
    }

    // Buscamos si el usuario tiene el rol requerido o el rol de administrador
    const hasRole = user.roles.some((roleObj: any) => {
        const roleName = typeof roleObj === 'string' ? roleObj.toLowerCase() : (roleObj.name || '').toLowerCase();
        return requiredRoles.some(r => r.toLowerCase() === roleName) || roleName === Role.ADMIN.toLowerCase();
    });

    if (!hasRole) {
      throw new ForbiddenException(`Require one of these roles: ${requiredRoles}`);
    }

    return true;
  }
}
