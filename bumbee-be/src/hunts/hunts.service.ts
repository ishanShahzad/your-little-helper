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
      pirate: [`Arrr! Captain Goldbeard buried treasure near ${stopName}!`, `X marks the spot at ${stopName}, matey!`, `The treasure map points to ${stopName}!`],
      spy: [`Agent B's intel says the drop is at ${stopName}.`, `Your mission: infiltrate ${stopName}.`, `Top secret rendezvous at ${stopName}.`],
      fairy: [`Sparkle left fairy dust at ${stopName}!`, `The enchanted ${stopName} awaits!`, `Fairy magic is strongest near ${stopName}!`],
      unicorn: [`Stardust galloped through ${stopName}!`, `A rainbow trail leads to ${stopName}!`, `Unicorn hoofprints spotted near ${stopName}!`],
      explorer: [`Scout spotted something at ${stopName}!`, `Your compass points to ${stopName}!`, `An undiscovered trail leads to ${stopName}!`],
    };
    const t = templates[theme] || [`Head to ${stopName}!`];
    return t[Math.floor(Math.random() * t.length)];
  }

  private generateChallenge(theme: string, stopIndex: number): string {
    const challenges: Record<string, string[]> = {
      pirate: ['Draw an X on the ground with a stick!', 'Do your best pirate "Arrr!" pose for the camera!', 'Find something that looks like buried treasure!', 'Walk the plank (find a log or bench)!'],
      spy: ['Take a sneaky photo without being seen!', 'Find 3 things that could be spy gadgets!', 'Walk past without making a sound!', 'Find a secret hiding spot nearby!'],
      fairy: ['Sprinkle imaginary fairy dust everywhere!', 'Find the prettiest flower or leaf!', 'Do a fairy dance and spin 3 times!', 'Make a wish and throw a pebble!'],
      unicorn: ['Do a magical unicorn gallop!', 'Find something rainbow-coloured!', 'Strike a majestic unicorn pose!', 'Find the sparkliest thing nearby!'],
      explorer: ['Take a photo of something you\'ve never seen before!', 'Identify 3 different types of trees!', 'Find animal tracks or signs of wildlife!', 'Draw a mini map of this area!'],
    };
    const c = challenges[theme] || ['Take a photo with the character here!'];
    return c[stopIndex % c.length];
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

    // Build stops with richer challenges
    const stops = pois.map((poi: any, idx: number) => ({
      name: poi.tags?.name || `Stop ${poi.id}`,
      lat: poi.lat,
      lng: poi.lon,
      type: poi.tags?.leisure || 'point',
      clue: this.generateClue(dto.theme, poi.tags?.name || 'this location'),
      challenge: this.generateChallenge(dto.theme, idx),
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
        challenge: this.generateChallenge(dto.theme, stops.length),
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

  async saveTrack(huntId: string, walkedPath: { lat: number; lng: number }[]) {
    return this.huntModel.findByIdAndUpdate(
      huntId,
      { $set: { walkedPath } },
      { new: true },
    ).lean();
  }

  async completeStop(huntId: string, stopIndex: number) {
    const update: any = {};
    update[`stops.${stopIndex}.completed`] = true;
    update[`stops.${stopIndex}.completedAt`] = new Date();
    return this.huntModel.findByIdAndUpdate(huntId, { $set: update }, { new: true }).lean();
  }

  async uploadStopPhoto(huntId: string, stopIndex: number, file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No file provided');

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'bumbee-photos', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(file.buffer);
      });

      const update: any = {};
      update[`stops.${stopIndex}.photoUrl`] = result.secure_url;
      return this.huntModel.findByIdAndUpdate(huntId, { $set: update }, { new: true }).lean();
    } catch {
      // If Cloudinary fails, still mark the stop but without photo URL
      return this.huntModel.findById(huntId).lean();
    }
  }

  async completeHunt(userId: string, huntId: string) {
    const hunt = await this.huntModel.findByIdAndUpdate(
      huntId,
      { $set: { status: 'completed' } },
      { new: true },
    ).lean();

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

  async saveThemeToFavorites(userId: string, huntId: string) {
    const hunt = await this.huntModel.findById(huntId).lean();
    if (!hunt) return;
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { 'familyProfile.favorites': hunt.theme },
    });
  }

  async generateRecap(huntId: string) {
    const hunt = await this.huntModel.findById(huntId).lean();
    if (!hunt) throw new NotFoundException('Hunt not found');

    const themeEmojis: Record<string, string> = {
      pirate: '🏴‍☠️', spy: '🕵️', fairy: '🧚', unicorn: '🦄', explorer: '🧭',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body { margin:0; padding:0; }
          .card { width:600px; background:#FFFBF0; border:3px solid #F5A623; border-radius:16px; padding:24px; font-family:'Nunito',sans-serif; box-sizing:border-box; }
          h1 { color:#2C2200; font-family:'Fredoka',sans-serif; text-align:center; margin:0 0 8px; }
          .theme { text-align:center; font-size:48px; margin-bottom:8px; }
          .stats { text-align:center; color:#8A7A66; margin:4px 0; }
          .giggles { text-align:center; color:#F5A623; font-size:18px; font-weight:600; margin:12px 0; }
          .photos { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:16px 0; }
          .photos img { width:100%; border-radius:8px; aspect-ratio:1; object-fit:cover; }
          .footer { display:flex; justify-content:space-between; align-items:center; margin-top:16px; }
          .logo { color:#F5A623; font-family:'Fredoka',sans-serif; font-size:14px; }
          .copyright { color:#8A7A66; font-size:10px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="theme">${themeEmojis[hunt.theme] || '🐝'}</div>
          <h1>Bumbee Adventure Recap</h1>
          <p class="stats">Theme: ${hunt.theme} | Stops: ${hunt.stops?.length || 0}</p>
          <p class="stats">Distance: ${((hunt.route?.distance || 0) / 1000).toFixed(1)} km</p>
          <p class="giggles">${Math.floor(Math.random() * 15) + 10} giggles estimated 😄</p>
          <div class="photos">
            ${(hunt.stops || []).map((s: any) => s.photoUrl ? `<img src="${s.photoUrl}" />` : '').join('')}
          </div>
          <div class="footer">
            <span class="copyright">© 2025 Bumbee Ltd</span>
            <span class="logo">🐝 Bumbee</span>
          </div>
        </div>
      </body>
      </html>`;

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
