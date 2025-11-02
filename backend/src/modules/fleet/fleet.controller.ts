import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FleetService } from './fleet.service';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('fleet')
@ApiBearerAuth()
@Controller('fleets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Post()
  @Roles('admin', 'manager')
  create(@Body() dto: CreateFleetDto, @Req() req: any) {
    return this.fleetService.create(dto, req.user?.userId || null);
  }

  @Get()
  findAll() {
    return this.fleetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fleetService.findOne(id);
  }

  @Put(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() dto: UpdateFleetDto, @Req() req: any) {
    return this.fleetService.update(id, dto, req.user?.userId || null);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.fleetService.remove(id, req.user?.userId || null);
  }
}
