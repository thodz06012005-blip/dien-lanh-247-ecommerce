import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Res, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { clearAuthCookies, setAuthCookies } from './auth-cookie';
import { AuditLogService } from '../audit/audit-log.service';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.loginAdmin(loginDto, req);

    setAuthCookies(res, 'admin', { accessToken: result.token, refreshToken: result.refreshToken });

    // Strip refreshToken from the JSON response
    const { refreshToken, ...responsePayload } = result;

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: responsePayload,
    };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshAdmin(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as any;
    const tokens = await this.authService.refreshTokens(user.userId, user.refreshToken, 'admin');
    setAuthCookies(res, 'admin', tokens);
    return { success: true, message: 'Làm mới phiên quản trị thành công' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.STAFF)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logoutAdmin(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    await this.authService.logoutAdmin(user.userId);
    this.auditLogService.auditSuccess(req, 'AUTH_LOGOUT', 'auth', String(user.userId), null, 'Admin logout successful');

    clearAuthCookies(res, 'admin');

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
