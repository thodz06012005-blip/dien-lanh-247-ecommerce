import { ServiceOperationsModule } from '../service-operations/service-operations.module';
import { SettingsModule } from '../settings/settings.module';
import { Module } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';

@Module({
  imports: [ServiceOperationsModule, SettingsModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
