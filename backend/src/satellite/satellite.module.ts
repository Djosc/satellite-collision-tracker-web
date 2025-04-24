import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SatelliteController } from './satellite.controller';
import { SatelliteService } from './satellite.service';

@Module({
  imports: [ConfigModule],
  controllers: [SatelliteController],
  providers: [SatelliteService],
})
export class SatelliteModule {} 