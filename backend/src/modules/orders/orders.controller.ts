import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { ADMIN_PERMISSIONS } from '../../common/auth/admin-permissions';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('orders')
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.createOrder(createOrderDto);
    return { success: true, message: 'Đặt hàng thành công', data: order };
  }

  @Get('orders')
  async getOrdersCustomer(@Query('phone') phone?: string) {
    if (!phone) return { success: true, data: [] };
    return { success: true, data: await this.ordersService.getOrdersCustomer(phone) };
  }

  @Get('orders/:id')
  async getOrderCustomerById(@Param('id') id: string, @Query('phone') phone: string) {
    return { success: true, data: await this.ordersService.getOrderCustomerById(id, phone) };
  }

  @Patch('orders/:id/cancel')
  async cancelOrderCustomer(@Param('id') id: string, @Query('phone') phone?: string, @Body('phone') bodyPhone?: string) {
    const order = await this.ordersService.cancelOrderCustomer(id, phone || bodyPhone || '');
    return { success: true, message: 'Hủy đơn hàng thành công', data: order };
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.ORDERS_VIEW)
  @Get('admin/orders')
  async findAllAdmin(@Query() query: OrderQueryDto) {
    return { success: true, data: await this.ordersService.findAllAdmin(query) };
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.ORDERS_VIEW)
  @Get('admin/orders/:id')
  async findOneAdmin(@Param('id') id: string) {
    return { success: true, data: await this.ordersService.findOneAdmin(id) };
  }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Permissions(ADMIN_PERMISSIONS.ORDERS_MANAGE)
  @Patch('admin/orders/:id/status')
  async updateStatusAdmin(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    const oldOrder = await this.ordersService.findOneAdmin(id);
    const order = await this.ordersService.updateStatusAdmin(id, updateStatusDto);
    this.auditLogService.auditSuccess(req, 'ORDER_STATUS_UPDATED', 'order', id, { from: oldOrder.status, to: order.status, paymentStatus: order.paymentStatus }, 'Order status updated successfully');
    return { success: true, message: 'Cập nhật trạng thái đơn hàng thành công', data: order };
  }
}
