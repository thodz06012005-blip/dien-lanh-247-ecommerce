import { IsString, IsNotEmpty, IsEmail, IsOptional, IsArray, IsEnum, Min, Max, IsNumber, Matches } from 'class-validator';

export class CreateTechnicianDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên kỹ thuật viên không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, { message: 'Số điện thoại không đúng định dạng Việt Nam' })
  phone: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsArray({ message: 'Kỹ năng chuyên môn không được để trống' })
  @IsNotEmpty({ each: true, message: 'Kỹ năng chuyên môn không được để trống' })
  skills: string[];

  @IsArray({ message: 'Địa bàn hoạt động không được để trống' })
  @IsNotEmpty({ each: true, message: 'Địa bàn hoạt động không được để trống' })
  workingAreaIds: string[];

  @IsEnum(['active', 'inactive'], { message: 'Trạng thái tài khoản không hợp lệ' })
  @IsOptional()
  accountStatus?: 'active' | 'inactive';

  @IsEnum(['on_shift', 'offline'], { message: 'Trạng thái hiện diện không hợp lệ' })
  @IsOptional()
  presence?: 'on_shift' | 'offline';

  @IsNumber({}, { message: 'Điểm đánh giá phải là số' })
  @Min(0, { message: 'Điểm đánh giá phải từ 0 đến 5' })
  @Max(5, { message: 'Điểm đánh giá phải từ 0 đến 5' })
  @IsOptional()
  rating?: number;
}
