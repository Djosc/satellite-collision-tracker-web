import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CollisionDto } from './dto/collision.dto';
import { TleDto } from './dto/tle.dto';

@Injectable()
export class SatelliteService {
  private readonly spaceTrackBaseUrl = 'https://www.space-track.org';
  private readonly username: string;
  private readonly password: string;
  private authCookie: string | null = null;

  constructor(private configService: ConfigService) {
    this.username = this.configService.get<string>('SPACE_TRACK_USERNAME');
    this.password = this.configService.get<string>('SPACE_TRACK_PASSWORD');
  }

  private async authenticate() {
    try {
      const response = await axios.post(`${this.spaceTrackBaseUrl}/ajaxauth/login`, {
        identity: this.username,
        password: this.password,
      });
      this.authCookie = response.headers['set-cookie']?.[0];
    } catch (error) {
      console.error('Authentication failed:', error.message);
      throw new Error('Failed to authenticate with Space-Track');
    }
  }

  async getCollisions(): Promise<CollisionDto[]> {
    try {
      // For testing, return mock data until we have Space-Track credentials
      return [
        {
          NAME_1: "STARLINK-1862",
          NAME_2: "COSMOS 2251 DEB",
          MAX_PROBABILITY: "0.0242",
          MIN_RANGE_KM: "0.076",
          REL_VELOCITY_KM_SEC: "14.67",
          CLOSEST_APPROACH_UTC: "2024-04-25 03:45:00"
        },
        {
          NAME_1: "STARLINK-2121",
          NAME_2: "SL-16 R/B",
          MAX_PROBABILITY: "0.0156",
          MIN_RANGE_KM: "0.094",
          REL_VELOCITY_KM_SEC: "11.23",
          CLOSEST_APPROACH_UTC: "2024-04-25 15:30:00"
        }
      ];
    } catch (error) {
      console.error('Error fetching collisions:', error.message);
      throw new Error('Failed to fetch collision data');
    }
  }

  async getTle(id: string): Promise<TleDto> {
    try {
      // For testing, return mock data until we have Space-Track credentials
      return {
        name: `SATELLITE ${id}`,
        line1: "1 25544U 98067A   24114.91667824  .00010379  00000+0  18662-3 0  9990",
        line2: "2 25544  51.6412 238.9184 0006096  47.4100  61.4906 15.49553326435367"
      };
    } catch (error) {
      console.error('Error fetching TLE data:', error.message);
      throw new Error('Failed to fetch TLE data');
    }
  }
} 