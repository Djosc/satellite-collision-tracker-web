import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SatelliteModule } from './satellite/satellite.module';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    SatelliteModule,
    ProxyModule,
  ],
})
export class AppModule {} 