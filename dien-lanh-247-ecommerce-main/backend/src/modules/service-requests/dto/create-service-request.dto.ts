import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, Matches, ArrayMaxSize, MaxLength, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { ServiceRequestPriority } from '@prisma/client';

class MediaMetadataDto {
  @IsString() @MaxLength(255) name: string;
  @IsString() @Matches(/^(image|video)\//) type: string;
  @IsInt() @Min(0) @Max(500000) size: number;
}
export class CreateServiceRequestDto {
  @IsOptional() @IsArray() @ArrayMaxSize(4) @ValidateNested({ each: true }) @Type(() => MediaMetadataDto)
  mediaMetadata?: MediaMetadataDto[];

  @IsString()
  @IsNotEmpty({ message: 'Trường customerName là bắt buộc' })
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'Trường customerPhone là bắt buộc' })
  @Matches(/^(?:0\d{9}|\+84\d{9})$/, { message: 'Số điện thoại không hợp lệ' })
  customerPhone: string;

  @IsString()
  @IsNotEmpty({ message: 'Trường customerAddress là bắt buộc' })
  customerAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Trường district là bắt buộc' })
  district: string;

  @IsString()
  @IsNotEmpty({ message: 'Trường serviceCategoryId là bắt buộc' })
  serviceCategoryId: string;

  @IsString()
  @IsNotEmpty({ message: 'Trường applianceType là bắt buộc' })
  applianceType: string;

  @IsString()
  @IsNotEmpty({ message: 'Trường issueDescription là bắt buộc' })
  issueDescription: string;

  @IsArray({ message: 'Danh sách hình ảnh phải là mảng' })
  @IsOptional()
  @ArrayMaxSize(4) @IsString({ each: true }) @MaxLength(700000, { each: true })
  @Matches(/^(?:https:\/\/|data:(?:image|video)\/)/, { each: true })
  images?: string[];

  @IsString()
  @IsNotEmpty({ message: 'Trường preferredDate là bắt buộc' })
  preferredDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Trường preferredTimeSlot là bắt buộc' })
  preferredTimeSlot: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsEnum(ServiceRequestPriority, { message: 'Độ ưu tiên không hợp lệ' })
  @IsOptional()
  priority?: ServiceRequestPriority;
}
