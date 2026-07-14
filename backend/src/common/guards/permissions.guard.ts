import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAdminPermissions, type AdminPermission } from '../auth/admin-permissions';
import { PERMISSIONS_KEY, PERMISSION_MODE_KEY } from '../decorators/permissions.decorator';
import { AuditLogService } from '../../modules/audit/audit-log.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<AdminPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];
    if (!required.length) return true;

    const mode = this.reflector.getAllAndOverride<'all' | 'any'>(PERMISSION_MODE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? 'all';
    const request = context.switchToHttp().getRequest();
    const role = request.user?.role as string | undefined;

    if (!hasAdminPermissions(role, required, mode)) {
      this.auditLogService.auditDenied(
        request,
        'PERMISSION_FORBIDDEN',
        request.url,
        String(request.user?.userId ?? 'none'),
        { required, mode, role },
        'Access denied by permission guard',
      );
      throw new ForbiddenException({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    return true;
  }
}
