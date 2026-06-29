import { IsEnum, IsNotEmpty } from 'class-validator';
import { TechnicianStatus } from '@prisma/client';

export class UpdateTechnicianStatusDto {
  @IsEnum(TechnicianStatus, { message: 'Trạng thái hoạt động không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái hoạt động không được để trống' })
  status: TechnicianStatus;
}
