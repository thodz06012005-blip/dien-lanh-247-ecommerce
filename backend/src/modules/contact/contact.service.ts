import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async createContact(dto: CreateContactDto) {
    const contact = await this.prisma.contact.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone.replace(/\s+/g, '').trim(),
        email: dto.email ? dto.email.trim() : null,
        message: dto.message.trim(),
      },
    });

    return {
      success: true,
      message: 'Gửi yêu cầu tư vấn thành công. Điện Lạnh 247 sẽ liên hệ với bạn trong vòng 15 phút!',
      data: contact,
    };
  }
}
