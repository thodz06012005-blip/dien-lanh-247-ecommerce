import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogService } from '../audit/audit-log.service';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { LookupServiceRequestDto } from './dto/lookup-service-request.dto';
import { ServiceRequestQueryDto } from './dto/service-request-query.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { UploadServiceRequestMediaDto } from './dto/upload-service-request-media.dto';
import { ServiceRequestsService, type ServiceRequestActor } from './service-requests.service';

const mediaInterceptor = FilesInterceptor('files', 5, {
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('Chỉ chấp nhận tệp hình ảnh JPG, PNG hoặc WebP'), false);
      return;
    }
    callback(null, true);
  },
});

@Controller()
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private actorFromRequest(req: Request, fallbackType: ServiceRequestActor['actorType']): ServiceRequestActor {
    const user = req.user as { userId?: number; sub?: number; email?: string; role?: string } | undefined;
    const role = String(user?.role ?? fallbackType).toUpperCase();
    const actorType: ServiceRequestActor['actorType'] = role === 'SUPERADMIN' || role === 'ADMIN'
      ? 'ADMIN'
      : role === 'STAFF'
        ? 'STAFF'
        : fallbackType;
    return {
      actorType,
      actorId: user?.userId || user?.sub ? String(user?.userId ?? user?.sub) : undefined,
      actorName: user?.email ?? (fallbackType === 'CUSTOMER' ? 'Khách hàng' : undefined),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
  }

  @Post('service-requests')
  create(@Body() dto: CreateServiceRequestDto, @Req() req: Request) {
    return this.serviceRequestsService.create(dto, this.actorFromRequest(req, 'CUSTOMER'));
  }

  @Post('service-requests/lookup')
  lookup(@Body() dto: LookupServiceRequestDto, @Req() req: Request) {
    return this.serviceRequestsService.lookup(dto.code, dto.phone, this.actorFromRequest(req, 'CUSTOMER'));
  }

  @Post('service-requests/:id/media')
  @UseInterceptors(mediaInterceptor)
  uploadCustomerMedia(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadServiceRequestMediaDto,
    @Req() req: Request,
  ) {
    if (!dto.phone) throw new BadRequestException('Số điện thoại là bắt buộc khi tải ảnh');
    return this.serviceRequestsService.uploadMedia(
      id.trim().toUpperCase(),
      files,
      'CUSTOMER_BEFORE',
      this.actorFromRequest(req, 'CUSTOMER'),
      dto.phone,
      dto.caption,
    );
  }

  // Backward-compatible customer detail route. Response is privacy-safe.
  @Get('service-requests/:id')
  findOneCustomer(@Param('id') id: string, @Query('phone') phone: string, @Req() req: Request) {
    return this.serviceRequestsService.findOneCustomer(id, phone, this.actorFromRequest(req, 'CUSTOMER'));
  }

  @Get('my-service-requests')
  @UseGuards(JwtAuthGuard)
  findMyRequests(@Req() req: Request) {
    const user = req.user as { userId?: number; sub?: number };
    const userId = Number(user?.userId ?? user?.sub);
    if (!Number.isInteger(userId)) throw new BadRequestException('Phiên đăng nhập không hợp lệ');
    return this.serviceRequestsService.findMyRequests(userId);
  }

  @Get('admin/service-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  findAllAdmin(@Query() query: ServiceRequestQueryDto) {
    return this.serviceRequestsService.findAllAdmin(query);
  }

  @Get('admin/service-requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  findOneAdmin(@Param('id') id: string) {
    return this.serviceRequestsService.findOneAdmin(id);
  }

  @Patch('admin/service-requests/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  async updateStatusAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateServiceRequestStatusDto,
    @Req() req: Request,
  ) {
    const actor = this.actorFromRequest(req, 'STAFF');
    const result = await this.serviceRequestsService.updateStatusAdmin(id, dto, actor);
    this.auditLogService.auditSuccess(
      req,
      'SERVICE_REQUEST_STATUS_UPDATED',
      'serviceRequest',
      id,
      { to: dto.status, version: result.data.requestVersion },
      'Service request status updated successfully',
    );
    return result;
  }

  @Patch('admin/service-requests/:id/assign-technician')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async assignTechnicianAdmin(
    @Param('id') id: string,
    @Body() dto: AssignTechnicianDto,
    @Req() req: Request,
  ) {
    const result = await this.serviceRequestsService.assignTechnicianAdmin(
      id,
      dto,
      this.actorFromRequest(req, 'ADMIN'),
    );
    this.auditLogService.auditSuccess(
      req,
      'SERVICE_REQUEST_ASSIGNED',
      'serviceRequest',
      id,
      { technicianId: dto.technicianId },
      'Technician assigned to service request',
    );
    return result;
  }

  @Post('admin/service-requests/:id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @UseInterceptors(mediaInterceptor)
  uploadAdminMedia(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadServiceRequestMediaDto,
    @Req() req: Request,
  ) {
    return this.serviceRequestsService.uploadMedia(
      id,
      files,
      dto.stage,
      this.actorFromRequest(req, 'STAFF'),
      undefined,
      dto.caption,
    );
  }
}
