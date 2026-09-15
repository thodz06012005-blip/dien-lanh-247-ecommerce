import { Module, Global } from '@nestjs/common';
import { VnpayService } from './vnpay.service';

@Global()
@Module({
  providers: [VnpayService],
  exports: [VnpayService],
})
export class VnpayModule {}
