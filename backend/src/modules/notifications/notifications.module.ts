import { Module } from '@nestjs/common';
import { MailModule } from '../../integrations/mail/mail.module';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [MailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationTemplateService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
