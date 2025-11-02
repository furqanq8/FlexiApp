import { Injectable } from '@nestjs/common';
import { InvoiceType, TripStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(params: { startDate?: string; endDate?: string }) {
    const { startDate, endDate } = params;
    const rangeFilter = startDate || endDate ? { gte: startDate ? new Date(startDate) : undefined, lte: endDate ? new Date(endDate) : undefined } : undefined;

    const customerInvoices = await this.prisma.invoice.findMany({
      where: {
        type: InvoiceType.CUSTOMER,
        issuedAt: rangeFilter
      },
      include: { payments: true, customer: true }
    });

    const supplierInvoices = await this.prisma.invoice.findMany({
      where: {
        type: InvoiceType.SUPPLIER,
        issuedAt: rangeFilter
      }
    });

    const revenue = customerInvoices.reduce((acc, invoice) => acc + Number(invoice.paidAmount), 0);
    const outstandingReceivables = customerInvoices.reduce(
      (acc, invoice) => acc + (Number(invoice.amount) - Number(invoice.paidAmount)),
      0
    );
    const outstandingPayables = supplierInvoices.reduce(
      (acc, invoice) => acc + (Number(invoice.amount) - Number(invoice.paidAmount)),
      0
    );

    const trips = await this.prisma.trip.findMany({
      where: {
        startDate: rangeFilter,
        endDate: rangeFilter
      }
    });
    const completedTrips = trips.filter((trip) => trip.status === TripStatus.COMPLETED).length;
    const fleetCount = await this.prisma.fleet.count();
    const utilization = fleetCount === 0 ? 0 : Number(((completedTrips / fleetCount) * 100).toFixed(2));

    const customerTotals = new Map<string, { name: string; total: number }>();
    customerInvoices.forEach((invoice) => {
      const key = invoice.customerId || 'unknown';
      const entry = customerTotals.get(key) || { name: invoice.customer?.name || 'Unknown', total: 0 };
      entry.total += Number(invoice.amount);
      customerTotals.set(key, entry);
    });
    const topCustomers = Array.from(customerTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      revenue,
      outstandingReceivables,
      outstandingPayables,
      utilization,
      completedTrips,
      totalTrips: trips.length,
      topCustomers
    };
  }
}
