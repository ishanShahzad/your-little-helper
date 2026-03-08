export interface ActivityTemplate {
  type: string;
  title: string;
  descriptionTemplate: string; // Use {location} placeholder
  estimatedDuration: number; // minutes
  estimatedCost: number;
  environment: 'indoor' | 'outdoor' | 'mixed';
  ageRange: [number, number]; // [min, max]
  requiresPOI: boolean;
  poiTypes: string[]; // Google Places types
  priority: number; // 1-10, higher = more important
}

export const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    type: 'supermarket',
    title: 'Grocery Adventure',
    descriptionTemplate: 'Buy ingredients for a picnic or snack at {location}',
    estimatedDuration: 20,
    estimatedCost: 10,
    environment: 'indoor',
    ageRange: [2, 12],
    requiresPOI: true,
    poiTypes: ['supermarket', 'grocery_or_supermarket'],
    priority: 3
  },
  {
    type: 'park',
    title: 'Park Playtime',
    descriptionTemplate: 'Run, play, and explore nature at {location}',
    estimatedDuration: 60,
    estimatedCost: 0,
    environment: 'outdoor',
    ageRange: [2, 12],
    requiresPOI: true,
    poiTypes: ['park'],
    priority: 9
  },
  {
    type: 'playground',
    title: 'Playground Fun',
    descriptionTemplate: 'Climb, swing, and slide at {location}',
    estimatedDuration: 45,
    estimatedCost: 0,
    environment: 'outdoor',
    ageRange: [2, 10],
    requiresPOI: true,
    poiTypes: ['playground', 'park'],
    priority: 10
  },
  {
    type: 'craft_store',
    title: 'Creative Shopping',
    descriptionTemplate: 'Pick art supplies for a project at {location}',
    estimatedDuration: 30,
    estimatedCost: 15,
    environment: 'indoor',
    ageRange: [4, 12],
    requiresPOI: true,
    poiTypes: ['store', 'home_goods_store'],
    priority: 5
  },
  {
    type: 'ice_cream',
    title: 'Sweet Treat',
    descriptionTemplate: 'Celebrate with ice cream at {location}',
    estimatedDuration: 15,
    estimatedCost: 10,
    environment: 'mixed',
    ageRange: [2, 12],
    requiresPOI: true,
    poiTypes: ['store', 'cafe'],
    priority: 7
  },
  {
    type: 'library',
    title: 'Story Time',
    descriptionTemplate: 'Browse books and read together at {location}',
    estimatedDuration: 40,
    estimatedCost: 0,
    environment: 'indoor',
    ageRange: [3, 12],
    requiresPOI: true,
    poiTypes: ['library'],
    priority: 6
  },
  {
    type: 'museum',
    title: 'Discovery Time',
    descriptionTemplate: 'Explore exhibits and learn at {location}',
    estimatedDuration: 90,
    estimatedCost: 15,
    environment: 'indoor',
    ageRange: [5, 12],
    requiresPOI: true,
    poiTypes: ['museum'],
    priority: 8
  },
  {
    type: 'cafe',
    title: 'Snack Break',
    descriptionTemplate: 'Relax with drinks and snacks at {location}',
    estimatedDuration: 30,
    estimatedCost: 15,
    environment: 'mixed',
    ageRange: [2, 12],
    requiresPOI: true,
    poiTypes: ['cafe', 'bakery'],
    priority: 6
  },
  {
    type: 'toy_store',
    title: 'Toy Shop Visit',
    descriptionTemplate: 'Browse toys and pick a small reward at {location}',
    estimatedDuration: 25,
    estimatedCost: 20,
    environment: 'indoor',
    ageRange: [2, 10],
    requiresPOI: true,
    poiTypes: ['store'],
    priority: 5
  },
  {
    type: 'bakery',
    title: 'Bakery Stop',
    descriptionTemplate: 'Pick fresh treats at {location}',
    estimatedDuration: 15,
    estimatedCost: 8,
    environment: 'mixed',
    ageRange: [2, 12],
    requiresPOI: true,
    poiTypes: ['bakery', 'cafe'],
    priority: 6
  }
];
