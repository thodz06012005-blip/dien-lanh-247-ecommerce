import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const overdueThreshold = new Date(now.getTime() - 30 * 60 * 1000);

    const [requests, techniciansAvailable] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        select: {
          status: true,
          assignedTechnicianId: true,
          finalPrice: true,
          paymentStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.technician.count({ where: { status: 'available' } }),
    ]);

    const pending = requests.filter((request) => request.status === 'pending').length;
    const overdue = requests.filter(
      (request) => request.status === 'pending' && request.createdAt < overdueThreshold,
    ).length;
    const unassigned = requests.filter(
      (request) => request.status === 'confirmed' && !request.assignedTechnicianId,
    ).length;
    const inProgress = requests.filter((request) =>
      request.status === 'assigned' || request.status === 'in_progress',
    ).length;
    const completedTodayRequests = requests.filter(
      (request) => request.status === 'completed' && request.updatedAt >= todayStart,
    );
    const serviceRevenueToday = completedTodayRequests.reduce(
      (sum, request) => sum + Number(request.finalPrice),
      0,
    );
    const collectedToday = completedTodayRequests
      .filter((request) => request.paymentStatus === 'paid')
      .reduce((sum, request) => sum + Number(request.finalPrice), 0);

    return {
      success: true,
      data: {
        pending,
        overdue,
        unassigned,
        inProgress,
        completedToday: completedTodayRequests.length,
        serviceRevenueToday,
        collectedToday,
        techniciansAvailable,
      },
    };
  }
}
