import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import axios from 'axios';
import { Hunt, HuntDocument } from '../schemas/hunt.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class HuntsService {
  constructor(
    @InjectModel(Hunt.name) private huntModel: Model<HuntDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private config: ConfigService,
  ) {}

  async generate(userId: string, body: any) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    if (user.history.length >= 1 && user.subscription.plan === 'free') {
      throw new HttpException({ success: false, message: 'subscription_required', statusCode: 402 }, 402);
    }

    const { lat, lng, theme, mood, ages } = body;

    // Fetch nearby POIs from Overpass
    const overpassTags = this.getOverpassTags(theme);
    const overpassQuery = `[out:json][timeout:25];node(around:2000,${lat},${lng})[${overpassTags}];out body 10;`;
    const overpassRes = await axios.post(
      this.config.get('OVERPASS_API_URL'),
      `data=${encodeURIComponent(overpassQuery)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const pois = overpassRes.data.elements.slice(0, 4).map((el: any) => ({
      name: el.tags?.name || el.tags?.leisure || 'Mystery Spot',
      lat: el.lat,
      lng: el.lon,
      type: el.tags?.leisure || el.tags?.tourism || 'poi',
    }));

    const stops = pois.map((poi: any, i: number) => ({
      ...poi,
      clue: this.generateClue(theme, poi.name, i),
      challenge: this.generateChallenge(theme, i),
      completed: false,
    }));

    // Fetch route from OpenRouteService
    let route = { distance: 0, duration: 0, polyline: '' };
    if (stops.length >= 2) {
      try {
        const coords = stops.map((s: any) => [s.lng, s.lat]);
        const orsRes = await axios.post(
          `${this.config.get('OPENROUTE_API_URL')}/directions/foot-walking`,
          { coordinates: coords },
          { headers: { Authorization: `Bearer ${this.config.get('OPENROUTE_API_KEY')}` } },
        );
        const summary = orsRes.data.routes?.[0]?.summary;
        route = {
          distance: summary?.distance || 0,
          duration: summary?.duration || 0,
          polyline: JSON.stringify(orsRes.data.routes?.[0]?.geometry),
        };
      } catch (e) {
        // Route service may fail; continue without route
      }
    }

    // Fetch weather from Open-Meteo
    let weather = { temp: 0, condition: '', icon: '' };
    try {
      const meteoRes = await axios.get(
        `${this.config.get('OPEN_METEO_URL')}?latitude=${lat}&longitude=${lng}&current_weather=true`,
      );
      const cw = meteoRes.data.current_weather;
      weather = { temp: cw.temperature, condition: String(cw.weathercode), icon: '' };
    } catch (e) {}

    const hunt = await this.huntModel.create({
      userId,
      theme,
      mood,
      ages,
      stops,
      route,
      weather,
      status: 'active',
    });

    return hunt;
  }

  async getHunt(id: string) {
    const hunt = await this.huntModel.findById(id).lean();
    if (!hunt) throw new NotFoundException('Hunt not found');
    return hunt;
  }

  async completeStop(huntId: string, stopIndex: number) {
    const hunt = await this.huntModel.findById(huntId);
    if (!hunt) throw new NotFoundException('Hunt not found');
    if (stopIndex >= hunt.stops.length) throw new ForbiddenException('Invalid stop index');

    hunt.stops[stopIndex].completed = true;
    hunt.stops[stopIndex].completedAt = new Date();
    await hunt.save();
    return hunt;
  }

  async completeHunt(huntId: string, userId: string) {
    const hunt = await this.huntModel.findByIdAndUpdate(
      huntId,
      { status: 'completed' },
      { new: true },
    );
    if (!hunt) throw new NotFoundException('Hunt not found');

    const streakResult = await this.updateStreak(userId, hunt.theme, hunt.mood);

    // Add to user history
    await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        history: {
          huntId: hunt._id.toString(),
          theme: hunt.theme,
          mood: hunt.mood,
          completedAt: new Date(),
        },
      },
    });

    return { hunt, ...streakResult };
  }

  async rateHunt(huntId: string, body: { rating: number; feedbackText?: string; wouldRecommend?: boolean }) {
    const hunt = await this.huntModel.findByIdAndUpdate(huntId, { $set: body }, { new: true }).lean();
    if (!hunt) throw new NotFoundException('Hunt not found');
    return hunt;
  }

  async generateRecap(huntId: string) {
    const hunt = await this.huntModel.findById(huntId).lean();
    if (!hunt) throw new NotFoundException('Hunt not found');

    // Simple recap — in production upload to Cloudinary
    const recapHtml = `
      <div style="background: linear-gradient(135deg, #FFF8E1, #FFD54F); padding: 24px; border-radius: 16px; font-family: 'Fredoka', sans-serif; max-width: 400px;">
        <h2>🐝 ${hunt.theme} Adventure Complete!</h2>
        <p>${hunt.stops.length} stops explored</p>
        <p>${(hunt.route.distance / 1000).toFixed(1)} km walked</p>
        <p>${Math.floor(Math.random() * 15) + 10} giggles estimated</p>
        <p style="font-size: 10px;">© 2025 Bumbee Ltd</p>
      </div>
    `;

    await this.huntModel.findByIdAndUpdate(huntId, { recapCardUrl: 'generated' });
    return { recapHtml };
  }

  async updateStreak(userId: string, theme: string, mood: string) {
    const user = await this.userModel.findById(userId);
    if (!user) return { newBadge: null };

    const now = new Date();
    const day = now.getDay(); // 0=Sun, 6=Sat
    const isWeekend = day === 0 || day === 6;

    if (!isWeekend) return { newBadge: null };

    const lastDate = user.streaks.lastWeekendDate;
    const sameWeekend =
      lastDate && Math.abs(now.getTime() - lastDate.getTime()) < 2 * 24 * 60 * 60 * 1000;

    if (sameWeekend) return { newBadge: null };

    const consecutiveWeekend =
      lastDate && Math.abs(now.getTime() - lastDate.getTime()) < 9 * 24 * 60 * 60 * 1000;

    user.streaks.currentStreak = consecutiveWeekend ? user.streaks.currentStreak + 1 : 1;
    user.streaks.weekendsPlanned += 1;
    user.streaks.lastWeekendDate = now;

    const milestones: Record<number, string> = {
      3: '🌟 Getting Started',
      7: '🔥 On Fire Family',
      15: '🏆 Adventure Pro',
      30: '👑 Bumbee Legends',
    };

    let newBadge: string | null = null;
    const streak = user.streaks.currentStreak;
    if (milestones[streak] && !user.streaks.badges.includes(milestones[streak])) {
      user.streaks.badges.push(milestones[streak]);
      newBadge = milestones[streak];
    }

    await user.save();
    return { newBadge };
  }

  private getOverpassTags(theme: string): string {
    const tagMap: Record<string, string> = {
      pirate: 'waterway~"river|stream"|historic',
      spy: 'building~"yes"|tourism~"attraction"',
      fairy: 'leisure~"garden"|natural~"wood|tree"',
      explorer: 'tourism~"viewpoint"|natural~"peak"',
    };
    return tagMap[theme] || 'leisure~"playground|park|garden"';
  }

  private generateClue(theme: string, name: string, index: number): string {
    const clues: Record<string, string[]> = {
      pirate: [
        `Arrr! The treasure map points to ${name}!`,
        `Captain Bumbee heard gold coins jingling near ${name}!`,
        `X marks the spot near ${name}, matey!`,
        `The parrot says: "Squawk! Head to ${name}!"`,
      ],
      spy: [
        `Agent Bumbee, your mission is at ${name}`,
        `Intelligence reports activity near ${name}`,
        `Decode this: the drop point is ${name}`,
        `HQ says: proceed to ${name} immediately`,
      ],
      fairy: [
        `The fairy queen's wand glows near ${name}`,
        `Magic sparkles spotted at ${name}!`,
        `A friendly gnome whispered about ${name}`,
        `Follow the rainbow to ${name}!`,
      ],
      explorer: [
        `Your compass points to ${name}!`,
        `New territory discovered: ${name}`,
        `The expedition leads to ${name}`,
        `Chart your course to ${name}, explorer!`,
      ],
    };
    const list = clues[theme] || clues.explorer;
    return list[index % list.length];
  }

  private generateChallenge(theme: string, index: number): string {
    const challenges = [
      'Take a silly family photo here!',
      'Find something that starts with the letter B!',
      'Do 5 jumping jacks together!',
      'Spot 3 different colours around you!',
    ];
    return challenges[index % challenges.length];
  }
}
