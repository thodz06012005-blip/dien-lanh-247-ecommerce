import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOrderConfirmation(email: string, order: any) {
    console.log(`[MailService] Sending Order Confirmation to ${email} for Order ${order.orderNumber}`);
  }

  async sendServiceRequestConfirmation(
    email: string,
    request: {
      code: string;
      customerName: string;
      preferredDate: string;
      preferredTimeSlot: string;
      serviceName: string;
    },
  ) {
    const subject = `Xác nhận yêu cầu dịch vụ ${request.code}`;
    const text = [
      `Xin chào ${request.customerName},`,
      '',
      'Điện Lạnh 247 đã tiếp nhận yêu cầu của bạn.',
      `Mã tra cứu: ${request.code}`,
      `Dịch vụ: ${request.serviceName}`,
      `Lịch mong muốn: ${request.preferredDate} - ${request.preferredTimeSlot}`,
      '',
      'Bạn có thể dùng mã yêu cầu và số điện thoại đã đăng ký để tra cứu trạng thái.',
    ].join('\n');

    if (!process.env.MAIL_HOST) {
      console.log(`[MailService] ${subject} -> ${email}`);
      return { delivered: false, simulated: true };
    }

    await this.mailerService.sendMail({ to: email, subject, text });
    return { delivered: true, simulated: false };
  }
}
