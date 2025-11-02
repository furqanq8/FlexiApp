import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async create(dto: CreateCustomerDto, actorId: string | null) {
    const customer = await this.prisma.customer.create({ data: dto });
    await this.auditService.log(actorId, 'create', 'customer', customer.id, dto);
    return customer;
  }

  findAll() {
    return this.prisma.customer.findMany({ include: { trips: true } });
  }

  findOne(id: string) {
    return this.prisma.customer.findUnique({ where: { id }, include: { trips: true } });
  }

  async update(id: string, dto: UpdateCustomerDto, actorId: string | null) {
    const customer = await this.prisma.customer.update({ where: { id }, data: dto });
    await this.auditService.log(actorId, 'update', 'customer', id, dto);
    return customer;
  }

  async remove(id: string, actorId: string | null) {
    const customer = await this.prisma.customer.delete({ where: { id } });
    await this.auditService.log(actorId, 'delete', 'customer', id, null);
    return customer;
  }
}
