import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { ServiceRequestQueryDto } from './dto/service-request-query.dto';
import { ServiceRequestStatus, ServiceRequestPriority, TechnicianStatus } from '@prisma/client';
import { toAdminDetail, toAdminList, toCustomerDetail } from '../service-operations/job-view';

@Injectable()
export class ServiceRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to dynamically update technician status based on active assigned jobs
  private async updateTechnicianStatusAfterJobChange(techId: string, excludeRequestId: string | null = null) {
    const tech = await this.prisma.technician.findUnique({ where: { id: techId } });
    if (!tech) return;

    // Active jobs are those assigned to this technician and in 'confirmed' or 'assigned' status
    const activeJobsCount = await this.prisma.serviceRequest.count({
      where: {
        assignedTechnicianId: techId,
        status: {
          in: [ServiceRequestStatus.confirmed, ServiceRequestStatus.assigned],
        },
        ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
      },
    });

    await this.prisma.technician.update({
      where: { id: techId },
      data: {
        status: activeJobsCount > 0 ? TechnicianStatus.busy : TechnicianStatus.available,
      },
    });
  }

  async create(dto: CreateServiceRequestDto, authenticatedUserId: number | null = null) {
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
    const districtNormalized = dto.district.startsWith('Quận ') ? dto.district : `Quận ${dto.district}`;

    // 4. Generate String ID (SR-xxxxxx)
    const requestId = `SR-${Date.now().toString().slice(-6)}`;

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
        userId: authenticatedUserId,
        id: requestId,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.replace(/\s+/g, '').trim(),
        customerAddress: dto.customerAddress.trim(),
        district: districtNormalized,
        serviceCategoryId: dto.serviceCategoryId,
        applianceType: dto.applianceType.trim(),
        issueDescription: dto.issueDescription.trim(),
        images: dto.images || [],
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
      include: {
        serviceCategory: true,
        assignedTechnician: true,
      },
    });

    return {
      success: true,
      message: 'Đặt lịch dịch vụ thành công',
      data: toCustomerDetail(request as any),
    };
  }

  async findOneCustomer(id: string, userId: number) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, userId },
      include: {
        serviceCategory: true,
        assignedTechnician: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    }

    return {
      success: true,
      data: toCustomerDetail(request as any),
    };
  }

  async findMyRequests(userId: number) {
    const list = await this.prisma.serviceRequest.findMany({
      where: { userId },
      include: {
        serviceCategory: true,
        assignedTechnician: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: list.map(item => toCustomerDetail(item as any)),
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
    if (query?.createdFrom || query?.createdTo) {
      const dateFilter: any = {};
      // Business timezone Asia/Ho_Chi_Minh: [start of day, start of next day).
      if (query.createdFrom) dateFilter.gte = new Date(`${query.createdFrom.slice(0, 10)}T00:00:00+07:00`);
      if (query.createdTo) { const next = new Date(`${query.createdTo.slice(0, 10)}T00:00:00+07:00`); next.setUTCDate(next.getUTCDate() + 1); dateFilter.lt = next; }
      whereClause.createdAt = dateFilter;
    }
    if (query?.scheduledFrom || query?.scheduledTo) {
      const scheduled: any = {};
      if (query.scheduledFrom) scheduled.gte = query.scheduledFrom.slice(0, 10);
      if (query.scheduledTo) { const next = new Date(`${query.scheduledTo.slice(0, 10)}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1); scheduled.lt = next.toISOString().slice(0, 10); }
      whereClause.preferredDate = scheduled;
    }
    if (query?.q) {
      const q = query.q.toLowerCase().trim();
      whereClause.OR = [
        { id: { contains: q } },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
      ];
    }

    const sortOrder = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const sortBy = query?.sortBy || 'createdAt';
    let orderBy: any = { createdAt: sortOrder };

    const allowedSortFields = ['createdAt', 'updatedAt', 'status', 'priority', 'preferredDate', 'district', 'customerName'];
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
      } else if (sortBy === 'preferredDate') {
        orderBy = { preferredDate: sortOrder };
      }
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({ where: whereClause, include: { serviceCategory: true, assignedTechnician: true }, orderBy, skip, take: limit }),
      this.prisma.serviceRequest.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: list.map(item => toAdminList(item as any)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneAdmin(id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        serviceCategory: true,
        assignedTechnician: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    }
    return {
      success: true,
      data: toAdminDetail(request as any),
    };
  }

  async updateStatusAdmin(id: string, dto: UpdateServiceRequestStatusDto) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    }

    const oldStatus = request.status;
    const newStatus = dto.status;

    if (newStatus !== oldStatus) {
      // 1. Chặn quay lui từ completed / cancelled
      if (oldStatus === ServiceRequestStatus.completed || oldStatus === ServiceRequestStatus.cancelled) {
        throw new BadRequestException('Không thể thay đổi trạng thái của yêu cầu dịch vụ đã hoàn thành hoặc đã hủy');
      }

      // 2. Kiểm tra chuyển đổi hợp lệ
      const validTransitions: Record<string, string[]> = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['assigned', 'cancelled'],
        assigned: ['in_progress', 'waiting_customer_approval', 'cancelled'],
        waiting_customer_approval: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
      };

      if (validTransitions[oldStatus] && !validTransitions[oldStatus].includes(newStatus)) {
        throw new BadRequestException(`Không thể chuyển trạng thái từ ${oldStatus} sang ${newStatus}`);
      }
    }

    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === ServiceRequestStatus.completed) {
      if (!request.assignedTechnicianId) {
        throw new BadRequestException('Không thể hoàn thành yêu cầu dịch vụ chưa được phân công kỹ thuật viên');
      }
      if (dto.finalPrice === undefined || dto.finalPrice === null || dto.finalPrice < 0) {
        throw new BadRequestException('Giá cuối cùng không hợp lệ');
      }
      if (!dto.quoteId || !dto.version || !dto.completionNote?.trim()) throw new BadRequestException('Thiếu báo giá đã duyệt hoặc ghi chú hoàn thành');
      const latestQuote = await this.prisma.serviceQuote.findFirst({ where: { serviceRequestId: id }, include: { approvals: true }, orderBy: { version: 'desc' } });
      const approved = latestQuote?.id === dto.quoteId && latestQuote.version === dto.version && latestQuote.status === 'approved' && latestQuote.approvals.some(item => item.version === dto.version && item.decision === 'approved');
      if (!approved) throw new BadRequestException('Báo giá mới nhất chưa được khách hàng duyệt');
      updateData.finalPrice = dto.finalPrice;
      updateData.paymentStatus = request.paymentStatus || 'unpaid';

      // Tăng completedCount của thợ
      await this.prisma.technician.update({
        where: { id: request.assignedTechnicianId },
        data: {
          completedCount: { increment: 1 },
        },
      });
    }

    // Ghi status history
    const now = new Date().toISOString();
    const logNote = dto.completionNote || dto.note || `Cập nhật trạng thái thành ${newStatus}`;
    const oldHistory = (request.statusHistory as any[]) || [];
    const newHistory = [
      ...oldHistory,
      {
        status: newStatus,
        note: logNote,
        updatedBy: 'admin',
        createdAt: now,
      },
    ];
    updateData.statusHistory = newHistory;
    updateData.updatedAt = new Date();

    const updatedRequest = await this.prisma.serviceRequest.update({
      where: { id },
      data: updateData,
      include: {
        serviceCategory: true,
        assignedTechnician: true,
      },
    });

    // Giải phóng thợ nếu hoàn thành hoặc hủy
    if ((newStatus === ServiceRequestStatus.completed || newStatus === ServiceRequestStatus.cancelled) && request.assignedTechnicianId) {
      await this.updateTechnicianStatusAfterJobChange(request.assignedTechnicianId, request.id);
    }

    return {
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: toAdminDetail(updatedRequest as any),
    };
  }

  async assignTechnicianAdmin(id: string, dto: AssignTechnicianDto) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    }

    if (request.status === ServiceRequestStatus.completed || request.status === ServiceRequestStatus.cancelled) {
      throw new BadRequestException('Không thể phân công kỹ thuật viên cho yêu cầu dịch vụ đã hoàn thành hoặc đã hủy');
    }

    const tech = await this.prisma.technician.findUnique({
      where: { id: dto.technicianId },
    });
    if (!tech) {
      throw new NotFoundException('Không tìm thấy kỹ thuật viên');
    }

    // Kiểm tra thợ rảnh
    if (tech.status !== TechnicianStatus.available && request.assignedTechnicianId !== dto.technicianId) {
      throw new BadRequestException(`Kỹ thuật viên ${tech.name} hiện đang bận hoặc ngừng hoạt động!`);
    }

    // Kiểm tra kỹ năng (skills là Json chứa mảng các ID danh mục dịch vụ)
    const skills = (tech.skills as string[]) || [];
    if (!skills.includes(request.serviceCategoryId)) {
      throw new BadRequestException(`Kỹ thuật viên ${tech.name} không có kỹ năng sửa chữa loại thiết bị này!`);
    }

    // Kiểm tra địa bàn (workingAreas là Json chứa mảng tên các quận)
    const workingAreas = (tech.workingAreas as string[]) || [];
    if (!workingAreas.includes(request.district)) {
      throw new BadRequestException(`Kỹ thuật viên ${tech.name} không hỗ trợ hoạt động tại khu vực ${request.district}!`);
    }

    const oldTechnicianId = request.assignedTechnicianId;
    const now = new Date().toISOString();
    const logNote = `Phân công kỹ thuật viên ${tech.name}`;
    const oldHistory = (request.statusHistory as any[]) || [];
    const newHistory = [
      ...oldHistory,
      {
        status: ServiceRequestStatus.assigned,
        note: logNote,
        updatedBy: 'admin',
        createdAt: now,
      },
    ];

    const updatedRequest = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        assignedTechnicianId: dto.technicianId,
        status: ServiceRequestStatus.assigned,
        statusHistory: newHistory,
        updatedAt: new Date(),
      },
      include: {
        serviceCategory: true,
        assignedTechnician: true,
      },
    });

    // Chuyển trạng thái thợ mới sang busy
    await this.prisma.technician.update({
      where: { id: dto.technicianId },
      data: { status: TechnicianStatus.busy },
    });

    // Giải phóng thợ cũ nếu có
    if (oldTechnicianId && oldTechnicianId !== dto.technicianId) {
      await this.updateTechnicianStatusAfterJobChange(oldTechnicianId, request.id);
    }

    return {
      success: true,
      message: 'Phân công kỹ thuật viên thành công',
      data: toAdminDetail(updatedRequest as any),
    };
  }
}
