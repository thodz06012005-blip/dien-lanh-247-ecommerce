import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ServiceRequestPriority } from '@prisma/client';

export class CreateServiceRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên là bắt buộc' })
  @Length(2, 120, { message: 'Họ tên phải có từ 2 đến 120 ký tự' })
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại là bắt buộc' })
  @Matches(/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/, { message: 'Số điện thoại Việt Nam không hợp lệ' })
  customerPhone: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(191)
  customerEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ là bắt buộc' })
  @Length(5, 300, { message: 'Địa chỉ phải có từ 5 đến 300 ký tự' })
  customerAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Quận hoặc huyện là bắt buộc' })
  @MaxLength(120)
  district: string;

  @IsString()
  @IsNotEmpty({ message: 'Dịch vụ là bắt buộc' })
  @MaxLength(191)
  serviceCategoryId: string;

  @IsString()
  @IsNotEmpty({ message: 'Loại thiết bị là bắt buộc' })
  @Length(2, 160, { message: 'Loại thiết bị phải có từ 2 đến 160 ký tự' })
  applianceType: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả sự cố là bắt buộc' })
  @Length(10, 3000, { message: 'Mô tả sự cố phải có từ 10 đến 3000 ký tự' })
  issueDescription: string;

  @IsISO8601({ strict: true }, { message: 'Ngày mong muốn không hợp lệ' })
  preferredDate: string;

  @IsString()
  @IsNotEmpty({ message: 'Khung giờ mong muốn là bắt buộc' })
  @MaxLength(80)
  preferredTimeSlot: string;

  @IsEnum(ServiceRequestPriority, { message: 'Độ ưu tiên không hợp lệ' })
  @IsOptional()
  priority?: ServiceRequestPriority;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  note?: string;

  // Legacy JSON image URLs remain accepted for backward compatibility.
  @IsOptional()
  images?: string[];
}
