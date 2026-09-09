import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../core/database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TechnicianAuthService, TechnicianGuard } from './technician-auth.service';
import type { TechnicianIdentity } from './technician-auth.service';
import { OperationsService } from './operations.service';
import { CompleteDto, DecisionDto, InspectionDto, ProgressDto, TechnicianAccessDto, TechnicianLoginDto } from './operations.dto';
import { jobInclude, jobView } from './job-view';
import { AuditLogService } from '../audit/audit-log.service';
type TechRequest = Request & { technician: TechnicianIdentity };
const ok = (data: unknown, message = 'Thành công') => ({ success: true, data, message });
const actor = (req: TechRequest) => ({ id: req.technician.id, name: req.technician.name, technicianId: req.technician.id });
@Controller()
export class TechnicianPortalController {
  constructor(private readonly auth: TechnicianAuthService, private readonly operations: OperationsService, private readonly prisma: PrismaService, private readonly audit: AuditLogService) {}
  @Post('technician/auth/login') @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: TechnicianLoginDto) { return ok(await this.auth.login(dto.phone, dto.pin)); }
  @UseGuards(TechnicianGuard) @Post('technician/auth/logout')
  async logout(@Req() req: TechRequest) { await this.auth.logout(req.technician.sessionHash); return ok(null, 'Đã đăng xuất'); }
  @UseGuards(TechnicianGuard) @Get('technician/me')
  me(@Req() req: TechRequest) { const { sessionHash: _hash, ...tech } = req.technician; return ok(tech); }
  @UseGuards(TechnicianGuard) @Get('technician/jobs')
  async jobs(@Req() req: TechRequest) { return ok((await this.prisma.serviceRequest.findMany({ where: { assignedTechnicianId: req.technician.id }, include: jobInclude, orderBy: [{ preferredDate: 'asc' }, { preferredTimeSlot: 'asc' }] })).map(jobView)); }
  @UseGuards(TechnicianGuard) @Get('technician/jobs/:id')
  async job(@Param('id') id: string, @Req() req: TechRequest) {
    const job = await this.prisma.serviceRequest.findFirst({ where: { id, assignedTechnicianId: req.technician.id }, include: jobInclude });
    if (!job) throw new NotFoundException('Không tìm thấy công việc');
    return ok(jobView(job));
  }
  @UseGuards(TechnicianGuard) @Patch('technician/jobs/:id/decision')
  async decision(@Param('id') id: string, @Body() dto: DecisionDto, @Req() req: TechRequest) { return ok(await this.operations.decision(id, dto.decision, dto.reason, actor(req))); }
  @UseGuards(TechnicianGuard) @Patch('technician/jobs/:id/progress')
  async progress(@Param('id') id: string, @Body() _dto: ProgressDto, @Req() req: TechRequest) { return ok(await this.operations.progress(id, actor(req))); }
  @UseGuards(TechnicianGuard) @Patch('technician/jobs/:id/inspection')
  async inspect(@Param('id') id: string, @Body() dto: InspectionDto, @Req() req: TechRequest) { return ok(await this.operations.inspect(id, dto, actor(req))); }
  @UseGuards(TechnicianGuard) @Patch('technician/jobs/:id/complete')
  async complete(@Param('id') id: string, @Body() dto: CompleteDto, @Req() req: TechRequest) { return ok(await this.operations.complete(id, dto, actor(req))); }
  @UseGuards(TechnicianGuard) @Get('technician/earnings')
  async earnings(@Req() req: TechRequest) { return ok(await this.operations.earnings(req.technician.id)); }
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.SUPERADMIN) @Patch('admin/technicians/:id/access')
  async access(@Param('id') id: string, @Body() dto: TechnicianAccessDto, @Req() req: Request) {
    const result = await this.auth.setPin(id, dto.pin);
    this.audit.auditSuccess(req, 'TECHNICIAN_ACCESS_RESET', 'technician', id, null, 'PIN reset; existing sessions revoked');
    return ok(result, 'Đã đặt mã PIN và thu hồi phiên cũ');
  }
}
