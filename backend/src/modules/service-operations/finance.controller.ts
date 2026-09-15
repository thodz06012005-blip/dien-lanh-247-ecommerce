import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePaymentEntryDto } from './finance.dto';
import { FinanceService } from './finance.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Post('service-requests/:id/payment-entries')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  append(@Param('id') id: string, @Body() dto: CreatePaymentEntryDto, @Req() req: any) {
    return this.finance.appendEntry(id, dto, String(req.user.userId));
  }

  @Get('service-requests/:id/payment-entries')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  ledger(@Param('id') id: string) {
    return this.finance.ledger(id);
  }

  @Get('finance/report')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  report(@Query('month') month: string) {
    return this.finance.report(month);
  }
}
