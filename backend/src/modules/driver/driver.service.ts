import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DriverService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async create(dto: CreateDriverDto, actorId: string | null) {
    const driver = await this.prisma.driver.create({ data: dto });
    await this.auditService.log(actorId, 'create', 'driver', driver.id, dto);
    return driver;
  }

  findAll() {
    return this.prisma.driver.findMany({ include: { supplier: true } });
  }

  findOne(id: string) {
    return this.prisma.driver.findUnique({ where: { id }, include: { supplier: true } });
  }

  async update(id: string, dto: UpdateDriverDto, actorId: string | null) {
    const driver = await this.prisma.driver.update({ where: { id }, data: dto });
    await this.auditService.log(actorId, 'update', 'driver', id, dto);
    return driver;
  }

  async remove(id: string, actorId: string | null) {
    const driver = await this.prisma.driver.delete({ where: { id } });
    await this.auditService.log(actorId, 'delete', 'driver', id, null);
    return driver;
  }
}
