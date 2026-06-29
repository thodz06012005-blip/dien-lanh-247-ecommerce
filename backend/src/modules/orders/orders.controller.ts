import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('admin/orders')
  findAllAdmin() {
    return this.ordersService.findAllAdmin();
  }

  // Admin: View a specific order
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('admin/orders/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  // Admin: Update order status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Patch('admin/orders/:id/status')
  updateStatusAdmin(@Param('id') id: string, @Body() updateStatusDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatusAdmin(id, updateStatusDto);
  }
}

