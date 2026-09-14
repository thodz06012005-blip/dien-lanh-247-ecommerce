import { Body, Controller, Get, Headers, HttpCode, Post, Param, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { CustomerVerificationService } from './customer-verification.service';

@Controller('service-requests/lookup')
export class CustomerVerificationController {
  constructor(private service: CustomerVerificationService) {}
  @Post('request-otp') @HttpCode(202)
  requestOtp(@Body() body: { requestCode?: string; phone?: string }, @Req() req: Request) { return this.service.requestOtp(body.requestCode || '', body.phone || '', req.ip || 'unknown'); }
  @Post('verify')
  verify(@Body() body: { requestCode?: string; otp?: string }) { return this.service.verify(body.requestCode || '', body.otp || ''); }
  @Get(':id')
  lookup(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Lookup ') ? authorization.slice(7) : '';
    if (!token) throw new UnauthorizedException('Quyền tra cứu không hợp lệ hoặc đã hết hạn');
    return this.service.lookup(id.toUpperCase(), token);
  }
}
