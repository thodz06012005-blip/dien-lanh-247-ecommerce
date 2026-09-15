import { IsString, IsOptional, IsNumber, Min, IsEmail, Length, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsObject()
  businessConfig?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  storeName?: string;

  @IsString()
  @IsOptional()
  @Length(5, 20)
  hotline?: string;

  @IsString()
  @IsOptional()
  @Length(5, 20)
  zalo?: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(2, 200)
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
