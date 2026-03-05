import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { distance, point } from '@turf/turf';

@Injectable()
export class NearbyService {
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: parseInt(this.configService.get('REDIS_PORT', '6379')),
    });
  }

  async checkNearby(userId: string, lat: number, lng: number) {
    // Store user location with TTL
    await this.redis.set(
      `nearby:${userId}`,
      JSON.stringify({ lat, lng, userId }),
      'EX',
      300,
    );

    // Find all nearby users
    const keys = await this.redis.keys('nearby:*');
    const nearbyUsers: any[] = [];

    for (const key of keys) {
      const id = key.replace('nearby:', '');
      if (id === userId) continue;

      const data = await this.redis.get(key);
      if (!data) continue;

      const other = JSON.parse(data);
      const from = point([lng, lat]);
      const to = point([other.lng, other.lat]);
      const dist = distance(from, to, { units: 'meters' });

      if (dist <= 500) {
        nearbyUsers.push({ userId: id, distance: Math.round(dist) });
      }
    }

    return nearbyUsers;
  }
}
