import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, Headers, BadRequestException } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { UpdateTechnicianStatusDto } from './dto/update-technician-status.dto';
import { TechnicianQueryDto } from './dto/technician-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuditLogService } from '../audit/audit-log.service';

@Controller('admin/technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
export class TechniciansController {
  constructor(
    private readonly techniciansService: TechniciansService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async create(@Body() createTechnicianDto: CreateTechnicianDto, @Req() req: Request) {
    const result = await this.techniciansService.create(createTechnicianDto);
    this.auditLogService.auditSuccess(req, 'TECHNICIAN_CREATED', 'technician', String(result.data.id), { name: result.data.name }, 'Technician created successfully');
    return result;
  }

  @Get()
  findAll(@Query() query: TechnicianQueryDto) {
    return this.techniciansService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.techniciansService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async update(@Param('id') id: string, @Body() updateTechnicianDto: UpdateTechnicianDto, @Req() req: Request) {
    const result = await this.techniciansService.update(id, updateTechnicianDto);
    this.auditLogService.auditSuccess(req, 'TECHNICIAN_UPDATED', 'technician', String(result.data.id), { name: result.data.name }, 'Technician updated successfully');
    return result;
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateTechnicianStatusDto, @Req() req: Request) {
    const result = await this.techniciansService.updateStatus(id, updateStatusDto);
    this.auditLogService.auditSuccess(req, 'TECHNICIAN_STATUS_UPDATED', 'technician', id, { status: result.data.status }, 'Technician status updated successfully');
    return result;
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN)
  async remove(
    @Param('id') id: string,
    @Body() body: any,
    @Query('confirm') queryConfirm: string,
    @Query('reason') queryReason: string,
    @Headers('x-confirm-dangerous-action') headerConfirm: string,
    @Req() req: Request,
  ) {
    const bodyConfirm = body?.confirm;
    const bodyReason = body?.reason;

    const isConfirmed =
      bodyConfirm === true ||
      bodyConfirm === 'true' ||
      queryConfirm === 'true' ||
      headerConfirm === 'true';

    const rawReason = bodyReason || queryReason || 'No reason provided';
    let cleanReason = String(rawReason).trim();
    if (cleanReason.length > 300) {
      cleanReason = cleanReason.substring(0, 297) + '...';
    }
    cleanReason = cleanReason.replace(/[<>]/g, '');

    if (!isConfirmed) {
      this.auditLogService.auditFailure(
        req,
        'DANGEROUS_ACTION_BLOCKED',
        'technician',
        id,
        { action: 'DELETE_TECHNICIAN', reason: 'Missing confirmation', clientReason: cleanReason },
        'Dangerous action blocked: technician deletion requires confirmation'
      );
      throw new BadRequestException({
        success: false,
        message: 'Dangerous action confirmation required'
      });
    }

    try {
      const result = await this.techniciansService.remove(id);
      this.auditLogService.auditSuccess(
        req,
        'TECHNICIAN_SOFT_DELETED',
        'technician',
        id,
        { id, reason: cleanReason },
        'Technician soft deleted successfully'
      );
      return result;
    } catch (error) {
      this.auditLogService.auditFailure(
        req,
        'DANGEROUS_ACTION_BLOCKED',
        'technician',
        id,
        { action: 'DELETE_TECHNICIAN', reason: error.message, clientReason: cleanReason },
        `Dangerous action blocked: technician deletion failed (${error.message})`
      );
      throw error;
    }
  }
}

