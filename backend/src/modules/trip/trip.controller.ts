import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TripService } from './trip.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma.service';

@ApiTags('trips')
@ApiBearerAuth()
@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripController {
  constructor(private readonly tripService: TripService, private prisma: PrismaService) {}

  @Post()
  @Roles('admin', 'manager')
  create(@Body() dto: CreateTripDto, @Req() req: any) {
    return this.tripService.create(dto, req.user?.userId || null);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'rentalMode', required: false })
  async findAll(@Query() query: PaginationDto & { status?: string; rentalMode?: string }) {
    const { skip = 0, take = 25, status, rentalMode } = query;
    return this.prisma.trip.findMany({
      skip: Number(skip),
      take: Number(take),
      where: {
        status: status ? (status as any) : undefined,
        rentalMode: rentalMode ? (rentalMode as any) : undefined
      },
      include: { fleet: true, driver: true, customer: true, supplier: true, invoices: true },
      orderBy: { startDate: 'desc' }
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripService.findOne(id);
  }

  @Put(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() dto: UpdateTripDto, @Req() req: any) {
    return this.tripService.update(id, dto, req.user?.userId || null);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tripService.remove(id, req.user?.userId || null);
  }
}
