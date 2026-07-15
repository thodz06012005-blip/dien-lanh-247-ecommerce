import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogService } from './audit-log.service';

interface AuditIntegrityResponse {
  success: true;
  data: {
    valid: boolean;
    entriesChecked: number;
    firstBrokenId?: string;
  };
}

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('integrity')
  integrity(): AuditIntegrityResponse {
    return {
      success: true,
      data: this.auditLogService.verifyIntegrity(),
    };
  }

  @Get()
  listLogs(@Query() query: AuditLogQueryDto): Record<string, unknown> {
    return this.auditLogService.listAuditLogs(query);
  }
}
