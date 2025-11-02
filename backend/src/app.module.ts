import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { FleetModule } from './modules/fleet/fleet.module';
import { DriverModule } from './modules/driver/driver.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { CustomerModule } from './modules/customer/customer.module';
import { TripModule } from './modules/trip/trip.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { PaymentModule } from './modules/payment/payment.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    FleetModule,
    DriverModule,
    SupplierModule,
    CustomerModule,
    TripModule,
    InvoiceModule,
    PaymentModule,
    DashboardModule,
    AuditModule
  ],
  providers: [PrismaService]
})
export class AppModule {}
