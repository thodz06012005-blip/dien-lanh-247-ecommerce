import { Body, Controller, Get, Param, Patch, Query, Req, Res, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OperationsService } from './operations.service';
import { FinanceUpdateDto, SettlementDto } from './operations.dto';
type AdminRequest = Request & { user: { userId: number; email: string } };
const actor = (req: AdminRequest) => ({ id: String(req.user.userId), name: req.user.email });
@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class FinanceController {
  constructor(private readonly operations: OperationsService) {}
  @Get('report') async report(@Query('month') month?: string) { return { success: true, data: await this.operations.report(month) }; }
  @Get('audit-logs') async audit(@Query('month') month?: string) { return { success: true, data: await this.operations.audit(month) }; }
  @Get('export') async export(@Res() res: Response, @Query('month') value?: string) {
    const month = this.operations.month(value); const xml = await this.operations.export(month);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="doi-soat-${month}.xls"`); res.send(xml);
  }
  @Patch('requests/:id') async update(@Param('id') id: string, @Body() dto: FinanceUpdateDto, @Req() req: AdminRequest) { return { success: true, data: await this.operations.updateFinance(id, dto, actor(req)), message: 'Đã cập nhật tài chính' }; }
  @Patch('requests/:id/settlement') async settle(@Param('id') id: string, @Body() dto: SettlementDto, @Req() req: AdminRequest) { return { success: true, data: await this.operations.settlement(id, dto, actor(req)), message: 'Đã cập nhật đối soát' }; }
}
