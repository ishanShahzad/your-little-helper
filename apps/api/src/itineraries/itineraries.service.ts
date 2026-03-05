import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import axios from 'axios';
import { Itinerary, ItineraryDocument } from '../schemas/itinerary.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ItinerariesService {
  constructor(
    @InjectModel(Itinerary.name) private itineraryModel: Model<ItineraryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private config: ConfigService,
  ) {}

  async generate(userId: string, body: any) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    if (user.history.length >= 1 && user.subscription.plan === 'free') {
      throw new HttpException({ success: false, message: 'subscription_required', statusCode: 402 }, 402);
    }

    const { lat, lng, mood, ages } = body;
    let activities: any[] = [];

    if (mood === 'rainy' || mood === 'sick') {
      activities = [
        { time: '09:00', title: 'Blanket Fort Building', description: 'Build the ultimate family fort!', duration: 60, type: 'indoor', isHome: true },
        { time: '10:00', title: 'Baking Challenge', description: 'Make cookies or cupcakes together', duration: 90, type: 'indoor', isHome: true },
        { time: '12:00', title: 'Lunch & Movie', description: 'Cozy lunch with a family movie', duration: 120, type: 'indoor', isHome: true },
        { time: '14:00', title: 'Arts & Crafts', description: 'Draw, paint, or make something creative', duration: 60, type: 'indoor', isHome: true },
        { time: '15:00', title: 'Board Game Tournament', description: 'Family game time!', duration: 90, type: 'indoor', isHome: true },
      ];
    } else {
      // Outdoor: fetch nearby places
      try {
        const overpassQuery = `[out:json][timeout:25];(node(around:3000,${lat},${lng})[amenity~"cafe|restaurant"];node(around:3000,${lat},${lng})[leisure~"park|playground"];node(around:3000,${lat},${lng})[tourism~"museum|zoo"];);out body 8;`;
        const res = await axios.post(
          this.config.get('OVERPASS_API_URL'),
          `data=${encodeURIComponent(overpassQuery)}`,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        );

        const places = res.data.elements.slice(0, 4);
        const times = ['09:30', '11:00', '12:30', '14:30'];
        activities = places.map((p: any, i: number) => ({
          time: times[i],
          title: p.tags?.name || 'Local Spot',
          description: `Visit ${p.tags?.name || 'this place'} nearby`,
          duration: 60 + (i === 2 ? 30 : 0),
          type: p.tags?.amenity || p.tags?.leisure || p.tags?.tourism || 'outdoor',
          address: p.tags?.['addr:street'] || '',
          isHome: false,
        }));
      } catch (e) {
        activities = [
          { time: '09:30', title: 'Morning Walk', description: 'Explore your neighbourhood', duration: 60, type: 'outdoor', isHome: false },
          { time: '11:00', title: 'Playground Time', description: 'Find a nearby playground', duration: 90, type: 'outdoor', isHome: false },
          { time: '12:30', title: 'Picnic Lunch', description: 'Pack lunch and eat outside', duration: 60, type: 'outdoor', isHome: false },
          { time: '14:30', title: 'Nature Hunt', description: 'Collect leaves, stones, and feathers', duration: 60, type: 'outdoor', isHome: false },
        ];
      }
    }

    const itinerary = await this.itineraryModel.create({
      userId,
      mood,
      ages,
      location: lat && lng ? { lat, lng } : undefined,
      activities,
      status: 'active',
    });

    return itinerary;
  }

  async complete(id: string) {
    const it = await this.itineraryModel.findByIdAndUpdate(id, { status: 'completed' }, { new: true }).lean();
    if (!it) throw new NotFoundException('Itinerary not found');
    return it;
  }

  async rate(id: string, body: { rating: number; feedbackText?: string }) {
    const it = await this.itineraryModel.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
    if (!it) throw new NotFoundException('Itinerary not found');
    return it;
  }
}
