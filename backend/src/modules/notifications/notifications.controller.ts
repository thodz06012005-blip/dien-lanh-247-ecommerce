import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ADMIN_PERMISSIONS } from '../../common/auth/admin-permissions';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  list(@Query('limit') limit?: string, @Query('unreadOnly') unreadOnly?: string) {
    return this.notifications.listAdminNotifications(Number(limit || 30), unreadOnly === 'true');
  }

  @Patch(':id/read')
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_VIEW)
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }

  @Patch('dispatch/run')
  @Permissions(ADMIN_PERMISSIONS.OPERATIONS_MANAGE)
  async runDispatcher(@Body() _body: Record<string, never>) {
    await this.notifications.processBatch();
    return { processed: true };
  }
}
