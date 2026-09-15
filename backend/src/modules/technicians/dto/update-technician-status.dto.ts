import { IsEnum, IsOptional } from 'class-validator';

export class UpdateTechnicianStatusDto {
  @IsEnum(['active', 'inactive'], { message: 'Trạng thái tài khoản không hợp lệ' })
  @IsOptional()
  accountStatus?: 'active' | 'inactive';

  @IsEnum(['on_shift', 'offline'], { message: 'Trạng thái hiện diện không hợp lệ' })
  @IsOptional()
  presence?: 'on_shift' | 'offline';
}
