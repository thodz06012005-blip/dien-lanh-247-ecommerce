import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return value;
};

export class OperationsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsString() @MaxLength(160) q?: string;
  @IsOptional() @IsString() @MaxLength(64) status?: string;
  @IsOptional() @IsString() @MaxLength(64) priority?: string;
  @IsOptional() @IsString() @MaxLength(191) technicianId?: string;
  @IsOptional() @IsString() @MaxLength(191) serviceCategoryId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Transform(toBoolean) @IsBoolean() breached?: boolean;
}

export class CustomerDeviceDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) userId?: number;
  @IsOptional() @IsString() @MaxLength(191) serviceRequestId?: string;
  @IsString() @MaxLength(191) customerName!: string;
  @IsString() @MaxLength(32) customerPhone!: string;
  @IsOptional() @IsEmail() @MaxLength(191) customerEmail?: string;
  @IsOptional() @IsString() @MaxLength(120) label?: string;
  @IsString() @MaxLength(191) applianceType!: string;
  @IsOptional() @IsString() @MaxLength(191) brand?: string;
  @IsOptional() @IsString() @MaxLength(191) model?: string;
  @IsOptional() @IsString() @MaxLength(191) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(500) installationAddress?: string;
  @IsOptional() @IsString() @MaxLength(191) district?: string;
  @IsOptional() @IsDateString() installedAt?: string;
  @IsOptional() @IsDateString() warrantyUntil?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @Transform(toBoolean) @IsBoolean() isActive?: boolean;
}

export class TechnicianScheduleDto {
  @IsString() @MaxLength(191) technicianId!: string;
  @IsOptional() @IsString() @MaxLength(191) requestId?: string;
  @IsOptional() @IsIn(['WORK', 'LEAVE', 'BUSY', 'TRAINING']) scheduleType = 'WORK';
  @IsOptional() @IsIn(['TENTATIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED']) status = 'CONFIRMED';
  @IsDateString() startAt!: string;
  @IsDateString() endAt!: string;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

export class DispatchDto {
  @IsString() @MaxLength(191) technicianId!: string;
  @IsDateString() scheduledStart!: string;
  @IsDateString() scheduledEnd!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
  @IsOptional() @Transform(toBoolean) @IsBoolean() force?: boolean;
}

export class RescheduleDto {
  @IsDateString() scheduledStart!: string;
  @IsDateString() scheduledEnd!: string;
  @IsString() @MaxLength(500) reason!: string;
}

export class InternalNoteDto {
  @IsString() @MaxLength(5000) body!: string;
  @IsOptional() @IsIn(['INTERNAL', 'TECHNICIAN']) visibility = 'INTERNAL';
}

export class SlaPolicyDto {
  @IsOptional() @IsString() @MaxLength(191) serviceCategoryId?: string;
  @IsIn(['low', 'medium', 'high', 'urgent']) priority!: string;
  @Type(() => Number) @IsInt() @Min(1) responseMinutes!: number;
  @Type(() => Number) @IsInt() @Min(1) assignMinutes!: number;
  @Type(() => Number) @IsInt() @Min(1) arrivalMinutes!: number;
  @Type(() => Number) @IsInt() @Min(1) resolutionMinutes!: number;
  @Type(() => Number) @IsInt() @Min(1) warrantyResponseMinutes!: number;
  @IsOptional() @Transform(toBoolean) @IsBoolean() businessHoursOnly?: boolean;
  @IsOptional() @Transform(toBoolean) @IsBoolean() isActive?: boolean;
}

export class QuoteLineDto {
  @IsIn(['LABOR', 'MATERIAL']) lineType!: 'LABOR' | 'MATERIAL';
  @IsString() @MaxLength(500) description!: string;
  @IsOptional() @IsString() @MaxLength(120) sku?: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) quantity!: number;
  @IsOptional() @IsString() @MaxLength(32) unit = 'lần';
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) unitPrice!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder = 0;
}

export class CreateQuoteDto {
  @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => QuoteLineDto) lines!: QuoteLineDto[];
  @IsOptional() @IsIn(['FIXED', 'PERCENT']) discountType: 'FIXED' | 'PERCENT' = 'FIXED';
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) discountValue = 0;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(100) taxRate = 0;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
  @IsOptional() @IsDateString() validUntil?: string;
}

export class QuoteDecisionDto {
  @IsString() @MaxLength(256) token!: string;
  @IsIn(['ACCEPT', 'REJECT']) decision!: 'ACCEPT' | 'REJECT';
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class PaymentRecordDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) quoteId?: number;
  @IsIn(['CASH', 'BANK_TRANSFER', 'CARD', 'VNPAY', 'MOMO', 'OTHER']) method!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount!: number;
  @IsOptional() @IsString() @MaxLength(191) transactionReference?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional() @IsDateString() paidAt?: string;
}

export class CompletionReportDto {
  @IsString() @MaxLength(10000) diagnosis!: string;
  @IsString() @MaxLength(10000) workPerformed!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(100) materialsUsed?: Array<Record<string, unknown>>;
  @IsOptional() @IsString() @MaxLength(5000) recommendations?: string;
  @IsOptional() @IsString() @MaxLength(191) customerName?: string;
  @IsOptional() @IsString() @MaxLength(1024) customerSignatureUrl?: string;
  @IsOptional() @IsString() @MaxLength(1024) technicianSignatureUrl?: string;
  @IsDateString() completedAt!: string;
}

export class WarrantyDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) completionReportId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) deviceId?: number;
  @IsString() @MaxLength(10000) coverage!: string;
  @IsOptional() @IsString() @MaxLength(10000) exclusions?: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
}

export class WarrantyEventDto {
  @IsIn(['CLAIM_OPENED', 'INSPECTION', 'REPAIR', 'PART_REPLACED', 'RESOLVED', 'REJECTED', 'CLOSED']) eventType!: string;
  @IsString() @MaxLength(64) status!: string;
  @IsString() @MaxLength(10000) description!: string;
  @IsOptional() @IsString() @MaxLength(10000) resolution?: string;
  @IsOptional() @IsString() @MaxLength(191) requestId?: string;
  @IsOptional() @IsDateString() occurredAt?: string;
}
