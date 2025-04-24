import { Controller, All, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';

@Controller('proxy')
export class ProxyController {
  constructor(private httpService: HttpService) {}

  @All('mapbox/*')
  async proxyMapbox(@Req() req: Request) {
    try {
      const path = req.url.replace('/proxy/mapbox', '');
      const targetUrl = `https://api.mapbox.com${path}`;
      console.log('Proxying request to:', targetUrl);
      
      const response = await firstValueFrom(this.httpService.request({
        method: req.method,
        url: targetUrl,
        headers: {
          ...req.headers,
          'User-Agent': 'mapbox-gl-js',
          'Referer': 'http://localhost:3000/'
        },
        maxRedirects: 5,
        httpsAgent: new https.Agent({
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2'
        })
      }));

      return response.data;
    } catch (error) {
      console.error('Proxy error:', error.message);
      throw error;
    }
  }
} 