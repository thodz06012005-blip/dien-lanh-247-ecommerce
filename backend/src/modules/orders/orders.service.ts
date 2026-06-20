import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: number, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get Cart
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { variant: { include: { product: true } } },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Giỏ hàng trống');
      }

      // 2. Validate Address
      const address = await tx.address.findFirst({
        where: { id: dto.addressId, userId },
      });
      if (!address) {
        throw new NotFoundException('Không tìm thấy địa chỉ giao hàng');
      }

      // 3. Calculate Totals
      let subtotal = new Prisma.Decimal(0);
      const orderItemsData = cart.items.map((item) => {
        // Ensure stock
        if (item.variant.stock < item.quantity) {
          throw new BadRequestException(`Sản phẩm ${item.variant.product.name} - ${item.variant.name} đã hết hàng hoặc không đủ số lượng`);
        }

        const itemTotal = new Prisma.Decimal(item.variant.price).mul(item.quantity);
        subtotal = subtotal.add(itemTotal);

        return {
          variantId: item.variant.id,
          productName: item.variant.product.name,
          variantName: item.variant.name,
          price: item.variant.price,
          quantity: item.quantity,
        };
      });

      // 4. Handle Coupon (Mock logic)
      let discount = new Prisma.Decimal(0);
      let couponId = null;
      if (dto.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: dto.couponCode } });
        if (coupon && coupon.isActive && coupon.endDate > new Date() && coupon.startDate <= new Date()) {
          // Simple percentage discount logic
          if (coupon.type === 'PERCENTAGE') {
            discount = subtotal.mul(coupon.value).div(100);
            if (coupon.maxDiscount && discount.greaterThan(coupon.maxDiscount)) {
              discount = coupon.maxDiscount;
            }
          } else {
            discount = coupon.value;
          }
          couponId = coupon.id;
        } else {
          throw new BadRequestException('Mã giảm giá không hợp lệ hoặc đã hết hạn');
        }
      }

      const shippingFee = new Prisma.Decimal(30000); // Fixed shipping fee for MVP
      const totalAmount = subtotal.add(shippingFee).sub(discount);

      // 5. Create Order
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: dto.addressId,
          subtotal,
          shippingFee,
          discount,
          totalAmount,
          status: OrderStatus.PENDING,
          note: dto.note,
          couponId,
          items: {
            create: orderItemsData,
          },
          payment: {
            create: {
              method: dto.paymentMethod,
              amount: totalAmount,
              status: PaymentStatus.PENDING,
            },
          },
          shipping: {
            create: {
              status: 'PENDING',
            },
          },
        },
        include: { items: true, payment: true, shipping: true },
      });

      // 6. Deduct Stock
      for (const item of cart.items) {
        await tx.variant.update({
          where: { id: item.variant.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 7. Clear Cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // 8. Update Coupon Usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return order;
    });
  }

  async getUserOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payment: true,
        shipping: true,
      },
    });
  }

  async getOrderById(userId: number, id: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: true,
        payment: true,
        shipping: true,
        address: true,
      },
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }
}
