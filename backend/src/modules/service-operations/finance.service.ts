import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { monthBoundsInVietnam, paymentSummary, signedPaymentAmount } from '../../domain/finance';
import { PrismaService } from '../../core/database/prisma.service';
import { CreatePaymentEntryDto } from './finance.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async appendEntry(requestId: string, dto: CreatePaymentEntryDto, actorId: string) {
    const db = this.prisma as any;
    const existing = await db.servicePaymentEntry.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) {
      if (existing.serviceRequestId !== requestId) throw new BadRequestException('Idempotency key đã được sử dụng');
      return { success: true, data: existing, idempotent: true };
    }

    const request = await db.serviceRequest.findUnique({ where: { id: requestId }, include: { paymentEntries: true } });
    if (!request || request.status !== 'completed') throw new NotFoundException('Không tìm thấy công việc đã hoàn thành');
    if (dto.type !== 'adjustment' && dto.amount <= 0) throw new BadRequestException('Số tiền phải lớn hơn 0');
    if (dto.type === 'adjustment' && dto.amount === 0) throw new BadRequestException('Giá trị điều chỉnh phải khác 0');

    const current = paymentSummary(Number(request.finalPrice), request.paymentEntries);
    const nextNet = current.collected + signedPaymentAmount(dto.type, dto.amount);
    if (nextNet < 0 || nextNet > Number(request.finalPrice)) throw new BadRequestException('Số dư sau giao dịch không hợp lệ');

    let entry: any;
    try {
      entry = await db.servicePaymentEntry.create({ data: {
        serviceRequestId: requestId,
        type: dto.type,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
        receivedBy: actorId,
        receivedAt: new Date(dto.occurredAt),
        idempotencyKey: dto.idempotencyKey,
      } });
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error;
      entry = await db.servicePaymentEntry.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
      if (entry?.serviceRequestId !== requestId) throw new BadRequestException('Idempotency key đã được sử dụng');
      return { success: true, data: entry, idempotent: true };
    }
    const summary = paymentSummary(Number(request.finalPrice), [...request.paymentEntries, entry]);
    return { success: true, data: entry, paymentSummary: summary };
  }

  async ledger(requestId: string) {
    const db = this.prisma as any;
    const request = await db.serviceRequest.findUnique({ where: { id: requestId }, include: { paymentEntries: { orderBy: { receivedAt: 'desc' } } } });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu dịch vụ');
    return { success: true, data: request.paymentEntries, paymentSummary: paymentSummary(Number(request.finalPrice), request.paymentEntries) };
  }

  async report(month: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new BadRequestException('Tháng báo cáo không hợp lệ');
    const db = this.prisma as any;
    const bounds = monthBoundsInVietnam(month);
    const [snapshots, entries] = await Promise.all([
      db.serviceFinanceSnapshot.findMany({ where: { completedAt: bounds }, include: { serviceRequest: { include: { assignedTechnician: true, paymentEntries: true } } } }),
      db.servicePaymentEntry.findMany({ where: { receivedAt: bounds }, orderBy: { receivedAt: 'asc' } }),
    ]);
    const requests = snapshots.map((row: any) => {
      const summary = paymentSummary(Number(row.revenue), row.serviceRequest.paymentEntries);
      return {
        id: row.serviceRequestId,
        completedAt: row.completedAt,
        customerName: row.serviceRequest.customerName,
        applianceType: row.serviceRequest.applianceType,
        technicianId: row.serviceRequest.assignedTechnicianId,
        technicianName: row.serviceRequest.assignedTechnician?.name || 'Chưa xác định',
        revenue: Number(row.revenue),
        collected: summary.collected,
        debt: summary.debt,
        partsCost: Number(row.partsCost),
        technicianPay: Number(row.technicianPay),
        estimatedProfit: Number(row.revenue) - Number(row.partsCost) - Number(row.technicianPay),
        paymentStatus: summary.status,
        settlementStatus: 'pending',
      };
    });
    const revenue = requests.reduce((sum: number, row: any) => sum + row.revenue, 0);
    const collected = entries.reduce((sum: number, row: any) => sum + signedPaymentAmount(row.type, Number(row.amount)), 0);
    const partsCost = requests.reduce((sum: number, row: any) => sum + row.partsCost, 0);
    const technicianPay = requests.reduce((sum: number, row: any) => sum + row.technicianPay, 0);
    return { success: true, data: { month, timezone: 'Asia/Ho_Chi_Minh', recognitionPolicy: 'completion_snapshot', totals: { jobs: requests.length, revenue, collected, debt: requests.reduce((sum: number, row: any) => sum + row.debt, 0), partsCost, technicianPay, estimatedProfit: revenue - partsCost - technicianPay }, byDay: [], byTechnician: [], byService: [], requests, cashEntries: entries, generatedAt: new Date().toISOString() } };
  }
}
