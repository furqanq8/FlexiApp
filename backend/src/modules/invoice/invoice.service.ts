import { Injectable } from '@nestjs/common';
import { InvoiceStatus, InvoiceType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { AuditService } from '../audit/audit.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async create(dto: CreateInvoiceDto, actorId: string | null) {
    const invoiceNumber = dto.invoiceNumber || (await this.generateInvoiceNumber(dto.type));
    const invoice = await this.prisma.invoice.create({
      data: {
        ...dto,
        invoiceNumber,
        status: dto.status || InvoiceStatus.PENDING,
        amount: Number(dto.amount),
        paidAmount: dto.paidAmount !== undefined ? Number(dto.paidAmount) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined
      }
    });
    await this.auditService.log(actorId, 'create', 'invoice', invoice.id, dto);
    return this.findOne(invoice.id);
  }

  findAll() {
    return this.prisma.invoice.findMany({ include: { trip: true, customer: true, supplier: true, payments: true } });
  }

  findOne(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: { trip: true, customer: true, supplier: true, payments: true }
    });
  }

  async update(id: string, dto: UpdateInvoiceDto, actorId: string | null) {
    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...dto,
        amount: dto.amount !== undefined ? Number(dto.amount) : undefined,
        paidAmount: dto.paidAmount !== undefined ? Number(dto.paidAmount) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined
      }
    });
    await this.auditService.log(actorId, 'update', 'invoice', id, dto);
    await this.refreshStatus(id);
    return this.findOne(id);
  }

  async remove(id: string, actorId: string | null) {
    const invoice = await this.prisma.invoice.delete({ where: { id } });
    await this.auditService.log(actorId, 'delete', 'invoice', id, null);
    return invoice;
  }

  async refreshStatus(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    });
    if (!invoice) return;
    const paidTotal = invoice.payments.reduce((acc, payment) => acc + Number(payment.amount), 0);
    const amount = Number(invoice.amount);
    let status = InvoiceStatus.PENDING;
    if (paidTotal === 0) {
      status = InvoiceStatus.PENDING;
    } else if (paidTotal < amount) {
      status = InvoiceStatus.PARTIALLY_PAID;
    } else {
      status = InvoiceStatus.PAID;
    }
    await this.prisma.invoice.update({
      where: { id },
      data: { paidAmount: paidTotal, status }
    });
  }

  async generatePdf(id: string) {
    const invoice = await this.findOne(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    if (!invoice.trip) {
      throw new Error('Invoice trip context missing');
    }
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve) => {
      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text('FlexiApp Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`);
      doc.text(`Type: ${invoice.type}`);
      doc.text(`Status: ${invoice.status}`);
      doc.text(`Trip Reference: ${invoice.trip.reference}`);
      doc.text(`Amount: ${invoice.amount}`);
      doc.text(`Paid Amount: ${invoice.paidAmount}`);
      doc.text(`Due Date: ${invoice.dueDate?.toISOString() ?? 'N/A'}`);
      if (invoice.customer) {
        doc.moveDown();
        doc.text(`Bill To: ${invoice.customer.name}`);
        if (invoice.customer.email) doc.text(invoice.customer.email);
      }
      if (invoice.supplier) {
        doc.moveDown();
        doc.text(`Supplier: ${invoice.supplier.name}`);
      }
      doc.end();
    });
  }

  private async generateInvoiceNumber(type: InvoiceType) {
    const prefix = type === InvoiceType.CUSTOMER ? 'INV-CUS' : 'INV-SUP';
    const count = await this.prisma.invoice.count({ where: { type } });
    return `${prefix}-${(count + 1).toString().padStart(4, '0')}`;
  }
}
