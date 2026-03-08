# Heroku Environment Variables Guide

## 📋 Current Configuration

All environment variables are set in Heroku. Here's the complete list:

### ✅ Core Configuration (Production Ready)

| Variable | Value | Status |
|----------|-------|--------|
| `NODE_ENV` | `production` | ✅ Set |
| `MONGODB_URI` | `mongodb+srv://vault:123@...` | ✅ Set |
| `JWT_SECRET` | Auto-generated (32 chars) | ✅ Set |
| `JWT_REFRESH_SECRET` | Auto-generated (32 chars) | ✅ Set |
| `JWT_EXPIRES_IN` | `15m` | ✅ Set |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | ✅ Set |
| `ALLOWED_ORIGINS` | `*` | ⚠️ Update for production |

### 🔧 External APIs (Production Ready)

| Variable | Value | Status |
|----------|-------|--------|
| `OVERPASS_API_URL` | `https://overpass-api.de/api/interpreter` | ✅ Set |
| `OPENROUTE_API_URL` | `https://api.openrouteservice.org/v2` | ✅ Set |
| `ORS_API_KEY` | Your key | ✅ Set |
| `OPEN_METEO_URL` | `https://api.open-meteo.com/v1/forecast` | ✅ Set |

### ⚠️ Placeholders (Need Real Values)

| Variable | Current Value | Action Required |
|----------|---------------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_test_placeholder_key_for_now` | Replace with real Stripe key |
| `STRIPE_WEBHOOK_SECRET` | `placeholder_webhook_secret` | Replace with real webhook secret |
| `STRIPE_MONTHLY_PRICE_ID` | `placeholder_monthly_price_id` | Replace with real price ID |
| `STRIPE_ANNUAL_PRICE_ID` | `placeholder_annual_price_id` | Replace with real price ID |
| `FACEBOOK_APP_ID` | `your_facebook_app_id_here` | Replace with real Facebook App ID |
| `FACEBOOK_APP_SECRET` | `your_facebook_app_secret_here` | Replace with real Facebook secret |
| `GOOGLE_MAPS_API_KEY` | `your_google_maps_api_key` | Replace with real Google Maps key |
| `CLOUDINARY_CLOUD_NAME` | `your_cloudinary_cloud_name` | Replace with real Cloudinary name |
| `CLOUDINARY_API_KEY` | `your_cloudinary_api_key` | Replace with real Cloudinary key |
| `CLOUDINARY_API_SECRET` | `your_cloudinary_api_secret` | Replace with real Cloudinary secret |

### 🔧 Build Configuration

| Variable | Value | Status |
|----------|-------|--------|
| `npm_config_legacy_peer_deps` | `true` | ✅ Set |

---

## 🔄 How to Update Environment Variables

### View All Variables
```bash
heroku config --app bumbee-backend-api
```

### View Specific Variable
```bash
heroku config:get STRIPE_SECRET_KEY --app bumbee-backend-api
```

### Set Single Variable
```bash
heroku config:set STRIPE_SECRET_KEY=sk_live_your_real_key --app bumbee-backend-api
```

### Set Multiple Variables
```bash
heroku config:set \
  STRIPE_SECRET_KEY=sk_live_your_key \
  STRIPE_WEBHOOK_SECRET=whsec_your_secret \
  --app bumbee-backend-api
```

### Remove Variable
```bash
heroku config:unset VARIABLE_NAME --app bumbee-backend-api
```

---

## 🔑 How to Get Real API Keys

### 1. Stripe (Payment Processing)

**Get Keys**:
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Navigate to Developers → API keys
3. Copy your "Secret key" (starts with `sk_test_` or `sk_live_`)

**Get Webhook Secret**:
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://bumbee-backend-api-122b78852937.herokuapp.com/subscriptions/webhook`
4. Events: Select `invoice.payment_succeeded` and `customer.subscription.deleted`
5. Copy the "Signing secret" (starts with `whsec_`)

**Get Price IDs**:
1. Go to Products
2. Create products for Monthly and Annual subscriptions
3. Copy the Price IDs (start with `price_`)

**Update Heroku**:
```bash
heroku config:set \
  STRIPE_SECRET_KEY=sk_live_your_key \
  STRIPE_WEBHOOK_SECRET=whsec_your_secret \
  STRIPE_MONTHLY_PRICE_ID=price_monthly_id \
  STRIPE_ANNUAL_PRICE_ID=price_annual_id \
  --app bumbee-backend-api
```

---

### 2. Facebook OAuth (Social Login)

**Get Keys**:
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Select your app (or create one)
3. Go to Settings → Basic
4. Copy "App ID" and "App Secret"

**Update Heroku**:
```bash
heroku config:set \
  FACEBOOK_APP_ID=your_app_id \
  FACEBOOK_APP_SECRET=your_app_secret \
  --app bumbee-backend-api
```

**Also update frontend**:
```bash
# In Bumbee-expo-app/.env
EXPO_PUBLIC_FACEBOOK_APP_ID=your_app_id
```

---

### 3. Google Maps API (Location Services)

**Get Key**:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project or select existing
3. Enable APIs: Maps JavaScript API, Places API, Geocoding API
4. Go to Credentials → Create Credentials → API Key
5. Copy the API key

**Update Heroku**:
```bash
heroku config:set GOOGLE_MAPS_API_KEY=your_api_key --app bumbee-backend-api
```

**Also update frontend**:
```bash
# In Bumbee-expo-app/.env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
```

---

### 4. Cloudinary (Image Uploads)

**Get Keys**:
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up or log in
3. Go to Dashboard
4. Copy: Cloud Name, API Key, API Secret

**Update Heroku**:
```bash
heroku config:set \
  CLOUDINARY_CLOUD_NAME=your_cloud_name \
  CLOUDINARY_API_KEY=your_api_key \
  CLOUDINARY_API_SECRET=your_api_secret \
  --app bumbee-backend-api
```

---

## 🔒 Security Best Practices

### 1. Update CORS for Production

Currently set to `*` (allows all origins). Update for production:

```bash
heroku config:set ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com --app bumbee-backend-api
```

Or keep `*` for development/testing.

### 2. Use Production Keys

- Use `sk_live_` Stripe keys for production (not `sk_test_`)
- Use production Facebook App (not development mode)
- Restrict API keys to specific domains/IPs when possible

### 3. Never Commit Secrets

- Never commit `.env` files to git
- Never share API keys publicly
- Rotate keys if accidentally exposed

### 4. Use Strong Secrets

JWT secrets are auto-generated with 32+ characters. If you need to regenerate:

```bash
# Generate new secret
openssl rand -base64 32

# Update Heroku
heroku config:set JWT_SECRET=your_new_secret --app bumbee-backend-api
```

---

## 📊 Environment Variable Checklist

### Required for Basic Functionality
- [x] `NODE_ENV`
- [x] `MONGODB_URI`
- [x] `JWT_SECRET`
- [x] `JWT_REFRESH_SECRET`
- [x] `JWT_EXPIRES_IN`
- [x] `JWT_REFRESH_EXPIRES_IN`

### Required for Full Functionality
- [ ] `STRIPE_SECRET_KEY` (real key)
- [ ] `STRIPE_WEBHOOK_SECRET` (real secret)
- [ ] `STRIPE_MONTHLY_PRICE_ID` (real ID)
- [ ] `STRIPE_ANNUAL_PRICE_ID` (real ID)
- [ ] `FACEBOOK_APP_ID` (real ID)
- [ ] `FACEBOOK_APP_SECRET` (real secret)
- [ ] `GOOGLE_MAPS_API_KEY` (real key)
- [ ] `CLOUDINARY_CLOUD_NAME` (real name)
- [ ] `CLOUDINARY_API_KEY` (real key)
- [ ] `CLOUDINARY_API_SECRET` (real secret)

### Optional
- [x] `ALLOWED_ORIGINS` (update for production)
- [x] `OVERPASS_API_URL`
- [x] `OPENROUTE_API_URL`
- [x] `ORS_API_KEY`
- [x] `OPEN_METEO_URL`

---

## 🔍 Verify Configuration

### Check All Variables
```bash
heroku config --app bumbee-backend-api
```

### Test API
```bash
curl https://bumbee-backend-api-122b78852937.herokuapp.com/health
```

### View Logs
```bash
heroku logs --tail --app bumbee-backend-api
```

Look for errors related to missing or invalid environment variables.

---

## 🚨 Troubleshooting

### "Stripe is not configured" Error
**Solution**: Update `STRIPE_SECRET_KEY` with a real key (not placeholder)

### "Facebook authentication failed" Error
**Solution**: Update `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` with real values

### "CORS error" in Frontend
**Solution**: Update `ALLOWED_ORIGINS` to include your frontend domain, or use `*` for testing

### "MongoDB connection failed" Error
**Solution**: Verify `MONGODB_URI` is correct and MongoDB Atlas allows connections from all IPs (0.0.0.0/0)

---

## 📝 Quick Reference Commands

```bash
# View all config
heroku config --app bumbee-backend-api

# Set variable
heroku config:set KEY=value --app bumbee-backend-api

# Get variable
heroku config:get KEY --app bumbee-backend-api

# Remove variable
heroku config:unset KEY --app bumbee-backend-api

# Restart app (after config changes)
heroku restart --app bumbee-backend-api

# View logs
heroku logs --tail --app bumbee-backend-api
```

---

## 🎯 Next Steps

1. **For Testing**: Current configuration works! Just test your app.

2. **For Production**:
   - Replace all placeholder values with real API keys
   - Update `ALLOWED_ORIGINS` with your actual domain
   - Use production Stripe keys (`sk_live_`)
   - Move Facebook app out of development mode

3. **Monitor**: Watch logs for any configuration errors
   ```bash
   heroku logs --tail --app bumbee-backend-api
   ```

---

**Last Updated**: March 8, 2026  
**App**: bumbee-backend-api  
**Status**: ✅ Configured (placeholders need updating for production)
