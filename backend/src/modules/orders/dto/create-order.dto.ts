import { IsInt, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateOrderDto {
  @IsInt()
  @IsNotEmpty()
  addressId: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
