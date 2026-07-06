import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { Response } from 'express';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.loginAdmin(loginDto);

    // Set HttpOnly Cookies for Admin Access Token and Refresh Token
    res.cookie('accessToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/admin/auth/refresh', // path constraint
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Strip refreshToken from the JSON response
    const { refreshToken, ...responsePayload } = result;

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: responsePayload,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logoutAdmin(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.authService.logoutAdmin(user.userId);

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/admin/auth/refresh',
    });

    return {
      success: true,
      message: 'Đăng xuất thành công',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Get('me')
  async getAdminProfile(@CurrentUser() user: any) {
    const result = await this.authService.getAdminProfile(user.userId);
    return {
      success: true,
      data: result,
    };
  }
}
