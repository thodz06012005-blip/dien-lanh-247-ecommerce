import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Query('limit') limit?: string, @Query('unreadOnly') unreadOnly?: string) {
    return this.notifications.listAdminNotifications(Number(limit || 30), unreadOnly === 'true');
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }

  @Patch('dispatch/run')
  async runDispatcher(@Body() _body: Record<string, never>) {
    await this.notifications.processBatch();
    return { processed: true };
  }
}
