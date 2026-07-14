import { Injectable } from '@nestjs/common';
import { OrderStatus, TechnicianStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';

interface CountRow {
  total: bigint | number;
}

interface RevenueRow {
  day: Date | string;
  revenue: string | number;
  orders: bigint | number;
}

interface StatusRow {
  status: string;
  total: bigint | number;
}

interface ServiceAttentionRow {
  id: string;
  customerName: string;
  applianceType: string;
  workflowStatus: string;
  priority: string;
  createdAt: Date;
  scheduledAt: Date | null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const staleOrderBefore = new Date(now.getTime() - 24 * 60 * 60_000);

    const [
      todayRevenueAggregate,
      totalOrders,
      pendingOrders,
      newCustomers,
      totalProducts,
      openServiceRows,
      activeTechnicians,
      lowStockVariants,
      recentOrdersDb,
      revenueRows,
      orderStatusRows,
      serviceStatusRows,
      staleOrders,
      urgentServiceRequests,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED, updatedAt: { gte: todayStart } },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: todayStart } } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.$queryRawUnsafe<CountRow[]>(
        `SELECT COUNT(*) AS total FROM ServiceRequest
         WHERE workflowStatus NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED')`,
      ),
      this.prisma.technician.count({
        where: { status: { in: [TechnicianStatus.available, TechnicianStatus.busy] } },
      }),
      this.prisma.variant.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: 'asc' },
        take: 8,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      }),
      this.prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { address: true },
      }),
      this.prisma.$queryRawUnsafe<RevenueRow[]>(
        `SELECT DATE(updatedAt) AS day, COALESCE(SUM(totalAmount), 0) AS revenue, COUNT(*) AS orders
         FROM \`Order\`
         WHERE status = 'DELIVERED' AND updatedAt >= ?
         GROUP BY DATE(updatedAt)
         ORDER BY day ASC`,
        sevenDaysAgo,
      ),
      this.prisma.$queryRawUnsafe<StatusRow[]>(
        `SELECT status, COUNT(*) AS total FROM \`Order\` GROUP BY status ORDER BY total DESC`,
      ),
      this.prisma.$queryRawUnsafe<StatusRow[]>(
        `SELECT workflowStatus AS status, COUNT(*) AS total
         FROM ServiceRequest GROUP BY workflowStatus ORDER BY total DESC`,
      ),
      this.prisma.order.findMany({
        where: { status: OrderStatus.PENDING, createdAt: { lte: staleOrderBefore } },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: { address: true },
      }),
      this.prisma.$queryRawUnsafe<ServiceAttentionRow[]>(
        `SELECT id, customerName, applianceType, workflowStatus, priority, createdAt, scheduledAt
         FROM ServiceRequest
         WHERE priority = 'urgent'
           AND workflowStatus NOT IN ('COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED')
         ORDER BY createdAt ASC LIMIT 5`,
      ),
    ]);

    const revenueMap = new Map(
      revenueRows.map((row) => [
        new Date(row.day).toISOString().slice(0, 10),
        { revenue: Number(row.revenue), orders: Number(row.orders) },
      ]),
    );
    const revenue7d = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const value = revenueMap.get(key) ?? { revenue: 0, orders: 0 };
      return { date: key, ...value };
    });

    const attention = [
      ...urgentServiceRequests.map((request) => ({
        id: `service:${request.id}`,
        type: 'urgent_service',
        severity: 'critical',
        title: `Yêu cầu khẩn ${request.id}`,
        description: `${request.customerName} · ${request.applianceType}`,
        href: `/service-requests/${request.id}`,
        createdAt: request.createdAt,
        dueAt: request.scheduledAt,
      })),
      ...staleOrders.map((order) => ({
        id: `order:${order.id}`,
        type: 'stale_order',
        severity: 'warning',
        title: `Đơn ${order.orderNumber} chờ xác nhận`,
        description: order.address?.fullName || 'Khách hàng',
        href: '/orders',
        createdAt: order.createdAt,
        dueAt: null,
      })),
      ...lowStockVariants.slice(0, 5).map((variant) => ({
        id: `stock:${variant.id}`,
        type: 'low_stock',
        severity: variant.stock === 0 ? 'critical' : 'warning',
        title: `${variant.product.name} sắp hết hàng`,
        description: `${variant.sku} · tồn ${variant.stock}`,
        href: '/products',
        createdAt: variant.createdAt,
        dueAt: null,
      })),
    ].sort((left, right) => {
      const severity = { critical: 0, warning: 1 } as const;
      const bySeverity = severity[left.severity as keyof typeof severity] - severity[right.severity as keyof typeof severity];
      return bySeverity || new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    }).slice(0, 12);

    return {
      success: true,
      data: {
        generatedAt: now.toISOString(),
        kpis: {
          todayRevenue: Number(todayRevenueAggregate._sum.totalAmount ?? 0),
          totalOrders,
          pendingOrders,
          newCustomers,
          totalProducts,
          openServiceRequests: Number(openServiceRows[0]?.total ?? 0),
          activeTechnicians,
          lowStockVariants: lowStockVariants.length,
        },
        charts: {
          revenue7d,
          orderStatus: orderStatusRows.map((row) => ({ status: row.status, total: Number(row.total) })),
          serviceStatus: serviceStatusRows.map((row) => ({ status: row.status, total: Number(row.total) })),
        },
        attention,
        recentOrders: recentOrdersDb.map((order) => ({
          key: String(order.id),
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.address?.fullName || 'Khách hàng',
          total: Number(order.totalAmount),
          status: order.status.toLowerCase(),
          createdAt: order.createdAt,
        })),
        lowStock: lowStockVariants.map((variant) => ({
          id: variant.id,
          productId: variant.product.id,
          name: variant.product.name,
          sku: variant.sku,
          stock: variant.stock,
          thumbnail: variant.product.images[0]?.url ?? null,
        })),
      },
    };
  }
}
