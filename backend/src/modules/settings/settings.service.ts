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
    const serviceAreas = await (this.prisma as any).serviceArea.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    const businessConfig = (settings as any).businessConfig || { appliances: [], timeSlots: [], pricing: { inspectionFee: 0, emergencySurcharge: 0, showPriceRanges: false, disclaimer: '' }, serviceAreas: [] };
    return {
      success: true,
      data: {
        hotline: settings.hotline,
        zalo: settings.zalo,
        email: settings.email,
        address: settings.address,
        shippingFee: Number(settings.shippingFee),
        freeShippingThreshold: Number(settings.freeShippingThreshold),
        businessConfig: { ...businessConfig, serviceAreas: serviceAreas.map((area: any) => ({ id: area.id, name: area.name, active: area.isActive, travelFee: businessConfig.serviceAreas?.find((item: any) => item.id === area.id)?.travelFee || 0 })) },
      },
    };
  }

  async getAdminSettings() {
    const settings = await this.getOrCreateDefaultSettings();
    const serviceAreas = await (this.prisma as any).serviceArea.findMany({ orderBy: { name: 'asc' } });
    const businessConfig = (settings as any).businessConfig || { appliances: [], timeSlots: [], pricing: {}, serviceAreas: [] };
    return {
      success: true,
      data: {
        ...settings,
        shippingFee: Number(settings.shippingFee),
        freeShippingThreshold: Number(settings.freeShippingThreshold),
        businessConfig: { ...businessConfig, serviceAreas: serviceAreas.map((area: any) => ({ id: area.id, name: area.name, active: area.isActive, travelFee: businessConfig.serviceAreas?.find((item: any) => item.id === area.id)?.travelFee || 0 })) },
      },
    };
  }

  async updateSettings(dto: UpdateSettingsDto) {
    await this.getOrCreateDefaultSettings();

    const serviceAreas = dto.businessConfig?.serviceAreas;
    if (Array.isArray(serviceAreas)) {
      for (const area of serviceAreas) {
        if (!area?.id || !area?.name) continue;
        await (this.prisma as any).serviceArea.upsert({ where: { id: area.id }, update: { name: area.name, isActive: area.active !== false }, create: { id: area.id, name: area.name, isActive: area.active !== false } });
      }
    }

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
        businessConfig: dto.businessConfig,
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
