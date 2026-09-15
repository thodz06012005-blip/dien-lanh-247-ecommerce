import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePaymentEntryDto {
  @IsEnum(['collection', 'refund', 'adjustment'])
  type: 'collection' | 'refund' | 'adjustment';

  @IsNumber()
  amount: number;

  @IsString()
  @MinLength(2)
  method: string;

  @IsDateString()
  occurredAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  idempotencyKey: string;
}
