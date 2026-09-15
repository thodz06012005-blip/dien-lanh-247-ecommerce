import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({ controllers: [OperationsController, FinanceController], providers: [OperationsService, FinanceService], exports: [FinanceService] })
export class OperationsModule {}
