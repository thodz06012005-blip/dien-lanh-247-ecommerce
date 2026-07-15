import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface CurrentSessionUser {
  userId: number;
  email: string;
  role: string;
  sessionId: string;
  familyId?: string;
  tokenVersion: number;
  refreshToken?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user, verification } = await this.authService.register(
      registerDto,
      req,
    );
    this.setTokenCookies(res, tokens);
    return {
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user,
        verificationSent: verification.verificationSent,
        debugToken: verification.debugToken,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user, linkedCount } = await this.authService.login(
      loginDto,
      req,
    );
    this.setTokenCookies(res, tokens);
    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: { ...user, linkedServiceRequests: linkedCount },
    };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as CurrentSessionUser;
    const tokens = await this.authService.refreshTokens(
      {
        userId: user.userId,
        email: user.email,
        role: user.role,
        sessionId: user.sessionId,
        familyId: user.familyId ?? '',
        tokenVersion: user.tokenVersion,
        refreshToken: user.refreshToken ?? '',
      },
      req,
    );
    this.setTokenCookies(res, tokens);
    return { success: true, message: 'Phiên đăng nhập đã được làm mới' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async logout(
    @CurrentUser() user: CurrentSessionUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.userId, user.sessionId);
    this.clearTokenCookies(res);
    return { success: true, message: 'Đăng xuất thành công' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async logoutAll(
    @CurrentUser() user: CurrentSessionUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeAllSessions(
      user.userId,
      'CUSTOMER_LOGOUT_ALL',
    );
    this.clearTokenCookies(res);
    return { success: true, message: 'Đã đăng xuất khỏi tất cả thiết bị' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const result = await this.authService.requestPasswordReset(dto, req);
    return {
      success: true,
      message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.',
      data: result.debugToken ? { debugToken: result.debugToken } : undefined,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.resetPassword(dto);
    this.clearTokenCookies(res);
    return {
      success: true,
      message: 'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.',
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto.token);
    return {
      success: true,
      message: 'Xác minh email thành công',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-email/resend')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async resendVerification(@CurrentUser() user: CurrentSessionUser) {
    const result = await this.authService.resendEmailVerification(user.userId);
    return {
      success: true,
      message: result.verificationSent
        ? 'Đã gửi lại email xác minh'
        : 'Email đã được xác minh',
      data: result.debugToken ? { debugToken: result.debugToken } : undefined,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: CurrentSessionUser) {
    const dbUser = await this.authService.getUserProfile(user.userId);
    return { success: true, data: dbUser };
  }

  private cookieSecure() {
    const configured = this.configService.get<string>('COOKIE_SECURE');
    return (
      configured === 'true' ||
      (configured !== 'false' &&
        this.configService.get('NODE_ENV') === 'production')
    );
  }

  private setTokenCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const secure = this.cookieSecure();
    const sameSite = this.configService.get<'strict' | 'lax' | 'none'>(
      'COOKIE_SAME_SITE',
      'strict',
    );
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearTokenCookies(res: Response) {
    const secure = this.cookieSecure();
    const sameSite = this.configService.get<'strict' | 'lax' | 'none'>(
      'COOKIE_SAME_SITE',
      'strict',
    );
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/v1/auth/refresh',
    });
  }
}
