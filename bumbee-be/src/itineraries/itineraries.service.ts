import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Itinerary, ItineraryDocument, Activity } from '../schemas/itinerary.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { ACTIVITY_TEMPLATES, ActivityTemplate } from './activity-templates';

interface GenerateItineraryDto {
  lat: number;
  lng: number;
  ages: number[];
  durationMinutes: number;
  budget: number;
  transportMode: 'walking' | 'car';
  preference: 'indoor' | 'outdoor' | 'mixed';
}

@Injectable()
export class ItinerariesService {
  constructor(
    @InjectModel(Itinerary.name) private itineraryModel: Model<ItineraryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async generate(userId: string, dto: GenerateItineraryDto) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    
    const completedCount = (user.history || []).length;
    if (completedCount >= 1 && user.subscription?.plan === 'free') {
      throw new ForbiddenException({ 
        message: 'subscription_required', 
        statusCode: 402 
      });
    }

    // 1. Determine activity count based on duration
    const activityCount = this.getActivityCount(dto.durationMinutes);
    
    // 2. Filter templates by age
    const avgAge = dto.ages.reduce((a, b) => a + b, 0) / dto.ages.length;
    const ageFiltered = ACTIVITY_TEMPLATES.filter(t => 
      avgAge >= t.ageRange[0] && avgAge <= t.ageRange[1]
    );
    
    // 3. Filter by environment preference
    const envFiltered = this.filterByEnvironment(ageFiltered, dto.preference);
    
    // 4. Select activities that fit budget
    const selected = this.selectActivitiesForBudget(
      envFiltered,
      dto.budget,
      activityCount
    );
    
    if (selected.length === 0) {
      throw new BadRequestException(
        'Unable to generate itinerary with given constraints'
      );
    }
    
    // 5. Calculate search radius based on transport mode
    const radius = this.getRadiusByTransport(dto.durationMinutes, dto.transportMode);
    
    // 6. Fetch POIs for each activity type
    const poiMap = await this.fetchPOIsForActivities(
      selected,
      dto.lat,
      dto.lng,
      radius
    );
    
    // 7. Match activities to POIs and create sequence
    const activities = await this.matchActivitiesToPOIs(
      selected,
      poiMap,
      dto.lat,
      dto.lng
    );
    
    if (activities.length < 2) {
      throw new BadRequestException(
        'Not enough suitable locations found in your area'
      );
    }
    
    // 8. Calculate timing
    const timedActivities = this.calculateActivityTiming(activities);
    
    // 9. Calculate totals
    const totalCost = activities.reduce((sum, a) => sum + a.estimatedCost, 0);
    const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
    
    // 10. Create itinerary
    const itinerary = await this.itineraryModel.create({
      userId,
      ages: dto.ages,
      location: { lat: dto.lat, lng: dto.lng },
      durationMinutes: dto.durationMinutes,
      budget: dto.budget,
      transportMode: dto.transportMode,
      preference: dto.preference,
      activities: timedActivities,
      totalEstimatedCost: totalCost,
      totalDuration: totalDuration,
    });

    console.log(`[Itinerary] Created: ${itinerary._id} with ${activities.length} activities`);
    return itinerary.toObject();
  }

  private getActivityCount(durationMinutes: number): number {
    if (durationMinutes <= 30) return 2;
    if (durationMinutes <= 60) return 3;
    if (durationMinutes <= 120) return 4;
    if (durationMinutes <= 180) return 5;
    return 6;
  }

  private filterByEnvironment(
    templates: ActivityTemplate[],
    preference: string
  ): ActivityTemplate[] {
    if (preference === 'indoor') {
      return templates.filter(t => 
        t.environment === 'indoor' || t.environment === 'mixed'
      );
    } else if (preference === 'outdoor') {
      return templates.filter(t => 
        t.environment === 'outdoor' || t.environment === 'mixed'
      );
    }
    return templates; // 'mixed' - return all
  }

  private selectActivitiesForBudget(
    templates: ActivityTemplate[],
    budget: number,
    count: number
  ): ActivityTemplate[] {
    // Sort by priority (high to low) then cost (low to high)
    const sorted = [...templates].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.estimatedCost - b.estimatedCost;
    });

    const selected: ActivityTemplate[] = [];
    let remainingBudget = budget;

    // Strategy: Always include high-priority free activities
    const free = sorted.filter(t => t.estimatedCost === 0);
    if (free.length > 0 && budget <= 30) {
      selected.push(free[0]);
      if (free.length > 1) selected.push(free[1]);
    }

    // Fill remaining slots with activities that fit budget
    for (const template of sorted) {
      if (selected.length >= count) break;
      if (selected.includes(template)) continue;
      
      if (template.estimatedCost <= remainingBudget) {
        selected.push(template);
        remainingBudget -= template.estimatedCost;
      }
    }

    // If still need more, add free activities
    while (selected.length < count) {
      const freeOption = sorted.find(t => 
        t.estimatedCost === 0 && !selected.includes(t)
      );
      if (freeOption) {
        selected.push(freeOption);
      } else {
        break;
      }
    }

    return selected;
  }

  private getRadiusByTransport(durationMinutes: number, transportMode: string): number {
    if (transportMode === 'car') {
      if (durationMinutes <= 30) return 3000;
      if (durationMinutes <= 60) return 5000;
      return 7000;
    } else {
      // walking
      if (durationMinutes <= 30) return 800;
      if (durationMinutes <= 60) return 1500;
      return 2500;
    }
  }

  private async fetchPOIsForActivities(
    activities: ActivityTemplate[],
    lat: number,
    lng: number,
    radius: number
  ): Promise<Map<string, any[]>> {
    const poiMap = new Map<string, any[]>();
    const googleApiKey = this.configService.get('GOOGLE_MAPS_API_KEY');

    if (!googleApiKey || googleApiKey === 'your-google-maps-api-key-here') {
      console.warn('[Itinerary] No Google API key, using fallback');
      return this.fetchPOIsFromOverpass(activities, lat, lng, radius);
    }

    // Fetch POIs for each unique activity type
    const uniqueTypes = new Set(activities.map(a => a.type));

    for (const type of uniqueTypes) {
      const template = activities.find(a => a.type === type);
      if (!template) continue;

      try {
        const pois = await this.fetchFromGooglePlaces(
          lat,
          lng,
          radius,
          template.poiTypes
        );

        // Additional filtering for specific types
        let filtered = pois;
        if (type === 'ice_cream') {
          filtered = pois.filter(p =>
            p.name?.toLowerCase().includes('ice cream') ||
            p.name?.toLowerCase().includes('gelato') ||
            p.name?.toLowerCase().includes('frozen yogurt')
          );
        } else if (type === 'craft_store') {
          filtered = pois.filter(p =>
            p.name?.toLowerCase().includes('craft') ||
            p.name?.toLowerCase().includes('art supply') ||
            p.name?.toLowerCase().includes('hobby')
          );
        } else if (type === 'toy_store') {
          filtered = pois.filter(p =>
            p.name?.toLowerCase().includes('toy')
          );
        }

        poiMap.set(type, filtered);
        console.log(`[Itinerary] Found ${filtered.length} POIs for ${type}`);
      } catch (err) {
        console.error(`[Itinerary] Failed to fetch ${type}:`, err.message);
        poiMap.set(type, []);
      }
    }

    return poiMap;
  }

  private async fetchFromGooglePlaces(
    lat: number,
    lng: number,
    radius: number,
    types: string[]
  ): Promise<any[]> {
    const googleApiKey = this.configService.get('GOOGLE_MAPS_API_KEY');
    const allPlaces: any[] = [];

    for (const type of types) {
      try {
        const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
        const { data } = await axios.get(url, {
          params: {
            location: `${lat},${lng}`,
            radius: radius.toString(),
            type,
            key: googleApiKey,
          },
          timeout: 10000,
        });

        if (data.status === 'OK' && data.results) {
          allPlaces.push(...data.results);
        }
      } catch (err) {
        console.warn(`[Google Places] Failed for ${type}:`, err.message);
      }
    }

    return allPlaces;
  }

  private async fetchPOIsFromOverpass(
    activities: ActivityTemplate[],
    lat: number,
    lng: number,
    radius: number
  ): Promise<Map<string, any[]>> {
    // Fallback to Overpass API
    const poiMap = new Map<string, any[]>();
    
    const query = `
      [out:json][timeout:25];
      (
        node(around:${radius},${lat},${lng})[leisure~"park|playground"];
        node(around:${radius},${lat},${lng})[amenity~"cafe|library"];
        node(around:${radius},${lat},${lng})[shop~"supermarket|bakery"];
      );
      out body 30;
    `;

    try {
      const overpassUrl = this.configService.get('OVERPASS_API_URL');
      const { data } = await axios.post(
        overpassUrl,
        `data=${encodeURIComponent(query)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 25000,
        }
      );

      const elements = data.elements || [];
      
      // Categorize by type
      for (const activity of activities) {
        const matching = elements.filter((e: any) => {
          const tags = e.tags || {};
          if (activity.type === 'park') return tags.leisure === 'park';
          if (activity.type === 'playground') return tags.leisure === 'playground';
          if (activity.type === 'cafe') return tags.amenity === 'cafe';
          if (activity.type === 'library') return tags.amenity === 'library';
          if (activity.type === 'supermarket') return tags.shop === 'supermarket';
          if (activity.type === 'bakery') return tags.shop === 'bakery';
          return false;
        });
        
        poiMap.set(activity.type, matching);
      }
    } catch (err) {
      console.error('[Overpass] Failed:', err.message);
    }

    return poiMap;
  }

  private async matchActivitiesToPOIs(
    templates: ActivityTemplate[],
    poiMap: Map<string, any[]>,
    startLat: number,
    startLng: number
  ): Promise<Activity[]> {
    const activities: Activity[] = [];
    let currentLat = startLat;
    let currentLng = startLng;

    // Create logical sequence:
    // 1. Shopping activities first (supermarket, craft store)
    // 2. Main activities (park, playground, museum)
    // 3. Treats last (ice cream, cafe)

    const shopping = templates.filter(t =>
      ['supermarket', 'craft_store', 'toy_store'].includes(t.type)
    );
    const main = templates.filter(t =>
      ['park', 'playground', 'museum', 'library'].includes(t.type)
    );
    const treats = templates.filter(t =>
      ['ice_cream', 'cafe', 'bakery'].includes(t.type)
    );

    const sequence = [...shopping, ...main, ...treats];

    for (const template of sequence) {
      const pois = poiMap.get(template.type) || [];
      
      if (pois.length === 0) {
        console.warn(`[Itinerary] No POIs found for ${template.type}, skipping`);
        continue;
      }

      // Find nearest POI
      const nearest = this.findNearestPOI(pois, currentLat, currentLng);

      if (nearest) {
        const locationName = nearest.name || nearest.tags?.name || 'nearby location';
        
        activities.push({
          step: activities.length + 1,
          title: template.title,
          description: template.descriptionTemplate.replace('{location}', locationName),
          duration: template.estimatedDuration,
          type: template.type,
          estimatedCost: template.estimatedCost,
          priceLevel: nearest.price_level || 0,
          lat: nearest.geometry?.location?.lat || nearest.lat,
          lng: nearest.geometry?.location?.lng || nearest.lon,
          address: nearest.vicinity || this.buildAddress(nearest.tags),
          googleMapsLink: `https://www.google.com/maps/dir/?api=1&destination=${nearest.geometry?.location?.lat || nearest.lat},${nearest.geometry?.location?.lng || nearest.lon}`,
          placeId: nearest.place_id || '',
          isHome: false,
          completed: false,
          time: '', // Will be set later
        });

        currentLat = nearest.geometry?.location?.lat || nearest.lat;
        currentLng = nearest.geometry?.location?.lng || nearest.lon;
      }
    }

    return activities;
  }

  private findNearestPOI(pois: any[], lat: number, lng: number): any | null {
    if (pois.length === 0) return null;

    let nearest = pois[0];
    let minDist = this.haversineDistance(
      lat,
      lng,
      nearest.geometry?.location?.lat || nearest.lat,
      nearest.geometry?.location?.lng || nearest.lon
    );

    for (const poi of pois) {
      const poiLat = poi.geometry?.location?.lat || poi.lat;
      const poiLng = poi.geometry?.location?.lng || poi.lon;
      const dist = this.haversineDistance(lat, lng, poiLat, poiLng);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = poi;
      }
    }

    return nearest;
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private buildAddress(tags: any): string {
    if (!tags) return 'Address not available';
    const parts: string[] = [];
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }

  private calculateActivityTiming(activities: Activity[]): Activity[] {
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0); // Start at 9 AM

    return activities.map(activity => {
      const timeStr = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      currentTime = new Date(currentTime.getTime() + activity.duration * 60000);

      return {
        ...activity,
        time: timeStr,
      };
    });
  }

  async complete(id: string) {
    return this.itineraryModel.findByIdAndUpdate(
      id,
      { status: 'completed' },
      { new: true }
    ).lean();
  }

  async rate(id: string, body: { rating: number; feedbackText?: string }) {
    return this.itineraryModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).lean();
  }
}
