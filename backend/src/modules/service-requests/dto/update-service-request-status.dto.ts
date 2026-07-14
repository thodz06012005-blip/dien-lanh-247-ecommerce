import { IsISO8601, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { SERVICE_REQUEST_STATUSES } from '../service-request-workflow';

export class UpdateServiceRequestStatusDto {
  @IsString()
  @IsIn(SERVICE_REQUEST_STATUSES, { message: 'Trạng thái yêu cầu dịch vụ không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái yêu cầu dịch vụ không được để trống' })
  status: string;

  @IsNumber({}, { message: 'Giá cuối cùng phải là số' })
  @Min(0, { message: 'Giá cuối cùng không hợp lệ' })
  @IsOptional()
  finalPrice?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  note?: string;

  @IsISO8601({ strict: true }, { message: 'Ngày hẹn mới không hợp lệ' })
  @IsOptional()
  preferredDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  preferredTimeSlot?: string;
}
