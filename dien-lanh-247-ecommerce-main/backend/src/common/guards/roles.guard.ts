import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuditLogService } from '../../modules/audit/audit-log.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    const { user } = req;
    const hasRole = requiredRoles.some((role) => user?.role === role);
    if (!hasRole) {
      this.auditLogService.auditDenied(req, 'RBAC_FORBIDDEN', req.url, 'none', { requiredRoles }, 'Access denied by RBAC');
      throw new ForbiddenException({ success: false, message: 'Forbidden' });
    }
    return true;
  }
}
