import { BadRequestException, Injectable } from '@nestjs/common';
import { FleetOwnership, InvoiceStatus, InvoiceType, TripStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TripService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async create(dto: CreateTripDto, actorId: string | null) {
    const existing = await this.prisma.trip.findUnique({ where: { reference: dto.reference } });
    if (existing) {
      throw new BadRequestException('Reference already exists');
    }
    const trip = await this.prisma.trip.create({
      data: {
        ...dto,
        rate: Number(dto.rate),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: dto.status || TripStatus.PLANNED
      }
    });
    await this.auditService.log(actorId, 'create', 'trip', trip.id, dto);
    if (trip.status === TripStatus.COMPLETED) {
      await this.handleCompletion(trip.id, actorId);
    }
    return this.findOne(trip.id);
  }

  findAll() {
    return this.prisma.trip.findMany({
      include: { fleet: true, driver: true, customer: true, supplier: true, invoices: true }
    });
  }

  findOne(id: string) {
    return this.prisma.trip.findUnique({
      where: { id },
      include: { fleet: true, driver: true, customer: true, supplier: true, invoices: true }
    });
  }

  async update(id: string, dto: UpdateTripDto, actorId: string | null) {
    const previous = await this.prisma.trip.findUnique({ where: { id } });
    if (!previous) {
      throw new BadRequestException('Trip not found');
    }
    const trip = await this.prisma.trip.update({
      where: { id },
      data: {
        ...dto,
        rate: dto.rate !== undefined ? Number(dto.rate) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined
      }
    });
    await this.auditService.log(actorId, 'update', 'trip', id, dto);
    if (dto.status === TripStatus.COMPLETED && previous.status !== TripStatus.COMPLETED) {
      await this.handleCompletion(trip.id, actorId);
    }
    return this.findOne(id);
  }

  async remove(id: string, actorId: string | null) {
    const trip = await this.prisma.trip.delete({ where: { id } });
    await this.auditService.log(actorId, 'delete', 'trip', id, null);
    return trip;
  }

  private async handleCompletion(tripId: string, actorId: string | null) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { fleet: true }
    });
    if (!trip) {
      return;
    }

    const dueDate = new Date(trip.endDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const tripAmount = Number(trip.rate);

    const customerInvoice = await this.prisma.invoice.findFirst({
      where: { tripId, type: InvoiceType.CUSTOMER }
    });
    if (!customerInvoice) {
      const invoiceNumber = await this.generateInvoiceNumber('INV-CUS');
      const created = await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          type: InvoiceType.CUSTOMER,
          status: InvoiceStatus.PENDING,
          amount: tripAmount,
          tripId: trip.id,
          customerId: trip.customerId,
          dueDate
        }
      });
      await this.auditService.log(actorId, 'create', 'invoice', created.id, {
        type: 'customer',
        tripId,
        invoiceNumber
      });
    }

    if (trip.fleet.ownership === FleetOwnership.RENT_IN && trip.supplierId) {
      const supplierInvoice = await this.prisma.invoice.findFirst({
        where: { tripId, type: InvoiceType.SUPPLIER }
      });
      if (!supplierInvoice) {
        const invoiceNumber = await this.generateInvoiceNumber('INV-SUP');
        const supplierAmount = Number((tripAmount * 0.7).toFixed(2));
        const createdSupplierInvoice = await this.prisma.invoice.create({
          data: {
            invoiceNumber,
            type: InvoiceType.SUPPLIER,
            status: InvoiceStatus.PENDING,
            amount: supplierAmount,
            tripId: trip.id,
            supplierId: trip.supplierId,
            dueDate
          }
        });
        await this.auditService.log(actorId, 'create', 'invoice', createdSupplierInvoice.id, {
          type: 'supplier',
          tripId,
          invoiceNumber
        });
      }
    }
  }

  private async generateInvoiceNumber(prefix: string) {
    const count = await this.prisma.invoice.count({
      where: { invoiceNumber: { startsWith: prefix } }
    });
    return `${prefix}-${(count + 1).toString().padStart(4, '0')}`;
  }
}
