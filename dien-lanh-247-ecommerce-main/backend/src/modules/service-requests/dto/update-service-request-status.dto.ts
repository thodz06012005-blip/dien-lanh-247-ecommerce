import { IsEnum, IsNotEmpty, IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { ServiceRequestStatus } from '@prisma/client';

export class UpdateServiceRequestStatusDto {
  @IsEnum(ServiceRequestStatus, { message: 'Trạng thái yêu cầu dịch vụ không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái yêu cầu dịch vụ không được để trống' })
  status: ServiceRequestStatus;

  @IsNumber({}, { message: 'Giá cuối cùng phải là số' })
  @Min(0, { message: 'Giá cuối cùng không hợp lệ' })
  @IsOptional()
  finalPrice?: number;

  @IsString()
  @IsOptional()
  note?: string;
}
