import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateDefaultSettings() {
    let settings = await this.prisma.systemSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.systemSetting.create({
        data: {
          id: 'default',
          storeName: 'Điện Lạnh 247',
          hotline: '1900 1234',
          zalo: '0987654321',
          email: 'support@dienlanh247.vn',
          address: '123 Đường Cầu Giấy, Hà Nội',
          shippingFee: 30000,
          freeShippingThreshold: 10000000,
        },
      });
    }

    return settings;
  }

  async getPublicSettings() {
    const settings = await this.getOrCreateDefaultSettings();
    return {
      success: true,
      data: {
        hotline: settings.hotline,
        zalo: settings.zalo,
        email: settings.email,
        address: settings.address,
        shippingFee: Number(settings.shippingFee),
        freeShippingThreshold: Number(settings.freeShippingThreshold),
      },
    };
  }

  async getAdminSettings() {
    const settings = await this.getOrCreateDefaultSettings();
    return {
      success: true,
      data: {
        ...settings,
        shippingFee: Number(settings.shippingFee),
        freeShippingThreshold: Number(settings.freeShippingThreshold),
      },
    };
  }

  async updateSettings(dto: UpdateSettingsDto) {
    await this.getOrCreateDefaultSettings();

    const updated = await this.prisma.systemSetting.update({
      where: { id: 'default' },
      data: {
        storeName: dto.storeName,
        hotline: dto.hotline,
        zalo: dto.zalo,
        email: dto.email,
        address: dto.address,
        shippingFee: dto.shippingFee,
        freeShippingThreshold: dto.freeShippingThreshold,
      },
    });

    return {
      success: true,
      message: 'Cập nhật cài đặt hệ thống thành công',
      data: {
        ...updated,
        shippingFee: Number(updated.shippingFee),
        freeShippingThreshold: Number(updated.freeShippingThreshold),
      },
    };
  }
}
