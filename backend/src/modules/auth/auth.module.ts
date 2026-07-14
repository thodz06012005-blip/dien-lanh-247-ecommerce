import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAccountService } from './admin-account.service';
import { AdminAuthController } from './admin-auth.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginRateLimitService } from './login-rate-limit.service';
import { JwtAdminRefreshStrategy } from './strategies/jwt-admin-refresh.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), ConfigModule],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    AdminAccountService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAdminRefreshStrategy,
    LoginRateLimitService,
  ],
  exports: [AuthService, AdminAccountService],
})
export class AuthModule {}
