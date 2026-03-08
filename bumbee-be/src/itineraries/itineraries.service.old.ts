import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Itinerary, ItineraryDocument } from '../schemas/itinerary.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ItinerariesService {
  constructor(
    @InjectModel(Itinerary.name) private itineraryModel: Model<ItineraryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async generate(userId: string, body: { lat?: number; lng?: number; mood: string; ages: number[] }) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    if ((user.history || []).length >= 1 && user.subscription?.plan === 'free') {
      throw new ForbiddenException({ message: 'subscription_required', statusCode: 402 });
    }

    let activities: any[] = [];

    if (body.mood === 'rainy' || body.mood === 'sick') {
      activities = [
        { time: '09:00', title: '🎨 Arts & Crafts', description: 'Create themed artwork together', duration: 60, type: 'craft', isHome: true },
        { time: '10:30', title: '🧩 Puzzle Time', description: 'Work on a jigsaw puzzle as a family', duration: 45, type: 'game', isHome: true },
        { time: '12:00', title: '🍕 Cook Together', description: 'Make lunch as a family activity', duration: 60, type: 'cooking', isHome: true },
        { time: '14:00', title: '📚 Story Time', description: 'Read and act out favourite stories', duration: 45, type: 'reading', isHome: true },
        { time: '15:30', title: '🎭 Indoor Treasure Hunt', description: 'Hide clues around the house', duration: 60, type: 'game', isHome: true },
      ];
    } else {
      // Fetch nearby places from Overpass
      let places: any[] = [];
      try {
        const query = `[out:json][timeout:25];node(around:3000,${body.lat},${body.lng})[amenity~"cafe|restaurant|museum"];out body 6;`;
        const { data } = await axios.post(this.configService.get('OVERPASS_API_URL')!, `data=${encodeURIComponent(query)}`, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        places = data.elements || [];
      } catch { /* fallback */ }

      activities = [
        { time: '09:30', title: '🌳 Morning Adventure', description: places[0]?.tags?.name || 'Visit a nearby park', duration: 90, type: 'outdoor', address: places[0]?.tags?.name, isHome: false },
        { time: '12:00', title: '🍽️ Lunch Break', description: places[1]?.tags?.name || 'Find a family-friendly restaurant', duration: 60, type: 'food', address: places[1]?.tags?.name, isHome: false },
        { time: '14:00', title: '🏛️ Afternoon Exploration', description: places[2]?.tags?.name || 'Explore something new', duration: 90, type: 'culture', address: places[2]?.tags?.name, isHome: false },
        { time: '16:30', title: '🍦 Treat Time', description: 'End the day with something sweet', duration: 30, type: 'food', isHome: false },
      ];
    }

    const itinerary = await this.itineraryModel.create({
      userId,
      mood: body.mood,
      ages: body.ages,
      location: body.lat && body.lng ? { lat: body.lat, lng: body.lng } : undefined,
      activities,
    });

    return itinerary.toObject();
  }

  async complete(id: string) {
    return this.itineraryModel.findByIdAndUpdate(id, { status: 'completed' }, { new: true }).lean();
  }

  async rate(id: string, body: { rating: number; feedbackText?: string }) {
    return this.itineraryModel.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  }
}
