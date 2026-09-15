import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsInt, Min, Matches, IsEmail, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã sản phẩm không được để trống' })
  productId: string;

  @IsInt({ message: 'Số lượng sản phẩm phải là số nguyên' })
  @Min(1, { message: 'Số lượng sản phẩm tối thiểu là 1' })
  @IsNotEmpty({ message: 'Số lượng sản phẩm không được để trống' })
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty({ message: 'Họ tên khách hàng không được để trống' })
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, { message: 'Số điện thoại không đúng định dạng Việt Nam' })
  phone: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  district: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  addressDetail: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsEnum(['COD', 'BANK_TRANSFER', 'cod', 'bank_transfer'], { message: 'Phương thức thanh toán không hợp lệ' })
  paymentMethod: string;

  @IsString()
  @IsOptional()
  voucherCode?: string;
}
