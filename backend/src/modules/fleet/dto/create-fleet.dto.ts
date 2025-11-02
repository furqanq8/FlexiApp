import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FleetOwnership } from '@prisma/client';

export class CreateFleetDto {
  @IsString()
  fleetCode: string;

  @IsString()
  serial: string;

  @IsString()
  type: string;

  @IsEnum(FleetOwnership)
  ownership: FleetOwnership;

  @IsOptional()
  @IsString()
  supplierId?: string;
}
