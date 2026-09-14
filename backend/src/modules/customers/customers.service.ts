import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CustomerQueryDto } from './dto/customer-query.dto';

type ServiceCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceRequestCount: number;
  completedServiceCount: number;
  lastServiceAt: Date;
  serviceRevenue: number;
  serviceDebt: number;
  createdAt: Date;
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: CustomerQueryDto) {
    const serviceRequests = await this.prisma.serviceRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const customers = new Map<string, ServiceCustomer>();
    const normalizePhone = (phone: string) => phone.replace(/\s+/g, '').trim();

    for (const request of serviceRequests) {
      const phone = normalizePhone(request.customerPhone || '');
      if (!phone) continue;
      const price = Number(request.finalPrice || 0);
      const existing = customers.get(phone);
      if (!existing) {
        customers.set(phone, {
          id: phone,
          name: request.customerName || 'Khách hàng',
          phone,
          email: '',
          serviceRequestCount: 1,
          completedServiceCount: request.status === 'completed' ? 1 : 0,
          lastServiceAt: request.updatedAt,
          serviceRevenue: request.status === 'completed' ? price : 0,
          serviceDebt: request.status === 'completed' && request.paymentStatus !== 'paid' ? price : 0,
          createdAt: request.createdAt,
        });
        continue;
      }

      existing.serviceRequestCount += 1;
      existing.completedServiceCount += request.status === 'completed' ? 1 : 0;
      existing.serviceRevenue += request.status === 'completed' ? price : 0;
      existing.serviceDebt += request.status === 'completed' && request.paymentStatus !== 'paid' ? price : 0;
      if (request.updatedAt > existing.lastServiceAt) existing.lastServiceAt = request.updatedAt;
      if (request.createdAt < existing.createdAt) existing.createdAt = request.createdAt;
    }

    let result = Array.from(customers.values());
    if (query?.q?.trim()) {
      const search = query.q.toLowerCase().trim();
      result = result.filter((customer) =>
        customer.name.toLowerCase().includes(search) ||
        customer.phone.includes(search) ||
        customer.email.toLowerCase().includes(search),
      );
    }

    const sortOrder = query?.sortOrder?.toLowerCase() === 'asc' ? 1 : -1;
    const sortBy = query?.sortBy || 'lastServiceAt';
    const allowedSortFields = ['name', 'email', 'phone', 'serviceRequestCount', 'completedServiceCount', 'lastServiceAt', 'serviceRevenue', 'serviceDebt', 'createdAt'];
    if (allowedSortFields.includes(sortBy)) {
      result.sort((a, b) => {
        const first = a[sortBy as keyof ServiceCustomer];
        const second = b[sortBy as keyof ServiceCustomer];
        const firstValue = first instanceof Date ? first.getTime() : first;
        const secondValue = second instanceof Date ? second.getTime() : second;
        if (typeof firstValue === 'string' && typeof secondValue === 'string') {
          return firstValue.localeCompare(secondValue) * sortOrder;
        }
        return (Number(firstValue) - Number(secondValue)) * sortOrder;
      });
    }

    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 10));
    const data = result.slice((page - 1) * limit, page * limit).map((customer) => ({
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      lastServiceAt: customer.lastServiceAt.toISOString(),
    }));

    return { success: true, data, meta: { page, limit, total: result.length, totalPages: Math.ceil(result.length / limit) } };
  }
}
