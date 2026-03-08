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
    // Store user location with TTL of 5 minutes
    await this.redis.set(
      `nearby:${userId}`,
      JSON.stringify({ lat, lng, userId }),
      'EX',
      300,
    );

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

  /**
   * Wave at another family — creates or returns a shared chat room key stored in Redis.
   * Both parties joining the same room key enables real-time chat via the ChatGateway.
   */
  async wave(fromUserId: string, toUserId: string): Promise<{ roomId: string }> {
    // Deterministic room ID so both parties always join the same room
    const sorted = [fromUserId, toUserId].sort();
    const roomId = `room:${sorted[0]}:${sorted[1]}`;

    // Persist wave intent so the other party can detect it
    await this.redis.set(`wave:${fromUserId}:${toUserId}`, '1', 'EX', 120);

    return { roomId };
  }

  /**
   * Report a nearby user — stores the report flag in Redis for moderator review.
   * In a production system this would write to a Report collection.
   */
  async report(reportingUserId: string, reportedUserId: string, reason: string): Promise<void> {
    const key = `report:${reportingUserId}:${reportedUserId}`;
    await this.redis.set(
      key,
      JSON.stringify({ reportingUserId, reportedUserId, reason, timestamp: Date.now() }),
      'EX',
      86400 * 7, // 7 days
    );
    // Also block future nearby visibility between the two users
    await this.redis.set(`block:${reportingUserId}:${reportedUserId}`, '1', 'EX', 86400 * 30);
  }
}
