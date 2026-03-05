import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { distance, point } from '@turf/turf';

@Injectable()
export class NearbyService {
  private redis: Redis;

  constructor(private config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
    });
  }

  async checkNearby(userId: string, lat: number, lng: number) {
    // Store user location with 5 min TTL
    await this.redis.setex(
      `nearby:${userId}`,
      300,
      JSON.stringify({ lat, lng, userId }),
    );

    // Find all nearby users
    const keys = await this.redis.keys('nearby:*');
    const nearbyUsers: { userId: string; distance: number }[] = [];
    const userPoint = point([lng, lat]);

    for (const key of keys) {
      const otherId = key.replace('nearby:', '');
      if (otherId === userId) continue;

      const data = await this.redis.get(key);
      if (!data) continue;

      const other = JSON.parse(data);
      const otherPoint = point([other.lng, other.lat]);
      const dist = distance(userPoint, otherPoint, { units: 'meters' });

      if (dist <= 500) {
        nearbyUsers.push({ userId: otherId, distance: Math.round(dist) });
      }
    }

    return nearbyUsers;
  }
}
