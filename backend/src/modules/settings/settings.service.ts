import { createFinanceSnapshot } from '../../domain/finance';
import { jsonValue } from '../service-operations/job-view';
import { EMPTY_BUSINESS_CONFIG, validateBusinessConfig } from '../../domain/business-config';
import { Prisma } from '@prisma/client';
import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
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
          hotline: '',
          zalo: '',
          email: '',
          address: '',
          shippingFee: 30000,
          freeShippingThreshold: 10000000,
        },
      });
    }

    return settings;
  }

  async getBusinessConfig() {
    const settings = await this.getOrCreateDefaultSettings();
    if (!settings.businessConfig) return structuredClone(EMPTY_BUSINESS_CONFIG);
    try { return validateBusinessConfig(settings.businessConfig); }
    catch { throw new ServiceUnavailableException('Cấu hình dịch vụ chưa hợp lệ. Vui lòng liên hệ quản trị viên.'); }
  }

  async getPublicSettings() {
    const settings = await this.getOrCreateDefaultSettings();
    const { appliances, serviceAreas, timeSlots, pricing } = await this.getBusinessConfig();
    return {
      success: true,
      data: {
        businessConfig: { appliances, serviceAreas, timeSlots, pricing },
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
        businessConfig: await this.getBusinessConfig(),
        shippingFee: Number(settings.shippingFee),
        freeShippingThreshold: Number(settings.freeShippingThreshold),
      },
    };
  }

  async updateSettings(dto: UpdateSettingsDto) {
    await this.getOrCreateDefaultSettings();

    let businessConfig: Prisma.InputJsonValue | undefined;
    if (dto.businessConfig !== undefined) {
      try { businessConfig = JSON.parse(JSON.stringify(validateBusinessConfig(dto.businessConfig))) as Prisma.InputJsonValue; }
      catch (error) { throw new BadRequestException((error as Error).message); }
    }
    const updated = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM SystemSetting WHERE id = 'default' FOR UPDATE`;
      if (businessConfig !== undefined) {
        const previous = await tx.systemSetting.findUniqueOrThrow({ where: { id: 'default' } });
        const baseline = validateBusinessConfig(previous.businessConfig || businessConfig);
        const legacy = await tx.serviceRequest.findMany({ where: { status: 'completed', financeSnapshot: { equals: Prisma.DbNull } } });
        for (const job of legacy) {
          const snapshot = createFinanceSnapshot(job, baseline.finance, new Date().toISOString(), 'legacy-baseline');
          await tx.serviceRequest.update({ where: { id: job.id }, data: { financeSnapshot: jsonValue(snapshot) } });
          await tx.financeAuditLog.create({ data: { requestId: job.id, action: 'FREEZE_LEGACY_POLICY', actorId: 'system', actorName: 'System', after: jsonValue(snapshot) } });
        }
      }
      return tx.systemSetting.update({
      where: { id: 'default' },
      data: {
        businessConfig,
        storeName: dto.storeName,
        hotline: dto.hotline,
        zalo: dto.zalo,
        email: dto.email,
        address: dto.address,
        shippingFee: dto.shippingFee,
        freeShippingThreshold: dto.freeShippingThreshold,
      },
    });

    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
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
