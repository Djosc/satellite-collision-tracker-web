import { ApiProperty } from '@nestjs/swagger';

export class CollisionDto {
  @ApiProperty({ description: 'Name of the first satellite' })
  NAME_1: string;

  @ApiProperty({ description: 'Name of the second satellite' })
  NAME_2: string;

  @ApiProperty({ description: 'Maximum probability of collision' })
  MAX_PROBABILITY: string;

  @ApiProperty({ description: 'Minimum range in kilometers' })
  MIN_RANGE_KM: string;

  @ApiProperty({ description: 'Relative velocity in kilometers per second' })
  REL_VELOCITY_KM_SEC: string;

  @ApiProperty({ description: 'Closest approach time in UTC' })
  CLOSEST_APPROACH_UTC: string;
} 