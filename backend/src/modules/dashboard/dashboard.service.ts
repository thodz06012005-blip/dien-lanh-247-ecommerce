import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today Revenue (delivered orders today)
    // Querying Payment or Order. In NestJS schema, Order has deliveredAt or we can check shipping.deliveredAt.
    // Let's check Order status DELIVERED. We can query orders with status DELIVERED and updatedAt (or we can assume updatedAt is deliveredAt since it's updated to DELIVERED)
    const todayDeliveredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED,
        updatedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const todayRevenue = todayDeliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    // 2. Pending Orders
    const pendingOrders = await this.prisma.order.count({
      where: {
        status: OrderStatus.PENDING,
      },
    });

    // 3. New Customers (Users with role CUSTOMER created today)
    const newCustomers = await this.prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // 4. Total Products
    const totalProducts = await this.prisma.product.count();

    // 5. Total Orders
    const totalOrders = await this.prisma.order.count();

    // 6. Recent Orders (last 5 orders)
    const recentOrdersDb = await this.prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        address: true,
      },
    });

    const recentOrders = recentOrdersDb.map((o) => {
      const date = new Date(o.createdAt);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      return {
        key: String(o.id),
        orderNumber: o.orderNumber,
        customer: o.address?.fullName || 'Khách vãng lai',
        total: Number(o.totalAmount),
        status: (o.status || 'PENDING').toLowerCase(),
        date: formattedDate,
      };
    });

    return {
      success: true,
      data: {
        todayRevenue,
        pendingOrders,
        newCustomers,
        totalProducts,
        totalOrders,
        recentOrders,
      },
    };
  }
}
