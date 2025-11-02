import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(actorId: string | null, action: string, entity: string, entityId: string, metadata?: any) {
    await this.prisma.auditLog.create({
      data: { actorId, action, entity, entityId, metadata }
    });
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
}
