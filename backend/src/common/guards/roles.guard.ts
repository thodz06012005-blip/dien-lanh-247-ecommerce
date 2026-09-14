import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuditLogService } from '../../modules/audit/audit-log.service';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private auditLogService: AuditLogService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles) return true;
    const req = context.switchToHttp().getRequest();
    const tokenUser = req.user;
    if (!tokenUser?.userId) throw new UnauthorizedException();
    const currentUser = await this.prisma.user.findUnique({ where: { id: tokenUser.userId }, select: { role: true, isActive: true } });
    if (!currentUser?.isActive) throw new UnauthorizedException('Phiên không còn hiệu lực');
    req.user.role = currentUser.role;
    if (!requiredRoles.includes(currentUser.role)) {
      this.auditLogService.auditDenied(req, 'RBAC_FORBIDDEN', req.url, String(tokenUser.userId), { requiredRoles, currentRole: currentUser.role }, 'Access denied by RBAC');
      throw new ForbiddenException({ success: false, message: 'Forbidden' });
    }
    return true;
  }
}
