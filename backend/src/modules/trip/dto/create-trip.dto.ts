import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { RentalMode, TripStatus } from '@prisma/client';

export class CreateTripDto {
  @IsString()
  reference: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RentalMode)
  rentalMode: RentalMode;

  @Type(() => Number)
  @IsNumber()
  rate: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;

  @IsString()
  fleetId: string;

  @IsString()
  driverId: string;

  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}
