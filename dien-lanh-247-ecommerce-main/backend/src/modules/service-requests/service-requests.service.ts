import { randomUUID } from 'crypto';
import { OperationsService } from '../service-operations/operations.service';
import { SettingsService } from '../settings/settings.service';
import { jobInclude, jobView, publicJobView, normalizePhone, jsonValue } from '../service-operations/job-view';
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { ServiceRequestQueryDto } from './dto/service-request-query.dto';
import { ServiceRequestStatus, ServiceRequestPriority, TechnicianStatus } from '@prisma/client';

@Injectable()
export class ServiceRequestsService {
  constructor(private readonly prisma: PrismaService, private readonly operations: OperationsService, private readonly settings: SettingsService) {}

  async create(dto: CreateServiceRequestDto) {
    const config = await this.settings.getBusinessConfig();
    if (!config.appliances.some(item => item.active && item.name === dto.applianceType) || !config.serviceAreas.some(item => item.active && item.name === dto.district) || !config.timeSlots.some(item => item.active && item.label === dto.preferredTimeSlot)) throw new BadRequestException('Thiết bị, khu vực hoặc khung giờ không còn được phục vụ');
    if ((dto.images || []).reduce((size, item) => size + item.length, 0) > 850000) throw new BadRequestException('Tệp đính kèm quá lớn');
    // 1. Validate serviceCategoryId exists
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: dto.serviceCategoryId },
    });
    if (!category) {
      throw new BadRequestException('Danh mục dịch vụ không tồn tại');
    }

    // 2. Validate preferredDate is not in the past
    const requestDate = new Date(dto.preferredDate);
    if (isNaN(requestDate.getTime())) {
      throw new BadRequestException('Ngày hẹn không hợp lệ');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(requestDate);
    compareDate.setHours(0, 0, 0, 0);
    if (compareDate < today) {
      throw new BadRequestException('Ngày hẹn không được ở quá khứ');
    }

    // 3. Normalize district
    const districtNormalized = dto.district.trim();

    // 4. Generate String ID (SR-xxxxxx)
    const requestId = `SR-${randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

    const now = new Date().toISOString();
    const statusHistory = [
      {
        status: 'pending',
        note: 'Khách hàng vừa gửi yêu cầu dịch vụ',
        updatedBy: 'customer',
        createdAt: now,
      },
    ];

    const request = await this.prisma.serviceRequest.create({
      data: {
        id: requestId,
        customerName: dto.customerName.trim(),
        customerPhone: normalizePhone(dto.customerPhone),
        customerAddress: dto.customerAddress.trim(),
        district: districtNormalized,
        serviceCategoryId: dto.serviceCategoryId,
        applianceType: dto.applianceType.trim(),
        issueDescription: dto.issueDescription.trim(),
        images: dto.images || [],
        mediaMetadata: jsonValue(dto.mediaMetadata || []),
        businessConfigSnapshot: jsonValue(config),
        preferredDate: dto.preferredDate,
        preferredTimeSlot: dto.preferredTimeSlot,
        note: dto.note || '',
        status: ServiceRequestStatus.pending,
        priority: dto.priority || ServiceRequestPriority.medium,
        estimatedPrice: 0,
        finalPrice: 0,
        paymentStatus: 'unpaid',
        statusHistory: statusHistory,
      },
      include: jobInclude,
    });

    return {
      success: true,
      message: 'Đặt lịch dịch vụ thành công',
      data: publicJobView(request),
    };
  }

  async findOneCustomer(id: string, phone: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: jobInclude,
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    }

    if (!phone) throw new BadRequestException('Vui lòng nhập số điện thoại');
    const normalizedPhone = normalizePhone(phone);
    if (normalizePhone(request.customerPhone) !== normalizedPhone) {
      throw new ForbiddenException('Bạn không có quyền xem yêu cầu dịch vụ này');
    }

    return {
      success: true,
      data: publicJobView(request),
    };
  }

  async findMyRequests(phone: string) {
    if (!phone) throw new BadRequestException('Vui lòng nhập số điện thoại');
    const normalizedPhone = normalizePhone(phone);
    const list = await this.prisma.serviceRequest.findMany({
      where: { customerPhone: normalizedPhone },
      include: jobInclude,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: list.map(publicJobView),
    };
  }

  async findAllAdmin(query?: ServiceRequestQueryDto) {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 10));
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query?.status) {
      const statusLower = query.status.toLowerCase();
      const validStatuses = Object.keys(ServiceRequestStatus);
      if (validStatuses.includes(statusLower)) {
        whereClause.status = statusLower as ServiceRequestStatus;
      }
    }
    if (query?.priority) {
      const priorityLower = query.priority.toLowerCase();
      const validPriorities = Object.keys(ServiceRequestPriority);
      if (validPriorities.includes(priorityLower)) {
        whereClause.priority = priorityLower as ServiceRequestPriority;
      }
    }
    if (query?.serviceCategoryId) {
      whereClause.serviceCategoryId = query.serviceCategoryId;
    }
    if (query?.district) {
      whereClause.district = query.district;
    }
    if (query?.technicianId) {
      whereClause.assignedTechnicianId = query.technicianId;
    }
    if (query?.dateFrom || query?.dateTo) {
      const dateFilter: any = {};
      if (query.dateFrom) dateFilter.gte = new Date(query.dateFrom);
      if (query.dateTo) dateFilter.lte = new Date(query.dateTo);
      whereClause.createdAt = dateFilter;
    }
    if (query?.q) {
      const q = query.q.toLowerCase().trim();
      whereClause.OR = [
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
      ];
    }

    const sortOrder = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const sortBy = query?.sortBy || 'createdAt';
    let orderBy: any = { createdAt: sortOrder };

    const allowedSortFields = ['createdAt', 'updatedAt', 'status', 'priority', 'scheduledAt', 'district', 'customerName'];
    if (allowedSortFields.includes(sortBy)) {
      if (sortBy === 'createdAt') {
        orderBy = { createdAt: sortOrder };
      } else if (sortBy === 'updatedAt') {
        orderBy = { updatedAt: sortOrder };
      } else if (sortBy === 'status') {
        orderBy = { status: sortOrder };
      } else if (sortBy === 'priority') {
        orderBy = { priority: sortOrder };
      } else if (sortBy === 'district') {
        orderBy = { district: sortOrder };
      } else if (sortBy === 'customerName') {
        orderBy = { customerName: sortOrder };
      }
    }

    const list = await this.prisma.serviceRequest.findMany({
      where: whereClause,
      include: jobInclude,
      orderBy,
      skip,
      take: limit,
    });

    return {
      success: true,
      data: list.map(jobView),
    };
  }

  async findOneAdmin(id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: jobInclude,
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    }
    return {
      success: true,
      data: jobView(request),
    };
  }

  async updateStatusAdmin(id: string, dto: UpdateServiceRequestStatusDto, actor = { id: 'admin', name: 'Admin' }) {
    return { success: true, data: await this.operations.adminStatus(id, dto.status, dto.finalPrice, dto.note, actor), message: 'Cập nhật trạng thái thành công' };
  }
  async assignTechnicianAdmin(id: string, dto: AssignTechnicianDto, actor = { id: 'admin', name: 'Admin' }) {
    return { success: true, data: await this.operations.assign(id, dto.technicianId, actor), message: 'Phân công thành công' };
  }
}
