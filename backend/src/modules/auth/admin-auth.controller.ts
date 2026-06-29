import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(@Body() loginDto: LoginDto) {
    const result = await this.authService.loginAdmin(loginDto);
    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logoutAdmin(@CurrentUser() user: any) {
    await this.authService.logoutAdmin(user.userId);
    return {
      success: true,
      message: 'Đăng xuất thành công',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('me')
  async getAdminProfile(@CurrentUser() user: any) {
    const result = await this.authService.getAdminProfile(user.userId);
    return {
      success: true,
      data: result,
    };
  }
}
