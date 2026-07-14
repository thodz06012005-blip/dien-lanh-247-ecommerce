import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { ADMIN_PERMISSIONS } from '../../common/auth/admin-permissions';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogService } from '../audit/audit-log.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@Controller()
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('settings/public')
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.SETTINGS_VIEW)
  @Get('admin/settings')
  getAdminSettings() {
    return this.settingsService.getAdminSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Permissions(ADMIN_PERMISSIONS.SETTINGS_MANAGE)
  @Patch('admin/settings')
  async updateSettings(@Body() dto: UpdateSettingsDto, @Req() req: Request) {
    const result = await this.settingsService.updateSettings(dto);
    this.auditLogService.auditSuccess(req, 'SETTINGS_UPDATED', 'settings', 'default', dto, 'System settings updated successfully');
    return result;
  }
}
