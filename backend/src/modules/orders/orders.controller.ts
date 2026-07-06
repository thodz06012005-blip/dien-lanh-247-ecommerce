import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuditLogService } from '../audit/audit-log.service';

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // Customer: Place a new order (anonymous / guest)
  @Post('orders')
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.createOrder(createOrderDto);
    return {
      success: true,
      message: 'Đặt hàng thành công',
      data: order,
    };
  }

  // Customer: View order history by phone
  @Get('orders')
  async getOrdersCustomer(@Query('phone') phone?: string) {
    if (!phone) return { success: true, data: [] };
    const list = await this.ordersService.getOrdersCustomer(phone);
    return {
      success: true,
      data: list,
    };
  }

  // Customer: View order details by id and phone
  @Get('orders/:id')
  async getOrderCustomerById(@Param('id') id: string, @Query('phone') phone: string) {
    const order = await this.ordersService.getOrderCustomerById(id, phone);
    return {
      success: true,
      data: order,
    };
  }

  // Customer: Cancel an order by id and phone
  @Patch('orders/:id/cancel')
  async cancelOrderCustomer(
    @Param('id') id: string,
    @Query('phone') phone?: string,
    @Body('phone') bodyPhone?: string,
  ) {
    const activePhone = phone || bodyPhone;
    const order = await this.ordersService.cancelOrderCustomer(id, activePhone || '');
    return {
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order,
    };
  }

  // Admin: View all orders
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Get('admin/orders')
  async findAllAdmin(@Query() query: OrderQueryDto) {
    const orders = await this.ordersService.findAllAdmin(query);
    return {
      success: true,
      data: orders,
    };
  }

  // Admin: View a specific order
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Get('admin/orders/:id')
  async findOneAdmin(@Param('id') id: string) {
    const order = await this.ordersService.findOneAdmin(id);
    return {
      success: true,
      data: order,
    };
  }

  // Admin: Update order status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Patch('admin/orders/:id/status')
  async updateStatusAdmin(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    const oldOrder = await this.ordersService.findOneAdmin(id);
    const order = await this.ordersService.updateStatusAdmin(id, updateStatusDto);
    this.auditLogService.auditSuccess(req, 'ORDER_STATUS_UPDATED', 'order', id, { from: oldOrder.status, to: order.status, paymentStatus: order.paymentStatus }, 'Order status updated successfully');
    return {
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    };
  }
}
