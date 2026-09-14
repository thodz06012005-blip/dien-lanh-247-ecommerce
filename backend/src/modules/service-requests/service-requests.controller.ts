import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { ServiceRequestQueryDto } from './dto/service-request-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuditLogService } from '../audit/audit-log.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';

@Controller()
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // Customer: Create a new service request
  @Post('service-requests')
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() createServiceRequestDto: CreateServiceRequestDto, @Req() req: Request) {
    return this.serviceRequestsService.create(createServiceRequestDto, (req.user as any)?.userId ?? null);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/service-requests/:id')
  findOneCustomer(@Param('id') id: string, @Req() req: Request) {
    return this.serviceRequestsService.findOneCustomer(id, (req.user as any).userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/service-requests')
  findMyRequests(@Req() req: Request) {
    return this.serviceRequestsService.findMyRequests((req.user as any).userId);
  }

  // Admin: View all service requests with filters
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Get('admin/service-requests')
  findAllAdmin(@Query() query: ServiceRequestQueryDto) {
    return this.serviceRequestsService.findAllAdmin(query);
  }

  // Admin: View a specific service request
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Get('admin/service-requests/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.serviceRequestsService.findOneAdmin(id);
  }

  // Admin: Update service request status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Patch('admin/service-requests/:id/status')
  async updateStatusAdmin(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateServiceRequestStatusDto,
    @Req() req: Request,
  ) {
    const oldRequest = await this.serviceRequestsService.findOneAdmin(id);
    const result = await this.serviceRequestsService.updateStatusAdmin(id, updateStatusDto);
    this.auditLogService.auditSuccess(req, 'SERVICE_REQUEST_STATUS_UPDATED', 'serviceRequest', id, { from: oldRequest.data.status, to: result.data.status, finalPrice: result.data.finalPrice }, 'Service request status updated successfully');
    return result;
  }

  // Admin: Assign a technician
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Patch('admin/service-requests/:id/assign-technician')
  async assignTechnicianAdmin(
    @Param('id') id: string,
    @Body() assignTechnicianDto: AssignTechnicianDto,
    @Req() req: Request,
  ) {
    const oldRequest = await this.serviceRequestsService.findOneAdmin(id);
    const result = await this.serviceRequestsService.assignTechnicianAdmin(id, assignTechnicianDto);
    this.auditLogService.auditSuccess(req, 'SERVICE_REQUEST_ASSIGNED', 'serviceRequest', id, { oldTechnicianId: oldRequest.data.assignedTechnicianId, newTechnicianId: result.data.assignedTechnicianId }, 'Technician assigned to service request');
    return result;
  }
}
