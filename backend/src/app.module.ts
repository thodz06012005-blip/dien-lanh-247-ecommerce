import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './core/database/prisma.module';
import { CloudinaryModule } from './integrations/cloudinary/cloudinary.module';
import { MailModule } from './integrations/mail/mail.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ContactModule } from './modules/contact/contact.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AuditLogModule } from './modules/audit/audit-log.module';
import { CustomerVerificationModule } from './modules/customer-verification/customer-verification.module';
import { OperationsModule } from './modules/service-operations/operations.module';
import { ServiceQuotesModule } from './modules/service-quotes/service-quotes.module';

const serviceOnly = process.env.SERVICE_ONLY !== 'false';
const commerceModules = serviceOnly
  ? []
  : [
      require('./modules/products/products.module').ProductsModule,
      require('./modules/categories/categories.module').CategoriesModule,
      require('./modules/brands/brands.module').BrandsModule,
      require('./modules/cart/cart.module').CartModule,
      require('./modules/orders/orders.module').OrdersModule,
      require('./integrations/payment/vnpay/vnpay.module').VnpayModule,
    ];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    UsersModule,
    AuthModule,
    ...commerceModules,
    CloudinaryModule,
    MailModule,
    ServiceCategoriesModule,
    TechniciansModule,
    ServiceRequestsModule,
    SettingsModule,
    ContactModule,
    DashboardModule,
    CustomersModule,
    AuditLogModule,
    CustomerVerificationModule,
    OperationsModule,
    ServiceQuotesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
