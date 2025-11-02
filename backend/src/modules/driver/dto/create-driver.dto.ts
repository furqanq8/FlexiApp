import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DriverType } from '@prisma/client';

export class CreateDriverDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsEnum(DriverType)
  type: DriverType;

  @IsOptional()
  @IsString()
  supplierId?: string;
}
