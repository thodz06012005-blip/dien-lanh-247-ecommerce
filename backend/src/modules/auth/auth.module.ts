import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAccountService } from './admin-account.service';
import { AdminAuthController } from './admin-auth.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginRateLimitService } from './login-rate-limit.service';
import { JwtAdminRefreshStrategy } from './strategies/jwt-admin-refresh.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UniqueJwtService } from './unique-jwt.service';

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
    { provide: JwtService, useClass: UniqueJwtService },
  ],
  exports: [AuthService, AdminAccountService],
})
export class AuthModule {}
