# 🐝 Bumbee — Family Adventure App

A mobile-first app that helps families plan spontaneous outdoor adventures, scavenger hunts, and rainy-day itineraries.

## Architecture

```
bumbee/
├── apps/
│   ├── api/          # NestJS backend (MongoDB, Redis, Stripe, Socket.io)
│   └── mobile/       # React Native Expo app
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Expo CLI (`npm i -g expo-cli`)
- EAS CLI (`npm i -g eas-cli`)

## Setup

1. **Clone & install**
   ```bash
   git clone <repo-url> && cd bumbee
   ```

2. **Configure environment**
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Fill in your API keys (see below)
   ```

3. **Start infrastructure**
   ```bash
   docker-compose up -d mongodb redis
   ```

4. **Run backend**
   ```bash
   cd apps/api
   npm install
   npm run start:dev
   ```

5. **Run mobile app**
   ```bash
   cd apps/mobile
   npm install
   npx expo start
   ```

## API Keys

| Service | Get key at |
|---------|-----------|
| Google Maps | https://console.cloud.google.com/apis |
| Stripe | https://dashboard.stripe.com/apikeys |
| OpenRouteService | https://openrouteservice.org/dev/#/signup |
| Facebook | https://developers.facebook.com |
| Cloudinary | https://cloudinary.com/console |

## Tech Stack

- **Mobile**: React Native (Expo), Zustand, React Query, MapView
- **Backend**: NestJS, MongoDB/Mongoose, Redis, Socket.io, Stripe
- **Infra**: Docker, Cloudinary

## License

© 2025 Bumbee Ltd. All rights reserved.
