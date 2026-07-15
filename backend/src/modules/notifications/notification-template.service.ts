import { Injectable } from '@nestjs/common';
import type { NotificationTemplate } from './notification.types';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

@Injectable()
export class NotificationTemplateService {
  render(templateKey: string, payload: Record<string, unknown>): NotificationTemplate {
    const code = escapeHtml(payload.code);
    const customerName = escapeHtml(payload.customerName || 'Quý khách');
    const status = escapeHtml(payload.status);
    const appointment = escapeHtml(payload.appointment);

    const templates: Record<string, { subject: string; heading: string; lead: string }> = {
      SERVICE_REQUEST_CREATED: {
        subject: `Điện Lạnh 247 đã tiếp nhận yêu cầu ${code}`,
        heading: 'Yêu cầu của bạn đã được tiếp nhận',
        lead: `Mã yêu cầu ${code} đã được ghi nhận và đội ngũ vận hành đang kiểm tra thông tin.`,
      },
      SERVICE_REQUEST_STATUS_CHANGED: {
        subject: `Cập nhật trạng thái yêu cầu ${code}`,
        heading: 'Trạng thái dịch vụ vừa được cập nhật',
        lead: `Yêu cầu ${code} hiện ở trạng thái: ${status}.`,
      },
      SERVICE_APPOINTMENT_REMINDER: {
        subject: `Nhắc lịch dịch vụ ${code}`,
        heading: 'Lịch hẹn của bạn sắp diễn ra',
        lead: `Điện Lạnh 247 xin nhắc lịch ${appointment} cho yêu cầu ${code}.`,
      },
      SERVICE_COMPLETED: {
        subject: `Dịch vụ ${code} đã hoàn thành`,
        heading: 'Dịch vụ đã hoàn thành',
        lead: `Cảm ơn ${customerName} đã sử dụng Điện Lạnh 247. Hồ sơ ${code} đã được cập nhật hoàn thành.`,
      },
    };

    const selected = templates[templateKey] ?? {
      subject: 'Thông báo từ Điện Lạnh 247',
      heading: 'Thông tin mới từ Điện Lạnh 247',
      lead: escapeHtml(payload.message || 'Hệ thống vừa có một cập nhật mới.'),
    };

    const text = [selected.heading, '', selected.lead, '', 'Điện Lạnh 247 — Nhanh chóng, minh bạch, tận tâm.'].join('\n');
    const html = `<!doctype html><html lang="vi"><body style="margin:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#14213d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:640px;background:#ffffff;border-radius:20px;box-shadow:0 16px 50px rgba(15,35,70,.12);overflow:hidden"><tr><td style="padding:24px 32px;background:linear-gradient(135deg,#0877ff,#00a7e8);color:#fff"><div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.85">Điện Lạnh 247</div><h1 style="margin:10px 0 0;font-size:26px;line-height:1.3">${selected.heading}</h1></td></tr><tr><td style="padding:32px"><p style="margin:0;font-size:16px;line-height:1.75;color:#40516f">Xin chào ${customerName},</p><p style="font-size:16px;line-height:1.75;color:#40516f">${selected.lead}</p><div style="margin-top:28px;padding:18px 20px;border:1px solid #e5ebf5;border-radius:14px;background:#f8fbff"><strong style="color:#0877ff">Cần hỗ trợ?</strong><div style="margin-top:8px;color:#53627a">Hãy liên hệ đội ngũ Điện Lạnh 247 qua hotline hoặc kênh chăm sóc khách hàng đã công bố.</div></div></td></tr><tr><td style="padding:20px 32px;background:#f8fafc;color:#778399;font-size:13px">Thông báo tự động. Vui lòng không gửi mật khẩu hoặc mã xác thực qua email.</td></tr></table></td></tr></table></body></html>`;

    return { subject: selected.subject, text, html };
  }
}
