import { IsOptional, MaxLength, IsString } from 'class-validator';

export class DangerousActionDto {
  @IsOptional()
  confirm?: any; // Can be boolean or string

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Lý do xác nhận không được vượt quá 300 ký tự' })
  reason?: string;
}
