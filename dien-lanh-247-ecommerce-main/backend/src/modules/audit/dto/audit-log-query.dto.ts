import { IsOptional, IsString, IsEnum, MaxLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditLogQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  actorEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  resource?: string;

  @IsOptional()
  @IsEnum(['success', 'failure', 'denied', 'rate_limited'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dateFrom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dateTo?: string;
}
