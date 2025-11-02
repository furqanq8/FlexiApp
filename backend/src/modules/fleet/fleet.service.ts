import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FleetService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async create(dto: CreateFleetDto, actorId: string | null) {
    const fleet = await this.prisma.fleet.create({ data: dto });
    await this.auditService.log(actorId, 'create', 'fleet', fleet.id, dto);
    return fleet;
  }

  findAll() {
    return this.prisma.fleet.findMany({
      include: { supplier: true }
    });
  }

  findOne(id: string) {
    return this.prisma.fleet.findUnique({ where: { id }, include: { supplier: true } });
  }

  async update(id: string, dto: UpdateFleetDto, actorId: string | null) {
    const fleet = await this.prisma.fleet.update({ where: { id }, data: dto });
    await this.auditService.log(actorId, 'update', 'fleet', id, dto);
    return fleet;
  }

  async remove(id: string, actorId: string | null) {
    const fleet = await this.prisma.fleet.delete({ where: { id } });
    await this.auditService.log(actorId, 'delete', 'fleet', id, null);
    return fleet;
  }
}
