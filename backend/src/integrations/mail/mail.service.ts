import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  // Never print reset/verification links or tokens to logs
  private async deliver(to: string, subject: string, text: string, html?: string) {
    if (!process.env.MAIL_HOST && !process.env.SMTP_HOST) {
      console.log(`[MailService] Simulated email: ${subject} -> ${to}`);
      return { delivered: false, simulated: true };
    }
    await this.mailerService.sendMail({ to, subject, text, html });
    return { delivered: true, simulated: false };
  }

  sendTemplated(to: string, subject: string, text: string, html: string) {
    return this.deliver(to, subject, text, html);
  }

  async sendOrderConfirmation(email: string, order: { orderNumber: string }) {
    return this.deliver(
      email,
      `Xác nhận đơn hàng ${order.orderNumber}`,
      `Điện Lạnh 247 đã tiếp nhận đơn hàng ${order.orderNumber}.`,
    );
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
    return this.deliver(email, subject, text);
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    return this.deliver(
      email,
      'Đặt lại mật khẩu Điện Lạnh 247',
      [
        'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
        '',
        `Mở liên kết bảo mật sau để đặt lại mật khẩu: ${resetUrl}`,
        '',
        'Liên kết có hiệu lực trong 30 phút và chỉ sử dụng được một lần.',
        'Nếu bạn không yêu cầu thay đổi này, hãy bỏ qua email.',
      ].join('\n'),
    );
  }

  async sendEmailVerification(email: string, verificationUrl: string) {
    return this.deliver(
      email,
      'Xác minh email tài khoản Điện Lạnh 247',
      [
        'Hãy xác minh email để bảo vệ tài khoản và tự động liên kết lịch sử dịch vụ.',
        '',
        `Liên kết xác minh: ${verificationUrl}`,
        '',
        'Liên kết có hiệu lực trong 24 giờ và chỉ sử dụng được một lần.',
      ].join('\n'),
    );
  }
}
