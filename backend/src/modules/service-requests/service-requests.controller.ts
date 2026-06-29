import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  // Customer: Create a new service request
  @Post('service-requests')
  create(@Body() createServiceRequestDto: CreateServiceRequestDto) {
    return this.serviceRequestsService.create(createServiceRequestDto);
  }

  // Customer: View a specific service request (requires phone query param)
  @Get('service-requests/:id')
  findOneCustomer(@Param('id') id: string, @Query('phone') phone: string) {
    return this.serviceRequestsService.findOneCustomer(id, phone);
  }

  // Customer: View service request history (requires phone query param)
  @Get('my-service-requests')
  findMyRequests(@Query('phone') phone: string) {
    return this.serviceRequestsService.findMyRequests(phone);
  }

  // Admin: View all service requests with filters
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('admin/service-requests')
  findAllAdmin(
    @Query('status') status?: string,
    @Query('serviceCategoryId') serviceCategoryId?: string,
    @Query('district') district?: string,
    @Query('q') q?: string,
  ) {
    return this.serviceRequestsService.findAllAdmin({ status, serviceCategoryId, district, q });
  }

  // Admin: View a specific service request
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('admin/service-requests/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.serviceRequestsService.findOneAdmin(id);
  }

  // Admin: Update service request status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Patch('admin/service-requests/:id/status')
  updateStatusAdmin(@Param('id') id: string, @Body() updateStatusDto: UpdateServiceRequestStatusDto) {
    return this.serviceRequestsService.updateStatusAdmin(id, updateStatusDto);
  }

  // Admin: Assign a technician
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Patch('admin/service-requests/:id/assign-technician')
  assignTechnicianAdmin(@Param('id') id: string, @Body() assignTechnicianDto: AssignTechnicianDto) {
    return this.serviceRequestsService.assignTechnicianAdmin(id, assignTechnicianDto);
  }
}

