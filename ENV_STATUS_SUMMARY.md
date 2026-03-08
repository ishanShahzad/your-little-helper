# Environment Variables Status

## 📊 Quick Status Overview

### ✅ Production Ready (20 variables)

These are fully configured and working:

```
✅ NODE_ENV=production
✅ MONGODB_URI=mongodb+srv://vault:123@...
✅ JWT_SECRET=Wnrhw5SjPcvoGdNub+2zMql8OovMb5T9THDcWhYKP6c=
✅ JWT_REFRESH_SECRET=mN53YKT864SEY7Xxyy4N7bRF0ZswM6BGHnEMju8Y8aI=
✅ JWT_EXPIRES_IN=15m
✅ JWT_REFRESH_EXPIRES_IN=30d
✅ OVERPASS_API_URL=https://overpass-api.de/api/interpreter
✅ OPENROUTE_API_URL=https://api.openrouteservice.org/v2
✅ ORS_API_KEY=5b3ce3597851110001cf6248c3c4d4e1e5ae4e28b4d9040aea5e60f8
✅ OPEN_METEO_URL=https://api.open-meteo.com/v1/forecast
✅ npm_config_legacy_peer_deps=true
```

### ⚠️ Needs Real Values (10 variables)

These have placeholders - replace when you're ready to use these features:

```
⚠️ STRIPE_SECRET_KEY=sk_test_placeholder_key_for_now
⚠️ STRIPE_WEBHOOK_SECRET=placeholder_webhook_secret
⚠️ STRIPE_MONTHLY_PRICE_ID=placeholder_monthly_price_id
⚠️ STRIPE_ANNUAL_PRICE_ID=placeholder_annual_price_id
⚠️ FACEBOOK_APP_ID=your_facebook_app_id_here
⚠️ FACEBOOK_APP_SECRET=your_facebook_app_secret_here
⚠️ GOOGLE_MAPS_API_KEY=your_google_maps_api_key
⚠️ CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
⚠️ CLOUDINARY_API_KEY=your_cloudinary_api_key
⚠️ CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 🔄 Should Update (1 variable)

```
🔄 ALLOWED_ORIGINS=*  (Change to your domain for production)
```

---

## 🎯 What Works Right Now

With current configuration, these features work:

✅ User registration & login (email/password)  
✅ JWT authentication  
✅ Hunt generation  
✅ Itinerary creation  
✅ Nearby places search  
✅ Weather information  
✅ User profiles  
✅ Referral system  
✅ Feedback submission  

---

## ⏳ What Needs API Keys

These features need real API keys to work:

❌ **Stripe Payments** - Need real Stripe keys  
❌ **Facebook Login** - Need real Facebook App credentials  
❌ **Google Maps** - Need real Google Maps API key  
❌ **Image Uploads** - Need real Cloudinary credentials  

---

## 🚀 Quick Update Commands

### Update Stripe (for payments)
```bash
heroku config:set \
  STRIPE_SECRET_KEY=sk_live_your_key \
  STRIPE_WEBHOOK_SECRET=whsec_your_secret \
  STRIPE_MONTHLY_PRICE_ID=price_monthly \
  STRIPE_ANNUAL_PRICE_ID=price_annual \
  --app bumbee-backend-api
```

### Update Facebook (for social login)
```bash
heroku config:set \
  FACEBOOK_APP_ID=your_app_id \
  FACEBOOK_APP_SECRET=your_app_secret \
  --app bumbee-backend-api
```

### Update Google Maps (for maps)
```bash
heroku config:set GOOGLE_MAPS_API_KEY=your_key --app bumbee-backend-api
```

### Update Cloudinary (for images)
```bash
heroku config:set \
  CLOUDINARY_CLOUD_NAME=your_name \
  CLOUDINARY_API_KEY=your_key \
  CLOUDINARY_API_SECRET=your_secret \
  --app bumbee-backend-api
```

### Update CORS (for production)
```bash
heroku config:set ALLOWED_ORIGINS=https://yourdomain.com --app bumbee-backend-api
```

---

## 📋 View Current Config

```bash
heroku config --app bumbee-backend-api
```

---

## ✅ Bottom Line

**Your app is deployed and working!** 🎉

The core functionality (auth, hunts, itineraries) works with current config. Update the placeholder values when you're ready to enable:
- Payment processing (Stripe)
- Social login (Facebook)
- Maps (Google Maps)
- Image uploads (Cloudinary)

For detailed instructions, see: `HEROKU_ENV_VARIABLES.md`
