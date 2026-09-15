import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOrderConfirmation(email: string, order: any) {
    // For demo purpose, we just log instead of sending real email without template setup
    console.log(`[MailService] Sending Order Confirmation to ${email} for Order ${order.orderNumber}`);
    
    // await this.mailerService.sendMail({
    //   to: email,
    //   subject: `Xác nhận đơn hàng #${order.orderNumber}`,
    //   template: './order-confirmation',
    //   context: {
    //     orderNumber: order.orderNumber,
    //     totalAmount: order.totalAmount,
    //   },
    // });
  }
}
