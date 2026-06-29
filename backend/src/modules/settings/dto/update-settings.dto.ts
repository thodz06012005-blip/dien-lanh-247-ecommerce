import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  storeName?: string;

  @IsString()
  @IsOptional()
  hotline?: string;

  @IsString()
  @IsOptional()
  zalo?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  freeShippingThreshold?: number;
}
