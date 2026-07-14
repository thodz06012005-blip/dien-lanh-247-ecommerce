import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  AddressDto,
  ChangePasswordDto,
  ClaimServiceRequestDto,
  ServiceRequestReviewDto,
  UpdateProfileDto,
} from './dto/account.dto';
import { UsersService } from './users.service';

interface AccountUser {
  userId: number;
  sessionId: string;
}

@Controller('account')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async overview(@CurrentUser() user: AccountUser) {
    return { success: true, data: await this.usersService.getOverview(user.userId) };
  }

  @Patch('profile')
  async updateProfile(@CurrentUser() user: AccountUser, @Body() dto: UpdateProfileDto) {
    return {
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: await this.usersService.updateProfile(user.userId, dto),
    };
  }

  @Get('addresses')
  async addresses(@CurrentUser() user: AccountUser) {
    return { success: true, data: await this.usersService.listAddresses(user.userId) };
  }

  @Post('addresses')
  async createAddress(@CurrentUser() user: AccountUser, @Body() dto: AddressDto) {
    return {
      success: true,
      message: 'Đã thêm địa chỉ',
      data: await this.usersService.createAddress(user.userId, dto),
    };
  }

  @Patch('addresses/:id')
  async updateAddress(
    @CurrentUser() user: AccountUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddressDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật địa chỉ',
      data: await this.usersService.updateAddress(user.userId, id, dto),
    };
  }

  @Delete('addresses/:id')
  async deleteAddress(
    @CurrentUser() user: AccountUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      success: true,
      message: 'Đã xóa địa chỉ',
      data: await this.usersService.deleteAddress(user.userId, id),
    };
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AccountUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.usersService.changePassword(user.userId, dto);
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    return {
      success: true,
      message: 'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.',
      data,
    };
  }

  @Get('orders')
  async orders(@CurrentUser() user: AccountUser) {
    return { success: true, data: await this.usersService.listOrders(user.userId) };
  }

  @Get('orders/:id')
  async order(
    @CurrentUser() user: AccountUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return { success: true, data: await this.usersService.getOrder(user.userId, id) };
  }

  @Get('service-requests')
  async serviceRequests(@CurrentUser() user: AccountUser) {
    return { success: true, data: await this.usersService.listServiceRequests(user.userId) };
  }

  @Get('service-requests/:id')
  async serviceRequest(@CurrentUser() user: AccountUser, @Param('id') id: string) {
    return { success: true, data: await this.usersService.getServiceRequest(user.userId, id) };
  }

  @Post('service-requests/claim')
  async claimServiceRequest(
    @CurrentUser() user: AccountUser,
    @Body() dto: ClaimServiceRequestDto,
  ) {
    return {
      success: true,
      message: 'Yêu cầu dịch vụ đã được liên kết với tài khoản',
      data: await this.usersService.claimServiceRequest(user.userId, dto),
    };
  }

  @Post('service-requests/:id/review')
  async reviewServiceRequest(
    @CurrentUser() user: AccountUser,
    @Param('id') id: string,
    @Body() dto: ServiceRequestReviewDto,
  ) {
    return {
      success: true,
      message: 'Cảm ơn bạn đã đánh giá dịch vụ',
      data: await this.usersService.reviewServiceRequest(user.userId, id, dto),
    };
  }

  @Get('notifications')
  async notifications(@CurrentUser() user: AccountUser) {
    return { success: true, data: await this.usersService.listNotifications(user.userId) };
  }

  @Patch('notifications/read-all')
  async readAllNotifications(@CurrentUser() user: AccountUser) {
    return { success: true, data: await this.usersService.markAllNotificationsRead(user.userId) };
  }

  @Patch('notifications/:id/read')
  async readNotification(@CurrentUser() user: AccountUser, @Param('id') id: string) {
    return { success: true, data: await this.usersService.markNotificationRead(user.userId, BigInt(id)) };
  }

  @Get('sessions')
  async sessions(@CurrentUser() user: AccountUser) {
    return {
      success: true,
      data: await this.usersService.listSessions(user.userId, user.sessionId),
    };
  }

  @Delete('sessions/:id')
  async revokeSession(@CurrentUser() user: AccountUser, @Param('id') id: string) {
    return {
      success: true,
      message: id === user.sessionId ? 'Phiên hiện tại đã được thu hồi' : 'Phiên đăng nhập đã được thu hồi',
      data: await this.usersService.revokeSession(user.userId, id),
    };
  }
}
