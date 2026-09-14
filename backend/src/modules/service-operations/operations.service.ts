import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { SaveInspectionDto } from './operations.dto';
@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}
  async saveInspection(requestId: string, dto: SaveInspectionDto, actorId: string) {
    const request = await this.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    if (['completed','cancelled'].includes(request.status)) throw new BadRequestException('Không thể cập nhật yêu cầu đã kết thúc');
    const latest = await this.prisma.serviceQuote.findFirst({ where: { serviceRequestId: requestId }, orderBy: { version: 'desc' } });
    const total = dto.labor + dto.parts + dto.travel + dto.other;
    if (total <= 0) throw new BadRequestException('Tổng báo giá phải lớn hơn 0');
    return this.prisma.$transaction(async tx => {
      if (latest && ['sent','approved'].includes(latest.status)) await tx.serviceQuote.update({ where: { id: latest.id }, data: { status: 'superseded' } });
      const quote = await tx.serviceQuote.create({ data: { serviceRequestId: requestId, version: (latest?.version || 0) + 1, diagnosis: dto.diagnosis.trim(), labor: dto.labor, parts: dto.parts, travel: dto.travel, other: dto.other, total, validUntil: dto.validUntil ? new Date(dto.validUntil) : new Date(Date.now() + 7*86400000), createdBy: actorId } });
      await tx.serviceRequest.update({ where: { id: requestId }, data: { estimatedPrice: total, ...(latest ? { status: 'waiting_customer_approval' as any } : {}) } });
      return { success: true, data: quote, message: `Đã tạo báo giá nháp phiên bản ${quote.version}` };
    });
  }
}
