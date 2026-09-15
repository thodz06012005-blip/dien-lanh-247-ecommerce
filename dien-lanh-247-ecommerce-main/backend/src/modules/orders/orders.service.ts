import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { Prisma, OrderStatus, PaymentStatus, PaymentMethod, ShippingStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to map DB Order to Mock API Response Format
  private mapOrderToUser(order: any) {
    const items = (order.items || []).map((item: any) => ({
      productId: item.variant?.product?.slug || String(item.variant?.productId) || '',
      name: item.productName,
      sku: item.variantName || item.sku || '',
      price: Number(item.price),
      quantity: item.quantity,
      imageUrl: item.variant?.product?.images?.[0]?.url || '',
    }));

    // Format Date: DD/MM/YYYY, HH:MM
    const date = new Date(order.createdAt);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

    return {
      id: order.orderNumber,
      code: order.orderNumber,
      customerName: order.address?.fullName || '',
      phone: order.address?.phone || '',
      email: order.user?.email || '',
      city: order.address?.province || '',
      district: order.address?.district || '',
      addressDetail: order.address?.streetAddress || '',
      note: order.note || '',
      paymentMethod: (order.payment?.method || 'COD').toLowerCase(),
      shippingFee: Number(order.shippingFee),
      discountAmount: Number(order.discount),
      totalAmount: Number(order.totalAmount),
      status: (order.status || 'PENDING').toLowerCase(),
      paymentStatus: (order.payment?.status || 'PENDING').toLowerCase() === 'completed' ? 'paid' : 'unpaid',
      items,
      createdAt: formattedDate,
    };
  }

  // Normalize payment method from string to Enum
  private normalizePaymentMethod(method: string): PaymentMethod {
    const m = method.toUpperCase().replace(/\s+/g, '');
    if (m === 'COD') return PaymentMethod.COD;
    if (m === 'BANK_TRANSFER' || m === 'BANKTRANSFER') return PaymentMethod.BANK_TRANSFER;
    if (m === 'VNPAY') return PaymentMethod.VNPAY;
    if (m === 'MOMO') return PaymentMethod.MOMO;
    throw new BadRequestException(`Phương thức thanh toán không hợp lệ. Chỉ chấp nhận: COD, BANK_TRANSFER`);
  }

  async createOrder(dto: CreateOrderDto) {
    // Validate payment method
    const paymentMethodEnum = this.normalizePaymentMethod(dto.paymentMethod);

    return this.prisma.$transaction(async (tx) => {
      // 1. Get or create guest User
      let user = await tx.user.findFirst({
        where: { role: 'CUSTOMER' },
      });
      if (!user) {
        // Create default customer if none exists
        user = await tx.user.create({
          data: {
            email: dto.email || `guest_${Date.now()}@dienlanh247.vn`,
            password: 'hashed_password_placeholder',
            role: 'CUSTOMER',
          },
        });
      }

      // 2. Create Address for this order
      const address = await tx.address.create({
        data: {
          userId: user.id,
          fullName: dto.customerName,
          phone: dto.phone.replace(/\s+/g, '').trim(),
          province: dto.city,
          district: dto.district,
          ward: 'N/A',
          streetAddress: dto.addressDetail,
        },
      });

      let subtotal = 0;
      const orderItemsData = [];

      // 3. Validate and build items
      for (const item of dto.items) {
        const qty = Number(item.quantity);
        if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
          throw new BadRequestException('Số lượng sản phẩm không hợp lệ');
        }

        // Find Product in DB
        let product = null;
        const prodIdNum = Number(item.productId);
        if (!isNaN(prodIdNum)) {
          product = await tx.product.findUnique({
            where: { id: prodIdNum },
            include: { variants: true, category: true },
          });
        }
        if (!product && typeof item.productId === 'string') {
          product = await tx.product.findUnique({
            where: { slug: item.productId },
            include: { variants: true, category: true },
          });
        }

        if (!product) {
          throw new NotFoundException('Sản phẩm không tồn tại');
        }

        if (!product.isActive) {
          throw new BadRequestException(`Sản phẩm ${product.name} hiện không hoạt động hoặc hết hàng`);
        }

        // Get default variant of product
        const variant = product.variants[0];
        if (!variant || variant.stock < qty || variant.stock <= 0) {
          throw new BadRequestException(`Sản phẩm ${product.name} không đủ tồn kho (Còn lại ${variant ? variant.stock : 0})`);
        }

        const price = Number(variant.price);
        subtotal += price * qty;

        orderItemsData.push({
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          price: variant.price,
          quantity: qty,
          // Temporary holding category slug for shipping calculation
          categorySlug: product.category?.slug || '',
        });
      }

      // 4. Calculate Shipping Fee
      // Default: shippingFee 30000, threshold 10,000,000
      let shippingFee = 0;
      const threshold = 10000000;
      if (subtotal > 0 && subtotal < threshold) {
        const hasLargeAppliance = orderItemsData.some((item) =>
          ['dieu-hoa', 'tu-lanh', 'may-giat', 'may-say', 'tu-dong'].includes(item.categorySlug)
        );
        shippingFee = hasLargeAppliance ? 150000 : 30000;
      }

      // 5. Calculate Voucher Discount
      let discount = 0;
      let couponId = null;
      if (dto.voucherCode) {
        const vouchersList = [
          {
            code: 'DIENLANH247',
            discountType: 'percentage',
            value: 10,
            minOrderValue: 2000000,
            maxDiscount: 1000000,
          },
          {
            code: 'GIAM50K',
            discountType: 'fixed',
            value: 50000,
            minOrderValue: 200000,
          },
          {
            code: 'MIENPHIYENTAM',
            discountType: 'percentage',
            value: 100,
            minOrderValue: 5000000,
            maxDiscount: 200000,
          },
        ];

        const v = vouchersList.find((voucher) => voucher.code === dto.voucherCode);
        if (v && subtotal >= v.minOrderValue) {
          if (v.discountType === 'percentage') {
            let calcDiscount = (subtotal * v.value) / 100;
            if (v.maxDiscount) {
              calcDiscount = Math.min(calcDiscount, v.maxDiscount);
            }
            discount = Math.min(calcDiscount, subtotal);
          } else if (v.discountType === 'fixed') {
            discount = Math.min(v.value, subtotal);
          }
          // Optional: Find coupon in DB if it exists, to link it
          const dbCoupon = await tx.coupon.findUnique({ where: { code: dto.voucherCode } });
          if (dbCoupon) {
            couponId = dbCoupon.id;
          }
        }
      }

      const total = Math.max(0, subtotal + shippingFee - discount);
      const orderCode = `DL247-${Math.floor(100000 + Math.random() * 900000)}`;

      // 6. Create Order in DB
      const order = await tx.order.create({
        data: {
          orderNumber: orderCode,
          userId: user.id,
          addressId: address.id,
          subtotal: new Prisma.Decimal(subtotal),
          shippingFee: new Prisma.Decimal(shippingFee),
          discount: new Prisma.Decimal(discount),
          totalAmount: new Prisma.Decimal(total),
          status: OrderStatus.PENDING,
          note: dto.note || '',
          couponId: couponId,
          items: {
            create: orderItemsData.map((item) => ({
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              price: item.price,
              quantity: item.quantity,
            })),
          },
          payment: {
            create: {
              method: paymentMethodEnum,
              amount: new Prisma.Decimal(total),
              status: PaymentStatus.PENDING,
            },
          },
          shipping: {
            create: {
              status: ShippingStatus.PENDING,
            },
          },
        },
        include: {
          items: { include: { variant: { include: { product: { include: { images: true } } } } } },
          payment: true,
          shipping: true,
          address: true,
          user: true,
        },
      });

      // 7. Deduct Stock
      for (const item of orderItemsData) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 8. Update Coupon Usage if coupon exists in DB
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return this.mapOrderToUser(order);
    });
  }

  async getOrdersCustomer(phone: string) {
    const list = await this.prisma.order.findMany({
      where: {
        address: {
          phone: phone.trim(),
        },
      },
      include: {
        items: { include: { variant: { include: { product: { include: { images: true } } } } } },
        payment: true,
        shipping: true,
        address: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((o) => this.mapOrderToUser(o));
  }

  async getOrderCustomerById(id: string, phone: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: id },
      include: {
        items: { include: { variant: { include: { product: { include: { images: true } } } } } },
        payment: true,
        shipping: true,
        address: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.address?.phone !== phone.trim()) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }

    return this.mapOrderToUser(order);
  }

  async cancelOrderCustomer(id: string, phone: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderNumber: id },
        include: {
          items: { include: { variant: true } },
          address: true,
          payment: true,
          shipping: true,
          user: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      if (order.address?.phone !== phone.trim()) {
        throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận');
      }

      // Restore Stock
      for (const item of order.items) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
        },
        include: {
          items: { include: { variant: { include: { product: { include: { images: true } } } } } },
          payment: true,
          shipping: true,
          address: true,
          user: true,
        },
      });

      return this.mapOrderToUser(updated);
    });
  }

  async findAllAdmin(query?: OrderQueryDto) {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    // 1. Filter by Status
    if (query?.status) {
      const statusUpper = query.status.toUpperCase();
      if (Object.keys(OrderStatus).includes(statusUpper)) {
        where.status = statusUpper as OrderStatus;
      }
    }

    // 2. Filter by PaymentStatus
    if (query?.paymentStatus) {
      const pStatus = query.paymentStatus.toLowerCase();
      if (pStatus === 'paid') {
        where.payment = { status: PaymentStatus.COMPLETED };
      } else if (pStatus === 'unpaid') {
        where.payment = { status: PaymentStatus.PENDING };
      }
    }

    // 3. Filter by Date Range
    if (query?.dateFrom || query?.dateTo) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.dateFrom) {
        dateFilter.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        dateFilter.lte = new Date(query.dateTo);
      }
      where.createdAt = dateFilter;
    }

    // 4. Search Filter
    if (query?.q) {
      const qNormalized = query.q.trim();
      if (qNormalized.length > 0) {
        where.OR = [
          { orderNumber: { contains: qNormalized } },
          { address: { fullName: { contains: qNormalized } } },
          { address: { phone: { contains: qNormalized } } },
        ];
      }
    }

    // 5. Sorting mapping
    const sortOrder = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const sortBy = query?.sortBy || 'createdAt';
    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: sortOrder };

    const allowedSortFields = ['code', 'customerName', 'phone', 'total', 'status', 'paymentStatus', 'createdAt', 'updatedAt'];
    if (allowedSortFields.includes(sortBy)) {
      if (sortBy === 'code') {
        orderBy = { orderNumber: sortOrder };
      } else if (sortBy === 'customerName') {
        orderBy = { address: { fullName: sortOrder } };
      } else if (sortBy === 'phone') {
        orderBy = { address: { phone: sortOrder } };
      } else if (sortBy === 'total') {
        orderBy = { totalAmount: sortOrder };
      } else if (sortBy === 'status') {
        orderBy = { status: sortOrder };
      } else if (sortBy === 'updatedAt') {
        orderBy = { updatedAt: sortOrder };
      } else if (sortBy === 'createdAt') {
        orderBy = { createdAt: sortOrder };
      }
    }

    const list = await this.prisma.order.findMany({
      where,
      include: {
        items: { include: { variant: { include: { product: { include: { images: true } } } } } },
        payment: true,
        shipping: true,
        address: true,
        user: true,
      },
      orderBy,
      skip,
      take: limit,
    });

    return list.map((o) => this.mapOrderToUser(o));
  }

  async findOneAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: id },
      include: {
        items: { include: { variant: { include: { product: { include: { images: true } } } } } },
        payment: true,
        shipping: true,
        address: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return this.mapOrderToUser(order);
  }

  async updateStatusAdmin(id: string, dto: UpdateOrderStatusDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderNumber: id },
        include: {
          items: { include: { variant: true } },
          payment: true,
          shipping: true,
          address: true,
          user: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      const oldStatus = order.status;
      let newStatus: OrderStatus = oldStatus;

      const updateData: any = {};

      if (dto.status) {
        const statusUpper = dto.status.toUpperCase();
        const validStatuses = Object.keys(OrderStatus);
        if (!validStatuses.includes(statusUpper)) {
          throw new BadRequestException('Trạng thái đơn hàng không hợp lệ');
        }
        newStatus = statusUpper as OrderStatus;

        if (newStatus !== oldStatus) {
          if (oldStatus === OrderStatus.DELIVERED || oldStatus === OrderStatus.CANCELLED) {
            throw new BadRequestException('Đơn hàng đã giao hoặc đã hủy không thể thay đổi trạng thái');
          }

          const validTransitions: Record<string, OrderStatus[]> = {
            PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
            PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
            SHIPPED: [OrderStatus.DELIVERED],
          };

          if (validTransitions[oldStatus] && !validTransitions[oldStatus].includes(newStatus)) {
            throw new BadRequestException(`Không thể chuyển trạng thái từ ${oldStatus} sang ${dto.status}`);
          }

          // Handle Cancelled -> Restore Stock
          if (newStatus === OrderStatus.CANCELLED) {
            for (const item of order.items) {
              await tx.variant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }

          // Handle Recovery from Cancelled (not common but handled)
          if ((oldStatus as string) === 'CANCELLED' && newStatus !== OrderStatus.CANCELLED) {
            for (const item of order.items) {
              const variant = await tx.variant.findUnique({ where: { id: item.variantId } });
              if (!variant || variant.stock < item.quantity) {
                throw new BadRequestException(`Sản phẩm không đủ tồn kho để khôi phục đơn hàng`);
              }
            }
            for (const item of order.items) {
              await tx.variant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } },
              });
            }
          }

          updateData.status = newStatus;
        }
      }

      // Update payment status
      if (dto.paymentStatus || newStatus === OrderStatus.DELIVERED) {
        let paymentStatusEnum: PaymentStatus = PaymentStatus.PENDING;
        const pStatus = dto.paymentStatus ? dto.paymentStatus.toLowerCase() : '';
        if (pStatus === 'paid' || newStatus === OrderStatus.DELIVERED) {
          paymentStatusEnum = PaymentStatus.COMPLETED;
        } else if (pStatus === 'failed') {
          paymentStatusEnum = PaymentStatus.FAILED;
        } else if (pStatus === 'refunded') {
          paymentStatusEnum = PaymentStatus.REFUNDED;
        }

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { status: paymentStatusEnum },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: updateData,
        include: {
          items: { include: { variant: { include: { product: { include: { images: true } } } } } },
          payment: true,
          shipping: true,
          address: true,
          user: true,
        },
      });

      return this.mapOrderToUser(updated);
    });
  }
}
