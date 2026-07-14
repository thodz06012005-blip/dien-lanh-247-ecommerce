import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import {
  ServiceRequestPriority,
  ServiceRequestStatus,
  TechnicianStatus,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { CloudinaryService } from '../../integrations/cloudinary/cloudinary.service';
import { MailService } from '../../integrations/mail/mail.service';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestQueryDto } from './dto/service-request-query.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import {
  SERVICE_REQUEST_MEDIA_STAGES,
  SERVICE_REQUEST_TRANSITIONS,
  TERMINAL_SERVICE_REQUEST_STATUSES,
  assertTransitionAllowed,
  isWorkflowStatus,
  mapWorkflowToLegacyStatus,
  type ServiceRequestMediaStage,
  type ServiceRequestWorkflowStatus,
} from './service-request-workflow';

export interface ServiceRequestActor {
  actorType: 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'TECHNICIAN' | 'SYSTEM';
  actorId?: string;
  actorName?: string;
  ip?: string;
  userAgent?: string;
}

interface RawRequestRow {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string;
  district: string;
  priority: string;
  applianceType: string;
  issueDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  note: string | null;
  workflowStatus: string;
  requestVersion: number;
  source: string;
  estimatedPrice: unknown;
  finalPrice: unknown;
  paymentStatus: string;
  serviceCategoryId: string;
  serviceCategoryName: string;
  assignedTechnicianId: string | null;
  technicianName: string | null;
  technicianAvatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt: Date | null;
  confirmedAt: Date | null;
  assignedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  warrantyStartedAt: Date | null;
  closedAt: Date | null;
  lastStatusChangedAt: Date;
}

const ACTIVE_WORKFLOW_STATUSES: ServiceRequestWorkflowStatus[] = [
  'CONFIRMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'WARRANTY',
];

@Injectable()
export class ServiceRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mailService: MailService,
  ) {}

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('84') ? `0${digits.slice(2)}` : digits;
  }

  private maskPhone(phone: string) {
    const normalized = this.normalizePhone(phone);
    return `${normalized.slice(0, 3)}*****${normalized.slice(-2)}`;
  }

  private maskEmail(email: string | null) {
    if (!email) return null;
    const [local, domain] = email.split('@');
    if (!domain) return null;
    return `${local.slice(0, 1)}***@${domain}`;
  }

  private maskName(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return `${parts[0].slice(0, 1)}***`;
    return `${parts[0]} ${parts.slice(1).map((part) => `${part.slice(0, 1)}.`).join(' ')}`;
  }

  private hashIp(ip?: string) {
    if (!ip) return null;
    return createHash('sha256').update(`dl247:${ip}`).digest('hex');
  }

  private parseScheduledAt(date: string, timeSlot: string) {
    const match = timeSlot.match(/(\d{1,2}):(\d{2})/);
    const hour = match?.[1]?.padStart(2, '0') ?? '08';
    const minute = match?.[2] ?? '00';
    const parsed = new Date(`${date}T${hour}:${minute}:00+07:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private async generateRequestCode() {
    const now = new Date();
    const datePart = [
      String(now.getFullYear()).slice(-2),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const randomPart = randomBytes(3).toString('hex').toUpperCase();
      const code = `DL247-${datePart}-${randomPart}`;
      const existing = await this.prisma.serviceRequest.findUnique({ where: { id: code }, select: { id: true } });
      if (!existing) return code;
    }
    throw new BadRequestException('Không thể tạo mã yêu cầu duy nhất. Vui lòng thử lại.');
  }

  private async writeStatusEvent(
    client: PrismaService,
    requestId: string,
    fromStatus: ServiceRequestWorkflowStatus | null,
    toStatus: ServiceRequestWorkflowStatus,
    note: string | null,
    actor: ServiceRequestActor,
    metadata?: Record<string, unknown>,
  ) {
    await client.$executeRawUnsafe(
      `INSERT INTO ServiceRequestStatusEvent
        (requestId, fromStatus, toStatus, note, actorType, actorId, actorName, metadata, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      requestId,
      fromStatus,
      toStatus,
      note,
      actor.actorType,
      actor.actorId ?? null,
      actor.actorName ?? null,
      metadata ? JSON.stringify(metadata) : null,
    );
  }

  private async writeAudit(
    client: PrismaService,
    requestId: string,
    action: string,
    actor: ServiceRequestActor,
    metadata?: Record<string, unknown>,
  ) {
    await client.$executeRawUnsafe(
      `INSERT INTO ServiceRequestAudit
        (requestId, action, actorType, actorId, actorName, ipHash, userAgent, metadata, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      requestId,
      action,
      actor.actorType,
      actor.actorId ?? null,
      actor.actorName ?? null,
      this.hashIp(actor.ip),
      actor.userAgent?.slice(0, 500) ?? null,
      metadata ? JSON.stringify(metadata) : null,
    );
  }

  private async getRawRequest(id: string, phone?: string) {
    const params: unknown[] = [id];
    let phoneClause = '';
    if (phone) {
      phoneClause = ' AND sr.customerPhone = ?';
      params.push(this.normalizePhone(phone));
    }

    const rows = await this.prisma.$queryRawUnsafe<RawRequestRow[]>(
      `SELECT
        sr.id, sr.customerName, sr.customerPhone, sr.customerEmail, sr.customerAddress,
        sr.district, sr.priority, sr.applianceType, sr.issueDescription, sr.preferredDate,
        sr.preferredTimeSlot, sr.note, sr.workflowStatus, sr.requestVersion, sr.source,
        sr.estimatedPrice, sr.finalPrice, sr.paymentStatus, sr.serviceCategoryId,
        category.name AS serviceCategoryName, sr.assignedTechnicianId,
        technician.name AS technicianName, technician.avatar AS technicianAvatar,
        sr.createdAt, sr.updatedAt, sr.scheduledAt, sr.confirmedAt, sr.assignedAt,
        sr.startedAt, sr.completedAt, sr.warrantyStartedAt, sr.closedAt,
        sr.lastStatusChangedAt
       FROM ServiceRequest sr
       INNER JOIN ServiceCategory category ON category.id = sr.serviceCategoryId
       LEFT JOIN Technician technician ON technician.id = sr.assignedTechnicianId
       WHERE sr.id = ?${phoneClause}
       LIMIT 1`,
      ...params,
    );
    return rows[0] ?? null;
  }

  private async getTimeline(requestId: string) {
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, fromStatus, toStatus, note, actorType, actorId, actorName, metadata, createdAt
       FROM ServiceRequestStatusEvent
       WHERE requestId = ?
       ORDER BY createdAt ASC, id ASC`,
      requestId,
    );
  }

  private async getMedia(requestId: string) {
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, stage, url, mimeType, sizeBytes, width, height, caption,
              uploadedByType, uploadedById, createdAt
       FROM ServiceRequestMedia
       WHERE requestId = ?
       ORDER BY createdAt ASC, id ASC`,
      requestId,
    );
  }

  private async getAudits(requestId: string) {
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, action, actorType, actorId, actorName, metadata, createdAt
       FROM ServiceRequestAudit
       WHERE requestId = ?
       ORDER BY createdAt DESC, id DESC
       LIMIT 100`,
      requestId,
    );
  }

  private normalizeRow(row: RawRequestRow) {
    const status = isWorkflowStatus(row.workflowStatus) ? row.workflowStatus : 'NEW';
    return {
      ...row,
      status,
      workflowStatus: status,
      estimatedPrice: Number(row.estimatedPrice ?? 0),
      finalPrice: Number(row.finalPrice ?? 0),
      allowedTransitions: SERVICE_REQUEST_TRANSITIONS[status],
    };
  }

  private toCustomerView(row: RawRequestRow, timeline: Array<Record<string, unknown>>, media: Array<Record<string, unknown>>) {
    const normalized = this.normalizeRow(row);
    return {
      code: row.id,
      id: row.id,
      customerName: this.maskName(row.customerName),
      customerPhone: this.maskPhone(row.customerPhone),
      customerEmail: this.maskEmail(row.customerEmail),
      district: row.district,
      serviceCategory: { id: row.serviceCategoryId, name: row.serviceCategoryName },
      applianceType: row.applianceType,
      issueDescription: row.issueDescription,
      priority: row.priority,
      status: normalized.status,
      preferredDate: row.preferredDate,
      preferredTimeSlot: row.preferredTimeSlot,
      scheduledAt: row.scheduledAt,
      technician: row.technicianName
        ? { name: row.technicianName, avatar: row.technicianAvatar }
        : null,
      estimatedPrice: normalized.estimatedPrice,
      finalPrice: normalized.finalPrice,
      paymentStatus: row.paymentStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      timeline: timeline.map((event) => ({
        id: String(event.id),
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
        actorType: event.actorType,
        actorName: event.actorType === 'CUSTOMER' ? 'Khách hàng' : event.actorName,
        createdAt: event.createdAt,
      })),
      media: media.map((item) => ({
        id: String(item.id),
        stage: item.stage,
        url: item.url,
        mimeType: item.mimeType,
        caption: item.caption,
        createdAt: item.createdAt,
      })),
    };
  }

  async create(dto: CreateServiceRequestDto, actor: ServiceRequestActor) {
    const category = await this.prisma.serviceCategory.findUnique({ where: { id: dto.serviceCategoryId } });
    if (!category) throw new BadRequestException('Dịch vụ không tồn tại hoặc đã ngừng hoạt động');

    const preferredDate = new Date(`${dto.preferredDate}T00:00:00+07:00`);
    if (Number.isNaN(preferredDate.getTime())) throw new BadRequestException('Ngày hẹn không hợp lệ');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preferredDate < today) throw new BadRequestException('Ngày hẹn không được ở quá khứ');

    const code = await this.generateRequestCode();
    const phone = this.normalizePhone(dto.customerPhone);
    const district = dto.district.startsWith('Quận ') || dto.district.startsWith('Huyện ')
      ? dto.district.trim()
      : dto.district.trim();
    const scheduledAt = this.parseScheduledAt(dto.preferredDate, dto.preferredTimeSlot);
    const now = new Date().toISOString();

    await this.prisma.$transaction(async (tx) => {
      await tx.serviceRequest.create({
        data: {
          id: code,
          customerName: dto.customerName.trim(),
          customerPhone: phone,
          customerAddress: dto.customerAddress.trim(),
          district,
          serviceCategoryId: dto.serviceCategoryId,
          applianceType: dto.applianceType.trim(),
          issueDescription: dto.issueDescription.trim(),
          images: dto.images ?? [],
          preferredDate: dto.preferredDate,
          preferredTimeSlot: dto.preferredTimeSlot.trim(),
          note: dto.note?.trim() ?? '',
          status: ServiceRequestStatus.pending,
          priority: dto.priority ?? ServiceRequestPriority.medium,
          estimatedPrice: 0,
          finalPrice: 0,
          paymentStatus: 'unpaid',
          statusHistory: [
            {
              status: 'NEW',
              note: 'Khách hàng vừa gửi yêu cầu dịch vụ',
              updatedBy: 'customer',
              createdAt: now,
            },
          ],
        },
      });

      await tx.$executeRawUnsafe(
        `UPDATE ServiceRequest
         SET customerEmail = ?, workflowStatus = 'NEW', requestVersion = 1,
             source = 'WEB', scheduledAt = ?, lastStatusChangedAt = NOW(3),
             lookupLastFour = ?
         WHERE id = ?`,
        dto.customerEmail.trim().toLowerCase(),
        scheduledAt,
        phone.slice(-4),
        code,
      );

      await this.writeStatusEvent(
        tx as PrismaService,
        code,
        null,
        'NEW',
        'Khách hàng vừa gửi yêu cầu dịch vụ',
        actor,
        { priority: dto.priority ?? ServiceRequestPriority.medium, source: 'WEB' },
      );
      await this.writeAudit(tx as PrismaService, code, 'SERVICE_REQUEST_CREATED', actor, {
        serviceCategoryId: dto.serviceCategoryId,
        applianceType: dto.applianceType.trim(),
      });
    });

    void this.mailService.sendServiceRequestConfirmation(dto.customerEmail, {
      code,
      customerName: dto.customerName.trim(),
      preferredDate: dto.preferredDate,
      preferredTimeSlot: dto.preferredTimeSlot,
      serviceName: category.name,
    }).catch(() => undefined);

    return {
      success: true,
      message: 'Yêu cầu đã được tiếp nhận. Mã tra cứu đã gửi tới email của bạn.',
      data: {
        id: code,
        code,
        status: 'NEW',
        confirmationSent: true,
        preferredDate: dto.preferredDate,
        preferredTimeSlot: dto.preferredTimeSlot,
      },
    };
  }

  async lookup(code: string, phone: string, actor: ServiceRequestActor) {
    const normalizedCode = code.trim().toUpperCase();
    const row = await this.getRawRequest(normalizedCode, phone);
    if (!row) {
      throw new NotFoundException('Không tìm thấy yêu cầu với thông tin đã cung cấp');
    }
    const [timeline, media] = await Promise.all([this.getTimeline(row.id), this.getMedia(row.id)]);
    await this.writeAudit(this.prisma, row.id, 'CUSTOMER_LOOKUP_SUCCESS', actor);
    return { success: true, data: this.toCustomerView(row, timeline, media) };
  }

  async findOneCustomer(id: string, phone: string, actor: ServiceRequestActor) {
    if (!phone) throw new ForbiddenException('Cần mã yêu cầu và số điện thoại để tra cứu');
    return this.lookup(id, phone, actor);
  }

  async findMyRequests(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
    if (!user?.phone) return { success: true, data: [] };
    const phone = this.normalizePhone(user.phone);
    const rows = await this.prisma.$queryRawUnsafe<RawRequestRow[]>(
      `SELECT
        sr.id, sr.customerName, sr.customerPhone, sr.customerEmail, sr.customerAddress,
        sr.district, sr.priority, sr.applianceType, sr.issueDescription, sr.preferredDate,
        sr.preferredTimeSlot, sr.note, sr.workflowStatus, sr.requestVersion, sr.source,
        sr.estimatedPrice, sr.finalPrice, sr.paymentStatus, sr.serviceCategoryId,
        category.name AS serviceCategoryName, sr.assignedTechnicianId,
        technician.name AS technicianName, technician.avatar AS technicianAvatar,
        sr.createdAt, sr.updatedAt, sr.scheduledAt, sr.confirmedAt, sr.assignedAt,
        sr.startedAt, sr.completedAt, sr.warrantyStartedAt, sr.closedAt,
        sr.lastStatusChangedAt
       FROM ServiceRequest sr
       INNER JOIN ServiceCategory category ON category.id = sr.serviceCategoryId
       LEFT JOIN Technician technician ON technician.id = sr.assignedTechnicianId
       WHERE sr.customerPhone = ?
       ORDER BY sr.createdAt DESC
       LIMIT 100`,
      phone,
    );
    return {
      success: true,
      data: rows.map((row) => {
        const normalized = this.normalizeRow(row);
        return {
          id: row.id,
          code: row.id,
          status: normalized.status,
          priority: row.priority,
          applianceType: row.applianceType,
          serviceCategory: { id: row.serviceCategoryId, name: row.serviceCategoryName },
          preferredDate: row.preferredDate,
          preferredTimeSlot: row.preferredTimeSlot,
          estimatedPrice: normalized.estimatedPrice,
          finalPrice: normalized.finalPrice,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      }),
    };
  }

  async findAllAdmin(query: ServiceRequestQueryDto = new ServiceRequestQueryDto()) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const offset = (page - 1) * limit;
    const clauses = ['1 = 1'];
    const params: unknown[] = [];

    if (query.status) {
      clauses.push('sr.workflowStatus = ?');
      params.push(query.status);
    }
    if (query.priority) {
      clauses.push('sr.priority = ?');
      params.push(query.priority);
    }
    if (query.serviceCategoryId) {
      clauses.push('sr.serviceCategoryId = ?');
      params.push(query.serviceCategoryId);
    }
    if (query.district) {
      clauses.push('sr.district = ?');
      params.push(query.district);
    }
    if (query.technicianId) {
      clauses.push('sr.assignedTechnicianId = ?');
      params.push(query.technicianId);
    }
    if (query.dateFrom) {
      clauses.push('sr.createdAt >= ?');
      params.push(new Date(query.dateFrom));
    }
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setDate(end.getDate() + 1);
      clauses.push('sr.createdAt < ?');
      params.push(end);
    }
    if (query.q) {
      const keyword = `%${query.q.trim()}%`;
      clauses.push('(sr.id LIKE ? OR sr.customerName LIKE ? OR sr.customerPhone LIKE ? OR sr.customerEmail LIKE ?)');
      params.push(keyword, keyword, keyword, keyword);
    }

    if (query.quickFilter === 'new') clauses.push("sr.workflowStatus = 'NEW'");
    if (query.quickFilter === 'unassigned') clauses.push("sr.workflowStatus = 'CONFIRMED' AND sr.assignedTechnicianId IS NULL");
    if (query.quickFilter === 'active') clauses.push("sr.workflowStatus IN ('ASSIGNED','IN_PROGRESS')");
    if (query.quickFilter === 'waiting-parts') clauses.push("sr.workflowStatus = 'WAITING_PARTS'");
    if (query.quickFilter === 'warranty') clauses.push("sr.workflowStatus = 'WARRANTY'");
    if (query.quickFilter === 'overdue') {
      clauses.push("STR_TO_DATE(sr.preferredDate, '%Y-%m-%d') < CURDATE() AND sr.workflowStatus NOT IN ('COMPLETED','CLOSED','CANCELLED','REJECTED')");
    }

    const allowedSort = new Set(['createdAt', 'updatedAt', 'workflowStatus', 'priority', 'preferredDate', 'district', 'customerName']);
    const sortBy = allowedSort.has(query.sortBy ?? '') ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const whereSql = clauses.join(' AND ');

    const [rows, totals, statsRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<RawRequestRow[]>(
        `SELECT
          sr.id, sr.customerName, sr.customerPhone, sr.customerEmail, sr.customerAddress,
          sr.district, sr.priority, sr.applianceType, sr.issueDescription, sr.preferredDate,
          sr.preferredTimeSlot, sr.note, sr.workflowStatus, sr.requestVersion, sr.source,
          sr.estimatedPrice, sr.finalPrice, sr.paymentStatus, sr.serviceCategoryId,
          category.name AS serviceCategoryName, sr.assignedTechnicianId,
          technician.name AS technicianName, technician.avatar AS technicianAvatar,
          sr.createdAt, sr.updatedAt, sr.scheduledAt, sr.confirmedAt, sr.assignedAt,
          sr.startedAt, sr.completedAt, sr.warrantyStartedAt, sr.closedAt,
          sr.lastStatusChangedAt
         FROM ServiceRequest sr
         INNER JOIN ServiceCategory category ON category.id = sr.serviceCategoryId
         LEFT JOIN Technician technician ON technician.id = sr.assignedTechnicianId
         WHERE ${whereSql}
         ORDER BY sr.${sortBy} ${sortOrder}
         LIMIT ? OFFSET ?`,
        ...params,
        limit,
        offset,
      ),
      this.prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
        `SELECT COUNT(*) AS total FROM ServiceRequest sr WHERE ${whereSql}`,
        ...params,
      ),
      this.prisma.$queryRawUnsafe<Array<Record<string, bigint>>>(
        `SELECT
          SUM(workflowStatus = 'NEW') AS newCount,
          SUM(workflowStatus = 'CONFIRMED' AND assignedTechnicianId IS NULL) AS unassignedCount,
          SUM(workflowStatus IN ('ASSIGNED','IN_PROGRESS')) AS activeCount,
          SUM(workflowStatus = 'WAITING_PARTS') AS waitingPartsCount,
          SUM(workflowStatus = 'WARRANTY') AS warrantyCount,
          SUM(STR_TO_DATE(preferredDate, '%Y-%m-%d') < CURDATE()
              AND workflowStatus NOT IN ('COMPLETED','CLOSED','CANCELLED','REJECTED')) AS overdueCount
         FROM ServiceRequest`,
      ),
    ]);

    const total = Number(totals[0]?.total ?? 0);
    const stats = statsRows[0] ?? {};
    return {
      success: true,
      data: rows.map((row) => this.normalizeRow(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: Object.fromEntries(Object.entries(stats).map(([key, value]) => [key, Number(value ?? 0)])),
    };
  }

  async findOneAdmin(id: string) {
    const row = await this.getRawRequest(id.trim().toUpperCase());
    if (!row) throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    const [timeline, media, audits] = await Promise.all([
      this.getTimeline(row.id),
      this.getMedia(row.id),
      this.getAudits(row.id),
    ]);
    return {
      success: true,
      data: { ...this.normalizeRow(row), timeline, media, audits },
    };
  }

  async updateStatusAdmin(
    id: string,
    dto: UpdateServiceRequestStatusDto,
    actor: ServiceRequestActor,
  ) {
    const nextStatus = dto.status.toUpperCase();
    if (!isWorkflowStatus(nextStatus)) throw new BadRequestException('Trạng thái không hợp lệ');

    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRawUnsafe<Array<{ workflowStatus: string; assignedTechnicianId: string | null; statusHistory: unknown }>>(
        'SELECT workflowStatus, assignedTechnicianId, statusHistory FROM ServiceRequest WHERE id = ? FOR UPDATE',
        id,
      );
      const current = locked[0];
      if (!current || !isWorkflowStatus(current.workflowStatus)) throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
      const currentStatus = current.workflowStatus;

      if (!assertTransitionAllowed(currentStatus, nextStatus)) {
        throw new BadRequestException(`Không thể chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`);
      }
      if ((nextStatus === 'ASSIGNED' || nextStatus === 'IN_PROGRESS' || nextStatus === 'COMPLETED') && !current.assignedTechnicianId) {
        throw new BadRequestException('Yêu cầu phải được phân công kỹ thuật viên trước');
      }
      if (nextStatus === 'RESCHEDULED' && (!dto.preferredDate || !dto.preferredTimeSlot)) {
        throw new BadRequestException('Cần cung cấp ngày và khung giờ mới khi hẹn lại');
      }
      if (nextStatus === 'COMPLETED' && (dto.finalPrice === undefined || dto.finalPrice < 0)) {
        throw new BadRequestException('Cần nhập chi phí thực tế hợp lệ khi hoàn thành');
      }

      const legacyStatus = mapWorkflowToLegacyStatus(nextStatus);
      const oldHistory = Array.isArray(current.statusHistory) ? current.statusHistory : [];
      const compatibilityHistory = [
        ...oldHistory,
        {
          status: nextStatus,
          note: dto.note ?? `Cập nhật trạng thái thành ${nextStatus}`,
          updatedBy: actor.actorName ?? actor.actorType,
          createdAt: new Date().toISOString(),
        },
      ];

      await tx.serviceRequest.update({
        where: { id },
        data: {
          status: legacyStatus as ServiceRequestStatus,
          statusHistory: compatibilityHistory,
          ...(dto.finalPrice !== undefined ? { finalPrice: dto.finalPrice } : {}),
          ...(nextStatus === 'COMPLETED' ? { paymentStatus: 'unpaid' } : {}),
          ...(dto.preferredDate ? { preferredDate: dto.preferredDate } : {}),
          ...(dto.preferredTimeSlot ? { preferredTimeSlot: dto.preferredTimeSlot } : {}),
        },
      });

      const timestampUpdates: string[] = [];
      if (nextStatus === 'CONFIRMED') timestampUpdates.push('confirmedAt = COALESCE(confirmedAt, NOW(3))');
      if (nextStatus === 'ASSIGNED') timestampUpdates.push('assignedAt = COALESCE(assignedAt, NOW(3))');
      if (nextStatus === 'IN_PROGRESS') timestampUpdates.push('startedAt = COALESCE(startedAt, NOW(3))');
      if (nextStatus === 'COMPLETED') timestampUpdates.push('completedAt = COALESCE(completedAt, NOW(3))');
      if (nextStatus === 'WARRANTY') timestampUpdates.push('warrantyStartedAt = COALESCE(warrantyStartedAt, NOW(3))');
      if (nextStatus === 'CLOSED') timestampUpdates.push('closedAt = COALESCE(closedAt, NOW(3))');
      if (dto.preferredDate && dto.preferredTimeSlot) {
        timestampUpdates.push('scheduledAt = ?');
      }
      const scheduledAt = dto.preferredDate && dto.preferredTimeSlot
        ? this.parseScheduledAt(dto.preferredDate, dto.preferredTimeSlot)
        : null;

      await tx.$executeRawUnsafe(
        `UPDATE ServiceRequest
         SET workflowStatus = ?, requestVersion = requestVersion + 1,
             lastStatusChangedAt = NOW(3)
             ${timestampUpdates.length ? `, ${timestampUpdates.join(', ')}` : ''}
         WHERE id = ?`,
        nextStatus,
        ...(scheduledAt ? [scheduledAt] : []),
        id,
      );

      await this.writeStatusEvent(
        tx as PrismaService,
        id,
        currentStatus,
        nextStatus,
        dto.note ?? null,
        actor,
        dto.preferredDate ? { preferredDate: dto.preferredDate, preferredTimeSlot: dto.preferredTimeSlot } : undefined,
      );
      await this.writeAudit(tx as PrismaService, id, 'SERVICE_REQUEST_STATUS_CHANGED', actor, {
        from: currentStatus,
        to: nextStatus,
        finalPrice: dto.finalPrice,
      });

      if (nextStatus === 'COMPLETED' && current.assignedTechnicianId) {
        await tx.technician.update({
          where: { id: current.assignedTechnicianId },
          data: { completedCount: { increment: 1 } },
        });
      }
    });

    if (TERMINAL_SERVICE_REQUEST_STATUSES.includes(nextStatus) || nextStatus === 'COMPLETED') {
      const row = await this.getRawRequest(id);
      if (row?.assignedTechnicianId) await this.updateTechnicianAvailability(row.assignedTechnicianId, id);
    }
    return this.findOneAdmin(id);
  }

  async assignTechnicianAdmin(id: string, dto: AssignTechnicianDto, actor: ServiceRequestActor) {
    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRawUnsafe<Array<{ workflowStatus: string; assignedTechnicianId: string | null; serviceCategoryId: string; district: string; statusHistory: unknown }>>(
        'SELECT workflowStatus, assignedTechnicianId, serviceCategoryId, district, statusHistory FROM ServiceRequest WHERE id = ? FOR UPDATE',
        id,
      );
      const request = locked[0];
      if (!request || !isWorkflowStatus(request.workflowStatus)) throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
      if (!['CONFIRMED', 'RESCHEDULED', 'ASSIGNED'].includes(request.workflowStatus)) {
        throw new BadRequestException('Chỉ được phân công yêu cầu đã xác nhận hoặc hẹn lại');
      }

      const technician = await tx.technician.findUnique({ where: { id: dto.technicianId } });
      if (!technician) throw new NotFoundException('Không tìm thấy kỹ thuật viên');
      if (technician.status !== TechnicianStatus.available && request.assignedTechnicianId !== technician.id) {
        throw new BadRequestException(`Kỹ thuật viên ${technician.name} hiện không sẵn sàng`);
      }
      const skills = Array.isArray(technician.skills) ? technician.skills as string[] : [];
      if (!skills.includes(request.serviceCategoryId)) {
        throw new BadRequestException(`Kỹ thuật viên ${technician.name} chưa có kỹ năng phù hợp`);
      }
      const workingAreas = Array.isArray(technician.workingAreas) ? technician.workingAreas as string[] : [];
      if (!workingAreas.includes(request.district)) {
        throw new BadRequestException(`Kỹ thuật viên ${technician.name} không phụ trách khu vực ${request.district}`);
      }

      const oldTechnicianId = request.assignedTechnicianId;
      const oldHistory = Array.isArray(request.statusHistory) ? request.statusHistory : [];
      await tx.serviceRequest.update({
        where: { id },
        data: {
          assignedTechnicianId: technician.id,
          status: ServiceRequestStatus.assigned,
          statusHistory: [
            ...oldHistory,
            {
              status: 'ASSIGNED',
              note: `Phân công kỹ thuật viên ${technician.name}`,
              updatedBy: actor.actorName ?? actor.actorType,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
      await tx.$executeRawUnsafe(
        `UPDATE ServiceRequest
         SET workflowStatus = 'ASSIGNED', assignedAt = COALESCE(assignedAt, NOW(3)),
             requestVersion = requestVersion + 1, lastStatusChangedAt = NOW(3)
         WHERE id = ?`,
        id,
      );
      await tx.technician.update({ where: { id: technician.id }, data: { status: TechnicianStatus.busy } });
      await this.writeStatusEvent(
        tx as PrismaService,
        id,
        request.workflowStatus as ServiceRequestWorkflowStatus,
        'ASSIGNED',
        `Phân công kỹ thuật viên ${technician.name}`,
        actor,
        { technicianId: technician.id },
      );
      await this.writeAudit(tx as PrismaService, id, 'SERVICE_REQUEST_ASSIGNED', actor, {
        oldTechnicianId,
        newTechnicianId: technician.id,
      });

      if (oldTechnicianId && oldTechnicianId !== technician.id) {
        await this.updateTechnicianAvailability(oldTechnicianId, id, tx as PrismaService);
      }
    });
    return this.findOneAdmin(id);
  }

  private async updateTechnicianAvailability(
    technicianId: string,
    excludeRequestId?: string,
    client: PrismaService = this.prisma,
  ) {
    const params: unknown[] = [technicianId];
    let excludeClause = '';
    if (excludeRequestId) {
      excludeClause = ' AND id <> ?';
      params.push(excludeRequestId);
    }
    const active = await client.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*) AS total
       FROM ServiceRequest
       WHERE assignedTechnicianId = ?
         AND workflowStatus IN ('ASSIGNED','IN_PROGRESS','WAITING_PARTS','WARRANTY')${excludeClause}`,
      ...params,
    );
    await client.technician.update({
      where: { id: technicianId },
      data: { status: Number(active[0]?.total ?? 0) > 0 ? TechnicianStatus.busy : TechnicianStatus.available },
    });
  }

  async uploadMedia(
    id: string,
    files: Express.Multer.File[],
    requestedStage: string,
    actor: ServiceRequestActor,
    phone?: string,
    caption?: string,
  ) {
    if (!files?.length) throw new BadRequestException('Vui lòng chọn ít nhất một ảnh');
    if (files.length > 5) throw new BadRequestException('Mỗi lần chỉ được tải tối đa 5 ảnh');
    if (!SERVICE_REQUEST_MEDIA_STAGES.includes(requestedStage as ServiceRequestMediaStage)) {
      throw new BadRequestException('Giai đoạn hình ảnh không hợp lệ');
    }

    const request = actor.actorType === 'CUSTOMER'
      ? await this.getRawRequest(id, phone)
      : await this.getRawRequest(id);
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu với thông tin đã cung cấp');

    const status = isWorkflowStatus(request.workflowStatus) ? request.workflowStatus : 'NEW';
    if (actor.actorType === 'CUSTOMER' && !['NEW', 'CONFIRMED', 'RESCHEDULED'].includes(status)) {
      throw new ForbiddenException('Không thể bổ sung ảnh khi yêu cầu đã bắt đầu xử lý');
    }
    const stage: ServiceRequestMediaStage = actor.actorType === 'CUSTOMER'
      ? 'CUSTOMER_BEFORE'
      : requestedStage as ServiceRequestMediaStage;

    const uploaded: Array<{ secure_url: string; public_id: string; resource_type: string; bytes?: number; width?: number; height?: number }> = [];
    try {
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Chỉ chấp nhận tệp hình ảnh');
        const result = await this.cloudinaryService.uploadFile(file, `service-requests/${id.toLowerCase()}`);
        uploaded.push(result);
      }

      await this.prisma.$transaction(async (tx) => {
        for (let index = 0; index < uploaded.length; index += 1) {
          const item = uploaded[index];
          const file = files[index];
          await tx.$executeRawUnsafe(
            `INSERT INTO ServiceRequestMedia
              (requestId, stage, url, publicId, mimeType, sizeBytes, width, height,
               caption, uploadedByType, uploadedById, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
            id,
            stage,
            item.secure_url,
            item.public_id,
            file.mimetype,
            item.bytes ?? file.size ?? null,
            item.width ?? null,
            item.height ?? null,
            caption?.trim() || null,
            actor.actorType,
            actor.actorId ?? null,
          );
        }
        await this.writeAudit(tx as PrismaService, id, 'SERVICE_REQUEST_MEDIA_UPLOADED', actor, {
          stage,
          count: uploaded.length,
        });
      });
    } catch (error) {
      await Promise.all(uploaded.map((item) => this.cloudinaryService.deleteFile(item.public_id).catch(() => undefined)));
      throw error;
    }

    return { success: true, message: 'Tải ảnh thành công', data: await this.getMedia(id) };
  }
}
