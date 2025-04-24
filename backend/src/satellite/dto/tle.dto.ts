import { ApiProperty } from '@nestjs/swagger';

export class TleDto {
  @ApiProperty({ description: 'Satellite name' })
  name: string;

  @ApiProperty({ description: 'First line of TLE data' })
  line1: string;

  @ApiProperty({ description: 'Second line of TLE data' })
  line2: string;
} 