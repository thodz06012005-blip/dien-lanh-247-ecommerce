import { IsString, IsNotEmpty } from 'class-validator';

export class AssignTechnicianDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã kỹ thuật viên không được để trống' })
  technicianId: string;
}
