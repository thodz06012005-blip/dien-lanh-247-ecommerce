import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
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
    const customersList = Array.from(customersMap.values()).map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: customersList,
    };
  }
}
