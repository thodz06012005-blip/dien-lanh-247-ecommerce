import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, Matches } from 'class-validator';
import { ServiceRequestPriority } from '@prisma/client';

export class CreateServiceRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Trường customerName là bắt buộc' })
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'Trường customerPhone là bắt buộc' })
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, { message: 'Số điện thoại không hợp lệ' })
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
