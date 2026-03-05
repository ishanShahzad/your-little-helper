import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { Hunt, HuntDocument } from '../schemas/hunt.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { GenerateHuntDto } from './dto/generate-hunt.dto';

@Injectable()
export class HuntsService {
  constructor(
    @InjectModel(Hunt.name) private huntModel: Model<HuntDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  private getThemeTags(theme: string): string {
    const map: Record<string, string> = {
      pirate: 'waterway|historic',
      spy: 'building|landmark',
      fairy: 'garden|nature_reserve',
      unicorn: 'park|meadow',
      explorer: 'viewpoint|peak',
    };
    return map[theme] || 'playground|park|garden';
  }

  private generateClue(theme: string, stopName: string): string {
    const templates: Record<string, string[]> = {
      pirate: [`Arrr! Captain Goldbeard buried treasure near ${stopName}!`, `X marks the spot at ${stopName}, matey!`],
      spy: [`Agent B's intel says the drop is at ${stopName}.`, `Your mission: infiltrate ${stopName}.`],
      fairy: [`Sparkle left fairy dust at ${stopName}!`, `The enchanted ${stopName} awaits!`],
      unicorn: [`Stardust galloped through ${stopName}!`, `A rainbow trail leads to ${stopName}!`],
      explorer: [`Scout spotted something at ${stopName}!`, `Your compass points to ${stopName}!`],
    };
    const t = templates[theme] || [`Head to ${stopName}!`];
    return t[Math.floor(Math.random() * t.length)];
  }

  async generate(userId: string, dto: GenerateHuntDto) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const completedHunts = (user.history || []).length;
    if (completedHunts >= 1 && user.subscription?.plan === 'free') {
      throw new ForbiddenException({ message: 'subscription_required', statusCode: 402 });
    }

    // Fetch POIs from Overpass
    const tags = this.getThemeTags(dto.theme);
    const overpassQuery = `[out:json][timeout:25];node(around:2000,${dto.lat},${dto.lng})[leisure~"${tags}"];out body 10;`;
    const overpassUrl = this.configService.get('OVERPASS_API_URL');
    let pois: any[] = [];
    try {
      const { data } = await axios.post(overpassUrl, `data=${encodeURIComponent(overpassQuery)}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      pois = (data.elements || []).slice(0, 4);
    } catch { /* fallback to empty */ }

    // Build stops
    const stops = pois.map((poi: any) => ({
      name: poi.tags?.name || `Stop ${poi.id}`,
      lat: poi.lat,
      lng: poi.lon,
      type: poi.tags?.leisure || 'point',
      clue: this.generateClue(dto.theme, poi.tags?.name || 'this location'),
      challenge: `Take a photo with the ${dto.theme} character here!`,
      completed: false,
    }));

    // Fallback if not enough POIs
    while (stops.length < 4) {
      const offset = stops.length * 0.002;
      stops.push({
        name: `Mystery Spot ${stops.length + 1}`,
        lat: dto.lat + offset,
        lng: dto.lng + offset,
        type: 'mystery',
        clue: this.generateClue(dto.theme, 'this mystery spot'),
        challenge: 'Explore and find something interesting!',
        completed: false,
      });
    }

    // Get route from OpenRouteService
    let route = { distance: 0, duration: 0, polyline: '' };
    try {
      const coords = stops.map((s: any) => [s.lng, s.lat]);
      const { data: routeData } = await axios.post(
        `${this.configService.get('OPENROUTE_API_URL')}/directions/foot-walking`,
        { coordinates: coords },
        { headers: { Authorization: `Bearer ${this.configService.get('OPENROUTE_API_KEY')}` } },
      );
      const seg = routeData.routes?.[0]?.summary;
      route = { distance: seg?.distance || 0, duration: seg?.duration || 0, polyline: '' };
    } catch { /* fallback */ }

    // Get weather from Open-Meteo
    let weather = { temp: 0, condition: 'unknown', icon: '' };
    try {
      const { data: meteo } = await axios.get(
        `${this.configService.get('OPEN_METEO_URL')}?latitude=${dto.lat}&longitude=${dto.lng}&current_weather=true`,
      );
      const cw = meteo.current_weather;
      weather = { temp: cw?.temperature || 0, condition: cw?.weathercode?.toString() || '', icon: '' };
    } catch { /* fallback */ }

    const hunt = await this.huntModel.create({
      userId,
      theme: dto.theme,
      mood: dto.mood,
      ages: dto.ages,
      stops,
      route,
      weather,
    });

    return hunt.toObject();
  }

  async getHunt(id: string) {
    return this.huntModel.findById(id).lean();
  }

  async completeStop(huntId: string, stopIndex: number) {
    const update: any = {};
    update[`stops.${stopIndex}.completed`] = true;
    update[`stops.${stopIndex}.completedAt`] = new Date();
    return this.huntModel.findByIdAndUpdate(huntId, { $set: update }, { new: true }).lean();
  }

  async completeHunt(userId: string, huntId: string) {
    const hunt = await this.huntModel.findByIdAndUpdate(
      huntId,
      { $set: { status: 'completed' } },
      { new: true },
    ).lean();

    // Update user history
    await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        history: {
          huntId,
          theme: hunt?.theme,
          mood: hunt?.mood,
          completedAt: new Date(),
          rating: hunt?.rating,
        },
      },
    });

    const streakResult = await this.updateStreak(userId);
    return { hunt, ...streakResult };
  }

  async updateStreak(userId: string): Promise<{ newBadge: string | null }> {
    const user = await this.userModel.findById(userId);
    if (!user) return { newBadge: null };

    const now = new Date();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;

    if (!isWeekend) return { newBadge: null };

    const lastDate = user.streaks?.lastWeekendDate;
    let streak = user.streaks?.currentStreak || 0;

    if (lastDate) {
      const diffDays = Math.floor((now.getTime() - new Date(lastDate).getTime()) / 86400000);
      if (diffDays <= 2) return { newBadge: null }; // same weekend
      streak = diffDays <= 9 ? streak + 1 : 1; // consecutive vs reset
    } else {
      streak = 1;
    }

    const weekendsPlanned = (user.streaks?.weekendsPlanned || 0) + 1;
    const badges = [...(user.streaks?.badges || [])];
    let newBadge: string | null = null;

    const milestones: Record<number, string> = {
      3: '🌟 Getting Started',
      7: '🔥 On Fire Family',
      15: '🏆 Adventure Pro',
      30: '👑 Bumbee Legends',
    };

    if (milestones[weekendsPlanned] && !badges.includes(milestones[weekendsPlanned])) {
      newBadge = milestones[weekendsPlanned];
      badges.push(newBadge);
    }

    await this.userModel.findByIdAndUpdate(userId, {
      $set: {
        'streaks.currentStreak': streak,
        'streaks.weekendsPlanned': weekendsPlanned,
        'streaks.lastWeekendDate': now,
        'streaks.badges': badges,
      },
    });

    return { newBadge };
  }

  async rateHunt(huntId: string, body: { rating: number; feedbackText?: string; wouldRecommend?: boolean }) {
    return this.huntModel.findByIdAndUpdate(huntId, { $set: body }, { new: true }).lean();
  }

  async generateRecap(huntId: string) {
    const hunt = await this.huntModel.findById(huntId).lean();
    if (!hunt) throw new NotFoundException('Hunt not found');

    const html = `
      <div style="width:600px;background:#FFFBF0;border:3px solid #F5A623;border-radius:16px;padding:24px;font-family:'Nunito',sans-serif;">
        <h1 style="color:#2C2200;font-family:'Fredoka',sans-serif;text-align:center;">🐝 Bumbee Adventure Recap</h1>
        <p style="text-align:center;color:#8A7A66;">Theme: ${hunt.theme} | Stops: ${hunt.stops?.length || 0}</p>
        <p style="text-align:center;color:#8A7A66;">Distance: ${((hunt.route?.distance || 0) / 1000).toFixed(1)} km</p>
        <p style="text-align:center;color:#F5A623;font-size:18px;">${Math.floor(Math.random() * 15) + 10} giggles estimated 😄</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0;">
          ${(hunt.stops || []).map((s: any) => s.photoUrl ? `<img src="${s.photoUrl}" style="width:100%;border-radius:8px;" />` : '').join('')}
        </div>
        <p style="text-align:right;color:#F5A623;font-size:12px;">🐝 Bumbee</p>
        <p style="text-align:left;color:#8A7A66;font-size:10px;">© 2025 Bumbee Ltd</p>
      </div>`;

    try {
      const result = await cloudinary.uploader.upload(
        `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
        { folder: 'bumbee-recaps', resource_type: 'raw' },
      );
      await this.huntModel.findByIdAndUpdate(huntId, { recapCardUrl: result.secure_url });
      return { recapCardUrl: result.secure_url, html };
    } catch {
      return { recapCardUrl: null, html };
    }
  }
}
