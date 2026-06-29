import { IsString, IsOptional } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  paymentStatus?: string;
}
