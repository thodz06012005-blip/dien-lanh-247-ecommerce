import { Module } from '@nestjs/common';
import { CustomerVerificationController } from './customer-verification.controller';
import { CustomerVerificationService } from './customer-verification.service';
@Module({ controllers: [CustomerVerificationController], providers: [CustomerVerificationService] })
export class CustomerVerificationModule {}
