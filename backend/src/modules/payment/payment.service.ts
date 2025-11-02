import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InvoiceService } from '../invoice/invoice.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private invoiceService: InvoiceService,
    private auditService: AuditService
  ) {}

  async create(dto: CreatePaymentDto, actorId: string | null) {
    const payment = await this.prisma.payment.create({
      data: {
        ...dto,
        amount: Number(dto.amount)
      }
    });
    await this.invoiceService.refreshStatus(dto.invoiceId);
    await this.auditService.log(actorId, 'create', 'payment', payment.id, dto);
    return payment;
  }

  findAll() {
    return this.prisma.payment.findMany({ include: { invoice: true } });
  }

  findOne(id: string) {
    return this.prisma.payment.findUnique({ where: { id }, include: { invoice: true } });
  }

  async update(id: string, dto: UpdatePaymentDto, actorId: string | null) {
    const original = await this.prisma.payment.findUnique({ where: { id } });
    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        ...dto,
        amount: dto.amount !== undefined ? Number(dto.amount) : undefined
      }
    });
    await this.invoiceService.refreshStatus(payment.invoiceId);
    if (original && original.invoiceId !== payment.invoiceId) {
      await this.invoiceService.refreshStatus(original.invoiceId);
    }
    await this.auditService.log(actorId, 'update', 'payment', id, dto);
    return payment;
  }

  async remove(id: string, actorId: string | null) {
    const payment = await this.prisma.payment.delete({ where: { id } });
    await this.invoiceService.refreshStatus(payment.invoiceId);
    await this.auditService.log(actorId, 'delete', 'payment', id, null);
    return payment;
  }
}
