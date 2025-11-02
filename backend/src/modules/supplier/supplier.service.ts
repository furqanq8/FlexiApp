import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async create(dto: CreateSupplierDto, actorId: string | null) {
    const supplier = await this.prisma.supplier.create({ data: dto });
    await this.auditService.log(actorId, 'create', 'supplier', supplier.id, dto);
    return supplier;
  }

  findAll() {
    return this.prisma.supplier.findMany({ include: { drivers: true, fleets: true } });
  }

  findOne(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
      include: { drivers: true, fleets: true }
    });
  }

  async update(id: string, dto: UpdateSupplierDto, actorId: string | null) {
    const supplier = await this.prisma.supplier.update({ where: { id }, data: dto });
    await this.auditService.log(actorId, 'update', 'supplier', id, dto);
    return supplier;
  }

  async remove(id: string, actorId: string | null) {
    const supplier = await this.prisma.supplier.delete({ where: { id } });
    await this.auditService.log(actorId, 'delete', 'supplier', id, null);
    return supplier;
  }
}
