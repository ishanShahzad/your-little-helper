import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { Hunt, HuntDocument, TaskType } from '../schemas/hunt.schema';
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

  // ── Character & Story ──────────────────────────────────────

  private readonly characters: Record<string, { name: string; emoji: string }> = {
    pirate: { name: 'Captain Goldbeard', emoji: '🏴‍☠️' },
    spy: { name: 'Agent B', emoji: '🕵️' },
    fairy: { name: 'Sparkle', emoji: '🧚' },
    unicorn: { name: 'Stardust', emoji: '🦄' },
    explorer: { name: 'Scout', emoji: '🧭' },
  };

  private generateStoryIntro(theme: string, character: string): string {
    const stories: Record<string, string> = {
      pirate: `${character} lost his treasure across the city! Four secret locations hold clues. Solve them all and the treasure will be yours!`,
      spy: `${character} has intercepted a coded message. Secret drops have been placed across the city. Your mission: decode them all before time runs out!`,
      fairy: `${character}'s magical wand has scattered fairy dust across the neighbourhood! Follow the sparkle trail to collect them all and restore the magic!`,
      unicorn: `${character} galloped through a rainbow portal and left magical hoofprints everywhere! Follow the rainbow trail to find them all!`,
      explorer: `${character} discovered an ancient map with mysterious markings! Each location holds a piece of the puzzle. Can your family solve it?`,
    };
    return stories[theme] || `${character} needs your help on an incredible adventure! Explore the city and complete challenges to save the day!`;
  }

  // ── Theme → POI Tags ──────────────────────────────────────

  private getThemeTags(theme: string): string {
    const map: Record<string, string> = {
      pirate: 'playground|fountain|monument|artwork',
      spy: 'bench|telephone|post_box|clock',
      fairy: 'garden|nature_reserve|flower_bed|tree',
      unicorn: 'park|meadow|playground|pitch',
      explorer: 'viewpoint|peak|memorial|ruins',
    };
    return map[theme] || 'playground|park|garden|bench';
  }

  // ── Age-Adaptive Content ──────────────────────────────────

  private getAgeGroup(ages: number[]): 'toddler' | 'kid' | 'tween' {
    const avg = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 7;
    if (avg <= 4) return 'toddler';
    if (avg <= 9) return 'kid';
    return 'tween';
  }

  // ── Task Type Assignment ──────────────────────────────────

  private readonly taskPool: Record<string, { taskType: TaskType; missionTitle: string; taskPrompt: string; taskAnswer?: string }[]> = {
    pirate: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find the hidden treasure', taskPrompt: 'Look for something that looks like buried treasure nearby!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Strike a pirate pose', taskPrompt: 'Do your best pirate "Arrr!" pose and take a selfie!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Count the cannons', taskPrompt: 'How many benches can you see from this spot?', taskAnswer: '' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Snap the X mark', taskPrompt: 'Take a photo of something that looks like an X!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Solve the riddle', taskPrompt: 'I have 4 legs but cannot walk. What am I? Find it nearby!', taskAnswer: 'bench' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Walk the plank', taskPrompt: 'Find a log or narrow path and walk across it like a plank!' },
    ],
    spy: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Sneaky surveillance', taskPrompt: 'Take a sneaky photo of something interesting without being noticed!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find spy gadgets', taskPrompt: 'Find 3 things that could be disguised spy gadgets!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Count the suspects', taskPrompt: 'How many people are wearing hats nearby?', taskAnswer: '' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Undercover selfie', taskPrompt: 'Take a selfie while trying to look as mysterious as possible!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Crack the code', taskPrompt: 'What has hands but can\'t clap? Find it nearby!', taskAnswer: 'clock' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Silent approach', taskPrompt: 'Walk past this spot without making a sound — stealth mode!' },
    ],
    fairy: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find fairy dust', taskPrompt: 'Find the prettiest flower or sparkliest thing nearby!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Fairy dance', taskPrompt: 'Do a fairy dance, spin 3 times, and take a selfie!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Capture the magic', taskPrompt: 'Take a photo of something that looks magical or enchanted!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Count the petals', taskPrompt: 'How many different coloured flowers can you spot?', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Fairy riddle', taskPrompt: 'I change colour in autumn and fall to the ground. What am I?', taskAnswer: 'leaf' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Make a wish', taskPrompt: 'Find a special spot, close your eyes, and make a magical wish!' },
    ],
    unicorn: [
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Find the rainbow', taskPrompt: 'Find something rainbow-coloured or with at least 3 different colours!' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Majestic pose', taskPrompt: 'Strike a majestic unicorn pose with one arm as your horn!' },
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Sparkle search', taskPrompt: 'Take a photo of the sparkliest or most colourful thing you can find!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Rainbow count', taskPrompt: 'How many different colours can you see without moving your feet?', taskAnswer: '' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Unicorn riddle', taskPrompt: 'I have a mane but I\'m not a lion. I have a horn but I\'m not a rhino. What am I?', taskAnswer: 'unicorn' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Magical gallop', taskPrompt: 'Gallop like a unicorn in a circle around this spot!' },
    ],
    explorer: [
      { taskType: TaskType.PHOTO_TASK, missionTitle: 'Document discovery', taskPrompt: 'Take a photo of something you\'ve never noticed before!' },
      { taskType: TaskType.FIND_OBJECT, missionTitle: 'Nature detective', taskPrompt: 'Find animal tracks, a feather, or signs of wildlife!' },
      { taskType: TaskType.COUNT_TASK, missionTitle: 'Tree survey', taskPrompt: 'How many different types of trees can you identify?', taskAnswer: '' },
      { taskType: TaskType.SELFIE_TASK, missionTitle: 'Explorer selfie', taskPrompt: 'Take a selfie with the most interesting landmark you can find!' },
      { taskType: TaskType.ANSWER_RIDDLE, missionTitle: 'Map riddle', taskPrompt: 'I point north but I\'m not a finger. What am I? Find one nearby!', taskAnswer: 'compass' },
      { taskType: TaskType.CHECKIN_TASK, missionTitle: 'Draw the map', taskPrompt: 'Draw a mini map of this area in the dirt or on paper!' },
    ],
  };

  private assignTask(theme: string, stopIndex: number, ageGroup: string): { taskType: TaskType; missionTitle: string; taskPrompt: string; taskAnswer?: string } {
    const pool = this.taskPool[theme] || this.taskPool['explorer'];
    // Shuffle based on index to ensure variety
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const task = shuffled[stopIndex % shuffled.length];

    // For last stop, always use CHECKIN_TASK (finale spot)
    // Adapt language for toddlers
    if (ageGroup === 'toddler') {
      return { ...task, taskPrompt: task.taskPrompt.replace(/Find|Identify|Count/g, (m) => m === 'Find' ? 'Can you find' : m === 'Identify' ? 'Can you spot' : 'How many') + ' 🎉' };
    }
    return task;
  }

  // ── Clue Generation ───────────────────────────────────────

  private generateClue(theme: string, stopName: string, ageGroup: string): string {
    const templates: Record<string, Record<string, string[]>> = {
      pirate: {
        toddler: [`Look! ${stopName} has a treasure! Can you find it?`, `Captain says go to ${stopName}! 🏴‍☠️`],
        kid: [`Arrr! Captain Goldbeard buried treasure near ${stopName}!`, `X marks the spot at ${stopName}, matey!`, `The treasure map points to ${stopName}!`],
        tween: [`Intelligence reports treasure coordinates at ${stopName}. Intercept and retrieve.`, `${stopName} — the last known location of the Golden Doubloon.`],
      },
      spy: {
        toddler: [`Shhh! Go quietly to ${stopName}! 🤫`, `The secret is at ${stopName}!`],
        kid: [`Agent B's intel says the drop is at ${stopName}.`, `Your mission: infiltrate ${stopName}.`],
        tween: [`Classified intel points to ${stopName}. Approach with caution.`, `Priority Alpha — rendezvous at ${stopName}. Sweep for surveillance.`],
      },
      fairy: {
        toddler: [`Look for sparkles at ${stopName}! ✨`, `Sparkle flew to ${stopName}!`],
        kid: [`Sparkle left fairy dust at ${stopName}!`, `The enchanted ${stopName} awaits!`],
        tween: [`Ancient fairy runes glow brightest near ${stopName}.`, `The fairy council has hidden a charm at ${stopName}.`],
      },
      unicorn: {
        toddler: [`Rainbow at ${stopName}! Let's go! 🌈`, `Stardust is at ${stopName}!`],
        kid: [`Stardust galloped through ${stopName}!`, `A rainbow trail leads to ${stopName}!`],
        tween: [`Chromatic energy readings spike near ${stopName}.`, `${stopName} — portal nexus detected.`],
      },
      explorer: {
        toddler: [`Let's explore ${stopName}! 🧭`, `Something cool is at ${stopName}!`],
        kid: [`Scout spotted something at ${stopName}!`, `Your compass points to ${stopName}!`],
        tween: [`Uncharted territory detected at ${stopName}.`, `${stopName} — marked on the ancient expedition map.`],
      },
    };
    const themeClues = templates[theme]?.[ageGroup] || templates[theme]?.kid || [`Head to ${stopName}!`];
    return themeClues[Math.floor(Math.random() * themeClues.length)];
  }

  // ── Stop Count by Duration ────────────────────────────────

  private getStopCount(durationMinutes: number): number {
    if (durationMinutes <= 30) return 3;
    if (durationMinutes <= 60) return 4;
    if (durationMinutes <= 90) return 5;
    return 6;
  }

  // ── Main Generate ─────────────────────────────────────────

  async generate(userId: string, dto: GenerateHuntDto) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const completedHunts = (user.history || []).length;
    if (completedHunts >= 1 && user.subscription?.plan === 'free') {
      throw new ForbiddenException({ message: 'subscription_required', statusCode: 402 });
    }

    const durationMinutes = dto.durationMinutes || 60;
    const stopCount = this.getStopCount(durationMinutes);
    const ageGroup = this.getAgeGroup(dto.ages);
    const character = this.characters[dto.theme] || { name: 'Bumbee', emoji: '🐝' };

    // Fetch POIs from Overpass with randomization
    const tags = this.getThemeTags(dto.theme);
    const radius = durationMinutes <= 30 ? 1000 : durationMinutes <= 60 ? 2000 : 3000;
    const overpassQuery = `[out:json][timeout:25];(node(around:${radius},${dto.lat},${dto.lng})[leisure~"${tags}"];node(around:${radius},${dto.lat},${dto.lng})[amenity~"playground|fountain|bench|cafe|ice_cream"];);out body 30;`;
    const overpassUrl = this.configService.get('OVERPASS_API_URL');
    let pois: any[] = [];
    try {
      const { data } = await axios.post(overpassUrl, `data=${encodeURIComponent(overpassQuery)}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      // Randomize POI selection to ensure different hunts at same location
      const allPois = (data.elements || []).sort(() => Math.random() - 0.5);

      // Filter out previously visited POIs
      const previousHuntIds = (user.history || []).map((h: any) => h.huntId?.toString());
      let previousStopNames = new Set<string>();
      if (previousHuntIds.length > 0) {
        const recentHunts = await this.huntModel
          .find({ _id: { $in: previousHuntIds.slice(-5) } })
          .select('stops.name')
          .lean();
        recentHunts.forEach((h: any) => {
          (h.stops || []).forEach((s: any) => previousStopNames.add(s.name));
        });
      }

      pois = allPois
        .filter((p: any) => !previousStopNames.has(p.tags?.name))
        .slice(0, stopCount);
    } catch { /* fallback */ }

    // Build stops with task types
    const stops = pois.map((poi: any, idx: number) => {
      const stopName = poi.tags?.name || `Mystery Spot ${idx + 1}`;
      const task = this.assignTask(dto.theme, idx, ageGroup);
      const isFinale = idx === Math.min(pois.length, stopCount) - 1;

      return {
        name: stopName,
        lat: poi.lat,
        lng: poi.lon,
        type: poi.tags?.leisure || poi.tags?.amenity || 'point',
        clue: this.generateClue(dto.theme, stopName, ageGroup),
        challenge: isFinale ? `🎉 Final challenge! ${task.taskPrompt}` : task.taskPrompt,
        taskType: isFinale ? TaskType.CHECKIN_TASK : task.taskType,
        taskPrompt: task.taskPrompt,
        taskAnswer: task.taskAnswer || '',
        missionTitle: isFinale ? '🏆 Claim Your Treasure!' : task.missionTitle,
        completed: false,
        unlocked: idx === 0, // Only first stop is unlocked
      };
    });

    // Fallback if not enough POIs
    while (stops.length < stopCount) {
      const offset = stops.length * 0.002 * (Math.random() > 0.5 ? 1 : -1);
      const idx = stops.length;
      const task = this.assignTask(dto.theme, idx, ageGroup);
      const isFinale = idx === stopCount - 1;

      stops.push({
        name: `Mystery Spot ${idx + 1}`,
        lat: dto.lat + offset + (Math.random() * 0.001),
        lng: dto.lng + offset + (Math.random() * 0.001),
        type: 'mystery',
        clue: this.generateClue(dto.theme, 'this mystery spot', ageGroup),
        challenge: isFinale ? `🎉 Final challenge! ${task.taskPrompt}` : task.taskPrompt,
        taskType: isFinale ? TaskType.CHECKIN_TASK : task.taskType,
        taskPrompt: task.taskPrompt,
        taskAnswer: task.taskAnswer || '',
        missionTitle: isFinale ? '🏆 Claim Your Treasure!' : task.missionTitle,
        completed: false,
        unlocked: idx === 0,
      });
    }

    // Get walking route
    let route = { distance: 0, duration: 0, polyline: '' };
    try {
      const coords = stops.map((s: any) => [s.lng, s.lat]);
      const { data: routeData } = await axios.post(
        `${this.configService.get('OPENROUTE_API_URL')}/directions/foot-walking`,
        { coordinates: coords },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('OPENROUTE_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const routeObj = routeData.routes?.[0];
      if (routeObj) {
        route = {
          distance: routeObj.summary?.distance || 0,
          duration: routeObj.summary?.duration || 0,
          polyline: routeObj.geometry || '',
        };
      }
    } catch (err) {
      console.log('OpenRouteService error:', err?.message);
    }

    // Get weather
    let weather = { temp: 0, condition: 'unknown', icon: '' };
    try {
      const { data: meteo } = await axios.get(
        `${this.configService.get('OPEN_METEO_URL')}?latitude=${dto.lat}&longitude=${dto.lng}&current_weather=true`,
      );
      const cw = meteo.current_weather;
      weather = { temp: cw?.temperature || 0, condition: cw?.weathercode?.toString() || '', icon: '' };
    } catch { /* fallback */ }

    const storyIntro = this.generateStoryIntro(dto.theme, character.name);

    const hunt = await this.huntModel.create({
      userId,
      theme: dto.theme,
      mood: dto.mood,
      ages: dto.ages,
      durationMinutes,
      storyIntro,
      storyCharacter: character.name,
      storyCharacterEmoji: character.emoji,
      stops,
      route,
      weather,
      preferences: dto.preferences || {},
    });

    return hunt.toObject();
  }

  // ── Existing methods ──────────────────────────────────────

  async getHunt(id: string) {
    return this.huntModel.findById(id).lean();
  }

  async saveTrack(huntId: string, walkedPath: { lat: number; lng: number }[]) {
    return this.huntModel.findByIdAndUpdate(huntId, { $set: { walkedPath } }, { new: true }).lean();
  }

  async completeStop(huntId: string, stopIndex: number) {
    const update: any = {};
    update[`stops.${stopIndex}.completed`] = true;
    update[`stops.${stopIndex}.completedAt`] = new Date();
    // Unlock next stop
    update[`stops.${stopIndex + 1}.unlocked`] = true;
    return this.huntModel.findByIdAndUpdate(huntId, { $set: update }, { new: true }).lean();
  }

  async uploadStopPhoto(huntId: string, stopIndex: number, file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No file provided');
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'bumbee-photos', resource_type: 'image' },
          (error, result) => { if (error) reject(error); else resolve(result); },
        );
        stream.end(file.buffer);
      });
      const update: any = {};
      update[`stops.${stopIndex}.photoUrl`] = result.secure_url;
      return this.huntModel.findByIdAndUpdate(huntId, { $set: update }, { new: true }).lean();
    } catch {
      return this.huntModel.findById(huntId).lean();
    }
  }

  async completeHunt(userId: string, huntId: string) {
    const hunt = await this.huntModel.findByIdAndUpdate(huntId, { $set: { status: 'completed' } }, { new: true }).lean();
    await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        history: { huntId, theme: hunt?.theme, mood: hunt?.mood, completedAt: new Date(), rating: hunt?.rating },
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
      if (diffDays <= 2) return { newBadge: null };
      streak = diffDays <= 9 ? streak + 1 : 1;
    } else {
      streak = 1;
    }

    const weekendsPlanned = (user.streaks?.weekendsPlanned || 0) + 1;
    const badges = [...(user.streaks?.badges || [])];
    let newBadge: string | null = null;
    const milestones: Record<number, string> = { 3: '🌟 Getting Started', 7: '🔥 On Fire Family', 15: '🏆 Adventure Pro', 30: '👑 Bumbee Legends' };
    if (milestones[weekendsPlanned] && !badges.includes(milestones[weekendsPlanned])) {
      newBadge = milestones[weekendsPlanned];
      badges.push(newBadge);
    }

    await this.userModel.findByIdAndUpdate(userId, {
      $set: { 'streaks.currentStreak': streak, 'streaks.weekendsPlanned': weekendsPlanned, 'streaks.lastWeekendDate': now, 'streaks.badges': badges },
    });
    return { newBadge };
  }

  async rateHunt(huntId: string, body: { rating: number; feedbackText?: string; wouldRecommend?: boolean }) {
    return this.huntModel.findByIdAndUpdate(huntId, { $set: body }, { new: true }).lean();
  }

  async saveThemeToFavorites(userId: string, huntId: string) {
    const hunt = await this.huntModel.findById(huntId).lean();
    if (!hunt) return;
    await this.userModel.findByIdAndUpdate(userId, { $addToSet: { 'familyProfile.favorites': hunt.theme } });
  }

  async generateRecap(huntId: string) {
    const hunt = await this.huntModel.findById(huntId).lean();
    if (!hunt) throw new NotFoundException('Hunt not found');

    const photos = (hunt.stops || [])
      .filter((s: any) => s.photoUrl)
      .slice(0, 4)
      .map((s: any) => `<img src="${s.photoUrl}" />`)
      .join('');

    const html = `<!DOCTYPE html><html><head>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body{margin:0;padding:0}
        .card{width:600px;background:#E8F4FD;border:3px solid #1A8FE3;border-radius:16px;padding:24px;font-family:'Nunito',sans-serif;box-sizing:border-box}
        h1{color:#1A2332;font-family:'Fredoka',sans-serif;text-align:center;margin:0 0 8px}
        .theme{text-align:center;font-size:48px;margin-bottom:8px}
        .story{text-align:center;font-style:italic;color:#6B7A8D;font-size:14px;margin:8px 24px}
        .stats{text-align:center;color:#6B7A8D;margin:4px 0}
        .giggles{text-align:center;color:#F5C518;font-size:18px;font-weight:600;margin:12px 0}
        .photos{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}
        .photos img{width:100%;border-radius:8px;aspect-ratio:1;object-fit:cover}
        .footer{display:flex;justify-content:space-between;align-items:center;margin-top:16px}
        .logo{color:#1A8FE3;font-family:'Fredoka',sans-serif;font-size:14px}
        .copyright{color:#6B7A8D;font-size:10px}
      </style></head><body><div class="card">
        <div class="theme">${hunt.storyCharacterEmoji || '🐝'}</div>
        <h1>${hunt.storyCharacter || 'Bumbee'} Adventure Recap</h1>
        <p class="story">"${hunt.storyIntro || ''}"</p>
        <p class="stats">Theme: ${hunt.theme} | Stops: ${hunt.stops?.length || 0}</p>
        <p class="stats">Distance: ${((hunt.route?.distance || 0) / 1000).toFixed(1)} km</p>
        <p class="giggles">${Math.floor(Math.random() * 15) + 10} giggles estimated 😄</p>
        <div class="photos">${photos}</div>
        <div class="footer"><span class="copyright">© 2025 Bumbee Ltd</span><span class="logo">🐝 Bumbee</span></div>
      </div></body></html>`;

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
