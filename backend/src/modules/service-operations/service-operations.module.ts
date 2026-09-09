import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { TechnicianAuthService, TechnicianGuard } from './technician-auth.service';
import { TechnicianPortalController } from './technician.controller';
import { FinanceController } from './finance.controller';
@Module({ controllers: [TechnicianPortalController, FinanceController], providers: [OperationsService, TechnicianAuthService, TechnicianGuard], exports: [OperationsService] })
export class ServiceOperationsModule {}
