import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CustomerQueryDto } from './dto/customer-query.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: CustomerQueryDto) {
    // 1. Fetch all Orders with address and user
    const orders = await this.prisma.order.findMany({
      include: {
        address: true,
        user: true,
      },
    });

    // 2. Fetch all Service Requests
    const serviceRequests = await this.prisma.serviceRequest.findMany();

    // 3. Fetch all Users with role CUSTOMER
    const users = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER' },
    });

    // Map to aggregate customers by phone number
    const customersMap = new Map<string, {
      id: string;
      name: string;
      phone: string;
      email: string;
      orderCount: number;
      totalSpent: number;
      createdAt: Date;
    }>();

    // Helper to normalize phone numbers
    const normalizePhone = (p: string) => p.replace(/\s+/g, '').trim();

    // A. Process Users first
    for (const u of users) {
      const phone = u.phone ? normalizePhone(u.phone) : '';
      if (!phone) continue;

      customersMap.set(phone, {
        id: phone,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Khách hàng',
        phone: phone,
        email: u.email || '',
        orderCount: 0,
        totalSpent: 0,
        createdAt: u.createdAt,
      });
    }

    // B. Process Orders to aggregate orderCount and totalSpent
    for (const o of orders) {
      const phone = o.address?.phone ? normalizePhone(o.address.phone) : '';
      if (!phone) continue;

      const existing = customersMap.get(phone);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += Number(o.totalAmount);
        if (o.address?.fullName && existing.name === 'Khách hàng') {
          existing.name = o.address.fullName;
        }
        if (o.user?.email && !existing.email) {
          existing.email = o.user.email;
        }
        if (o.createdAt < existing.createdAt) {
          existing.createdAt = o.createdAt;
        }
      } else {
        customersMap.set(phone, {
          id: phone,
          name: o.address?.fullName || 'Khách hàng',
          phone: phone,
          email: o.user?.email || '',
          orderCount: 1,
          totalSpent: Number(o.totalAmount),
          createdAt: o.createdAt,
        });
      }
    }

    // C. Process Service Requests to capture customers who only booked services
    for (const sr of serviceRequests) {
      const phone = sr.customerPhone ? normalizePhone(sr.customerPhone) : '';
      if (!phone) continue;

      const existing = customersMap.get(phone);
      if (existing) {
        if (sr.customerName && existing.name === 'Khách hàng') {
          existing.name = sr.customerName;
        }
        if (sr.createdAt < existing.createdAt) {
          existing.createdAt = sr.createdAt;
        }
      } else {
        customersMap.set(phone, {
          id: phone,
          name: sr.customerName || 'Khách hàng',
          phone: phone,
          email: '',
          orderCount: 0,
          totalSpent: 0,
          createdAt: sr.createdAt,
        });
      }
    }

    // Convert map to array
    let customersList = Array.from(customersMap.values());

    // 4. Apply Search Filter in memory
    if (query?.q) {
      const searchVal = query.q.toLowerCase().trim();
      if (searchVal.length > 0) {
        customersList = customersList.filter(c =>
          c.name.toLowerCase().includes(searchVal) ||
          c.phone.includes(searchVal) ||
          c.email.toLowerCase().includes(searchVal)
        );
      }
    }

    // 5. Apply Sorting in memory
    const sortOrder = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const sortBy = query?.sortBy || 'createdAt';
    const allowedSortFields = ['name', 'email', 'phone', 'orderCount', 'totalOrders', 'totalSpent', 'createdAt'];

    if (allowedSortFields.includes(sortBy)) {
      customersList.sort((a: any, b: any) => {
        const fieldName = sortBy === 'totalOrders' ? 'orderCount' : sortBy;
        let valA = a[fieldName];
        let valB = b[fieldName];

        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();

        if (typeof valA === 'string') {
          return valA.localeCompare(valB) * sortOrder;
        }
        return (valA > valB ? 1 : valA < valB ? -1 : 0) * sortOrder;
      });
    }

    // 6. Apply Pagination in memory
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 10));
    const startIndex = (page - 1) * limit;
    const paginatedList = customersList.slice(startIndex, startIndex + limit);

    // Map response model format
    const result = paginatedList.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: result,
    };
  }
}
