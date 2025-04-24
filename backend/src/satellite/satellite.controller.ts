import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SatelliteService } from './satellite.service';
import { CollisionDto } from './dto/collision.dto';
import { TleDto } from './dto/tle.dto';

@ApiTags('satellite')
@Controller('satellite')
export class SatelliteController {
  constructor(private readonly satelliteService: SatelliteService) {}

  @Get('collisions')
  @ApiOperation({ summary: 'Get satellite collision data' })
  async getCollisions(): Promise<CollisionDto[]> {
    return this.satelliteService.getCollisions();
  }

  @Get('tle')
  @ApiOperation({ summary: 'Get TLE data for a satellite' })
  @ApiQuery({ name: 'id', required: true, description: 'Satellite ID' })
  async getTle(@Query('id') id: string): Promise<TleDto> {
    return this.satelliteService.getTle(id);
  }
} 