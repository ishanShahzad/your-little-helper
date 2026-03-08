# Heroku Deployment Guide - Bumbee Backend

## 📋 Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI**: Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure git is installed and your code is in a git repository

## 🚀 Quick Deployment Steps

### 1. Login to Heroku

```bash
heroku login
```

This will open a browser window for authentication.

### 2. Create Heroku App

```bash
cd bumbee-be
heroku create bumbee-backend
# Or use: heroku create (for auto-generated name)
```

**Note**: Replace `bumbee-backend` with your preferred app name. The name must be unique across all Heroku apps.

### 3. Add MongoDB Add-on (Optional)

If you don't have an external MongoDB:

```bash
# Free tier MongoDB Atlas add-on
heroku addons:create mongolab:sandbox
```

Or use your existing MongoDB Atlas connection string (recommended).

### 4. Add Redis Add-on (Optional)

If you need Redis for caching:

```bash
# Free tier Redis
heroku addons:create heroku-redis:mini
```

### 5. Set Environment Variables

Set all required environment variables from your `.env` file:

```bash
# Required - JWT Secrets
heroku config:set JWT_SECRET=your_super_secret_jwt_key_here
heroku config:set JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
heroku config:set JWT_EXPIRES_IN=15m
heroku config:set JWT_REFRESH_EXPIRES_IN=30d

# Required - MongoDB
heroku config:set MONGODB_URI=your_mongodb_connection_string

# Required - Node Environment
heroku config:set NODE_ENV=production

# Optional - Stripe (if using payments)
heroku config:set STRIPE_SECRET_KEY=your_stripe_secret_key
heroku config:set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
heroku config:set STRIPE_MONTHLY_PRICE_ID=your_monthly_price_id
heroku config:set STRIPE_ANNUAL_PRICE_ID=your_annual_price_id

# Optional - Facebook OAuth
heroku config:set FACEBOOK_APP_ID=your_facebook_app_id
heroku config:set FACEBOOK_APP_SECRET=your_facebook_app_secret

# Optional - Redis (if not using add-on)
heroku config:set REDIS_HOST=your_redis_host
heroku config:set REDIS_PORT=6379

# Optional - Cloudinary (for image uploads)
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_api_key
heroku config:set CLOUDINARY_API_SECRET=your_api_secret

# Optional - External APIs
heroku config:set GOOGLE_MAPS_API_KEY=your_google_maps_key
heroku config:set OVERPASS_API_URL=https://overpass-api.de/api/interpreter
heroku config:set OPENROUTE_API_URL=https://api.openrouteservice.org/v2
heroku config:set OPEN_METEO_URL=https://api.open-meteo.com/v1/forecast
```

**Bulk Set (Alternative)**:
```bash
# Set multiple at once
heroku config:set \
  JWT_SECRET=your_jwt_secret \
  JWT_REFRESH_SECRET=your_refresh_secret \
  MONGODB_URI=your_mongodb_uri \
  NODE_ENV=production
```

### 6. Deploy to Heroku

```bash
# Make sure you're in the bumbee-be directory
cd bumbee-be

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Heroku deployment"

# Add Heroku remote (if not already added)
heroku git:remote -a bumbee-backend

# Deploy
git push heroku main
# Or if your branch is named 'master':
# git push heroku master
```

**If deploying from a subdirectory** (since bumbee-be is a subfolder):

```bash
# From the root of your project
git subtree push --prefix bumbee-be heroku main
```

### 7. Scale the Dyno

```bash
# Ensure at least one web dyno is running
heroku ps:scale web=1
```

### 8. Open Your App

```bash
heroku open
```

Or visit: `https://bumbee-backend.herokuapp.com`

### 9. View Logs

```bash
# Stream logs in real-time
heroku logs --tail

# View recent logs
heroku logs --tail --num 200
```

## 🔧 Configuration Files Created

The following files have been created for Heroku deployment:

1. **`Procfile`** - Tells Heroku how to run your app
   ```
   web: npm run start:prod
   ```

2. **`.slugignore`** - Files to exclude from deployment
   - Test files
   - Documentation
   - Development files

3. **`package.json`** - Updated with:
   - `heroku-postbuild` script (builds the app)
   - `engines` field (specifies Node.js version)

## 📱 Update Frontend Configuration

After deployment, update your frontend to use the Heroku URL:

**`Bumbee-expo-app/.env`**:
```env
EXPO_PUBLIC_API_URL=https://bumbee-backend.herokuapp.com
```

Replace `bumbee-backend` with your actual Heroku app name.

## 🔍 Verify Deployment

### Check App Status
```bash
heroku ps
```

### Test API Endpoint
```bash
curl https://bumbee-backend.herokuapp.com
# Or
curl https://bumbee-backend.herokuapp.com/health
```

### Check Environment Variables
```bash
heroku config
```

## 🐛 Troubleshooting

### Build Fails

**Check build logs**:
```bash
heroku logs --tail
```

**Common issues**:
- Missing dependencies: Ensure all packages are in `dependencies`, not `devDependencies`
- TypeScript errors: Fix any compilation errors locally first
- Node version mismatch: Specify Node version in `package.json`

### App Crashes on Startup

**Check logs**:
```bash
heroku logs --tail
```

**Common issues**:
- Missing environment variables
- MongoDB connection issues
- Port binding issues (Heroku sets PORT automatically)

### Database Connection Issues

**Verify MongoDB URI**:
```bash
heroku config:get MONGODB_URI
```

**Test connection**:
- Ensure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Or add Heroku's IP ranges to your MongoDB whitelist

### Redis Connection Issues

If using Redis add-on:
```bash
heroku config:get REDIS_URL
```

Update your app to use `REDIS_URL` if the add-on sets it differently.

## 🔄 Updating Your App

### Deploy Updates

```bash
# From bumbee-be directory
git add .
git commit -m "Your update message"
git push heroku main
```

### Restart App

```bash
heroku restart
```

### Run Database Migrations

```bash
heroku run npm run migration:run
# Or any custom migration command
```

## 💰 Cost Considerations

### Free Tier Limitations
- **Dynos**: Sleep after 30 minutes of inactivity
- **Hours**: 550-1000 free dyno hours per month
- **Add-ons**: Limited free tiers available

### Upgrade Options
```bash
# Upgrade to Hobby dyno ($7/month - no sleeping)
heroku ps:type hobby

# Upgrade to Standard dyno ($25-50/month)
heroku ps:type standard-1x
```

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Use Heroku config vars
2. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
3. **Enable HTTPS only** - Heroku provides SSL by default
4. **Whitelist CORS origins** - Update CORS settings in production
5. **Rate limiting** - Already implemented with `@nestjs/throttler`

## 📊 Monitoring

### View Metrics
```bash
heroku logs --tail
heroku ps
```

### Add Monitoring (Optional)
```bash
# Add New Relic for monitoring
heroku addons:create newrelic:wayne

# Add Papertrail for log management
heroku addons:create papertrail:choklad
```

## 🌐 Custom Domain (Optional)

### Add Custom Domain
```bash
heroku domains:add api.bumbee.com
```

### Configure DNS
Add a CNAME record pointing to your Heroku app URL.

## 🔗 Useful Commands

```bash
# Open Heroku dashboard
heroku open --app bumbee-backend

# Run bash on Heroku
heroku run bash

# View app info
heroku info

# View add-ons
heroku addons

# View releases
heroku releases

# Rollback to previous release
heroku rollback

# Scale dynos
heroku ps:scale web=2

# View dyno types
heroku ps:type
```

## 📚 Additional Resources

- [Heroku Node.js Documentation](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Config Vars](https://devcenter.heroku.com/articles/config-vars)
- [Heroku Logs](https://devcenter.heroku.com/articles/logging)
- [Heroku Postgres](https://devcenter.heroku.com/articles/heroku-postgresql)

## ✅ Deployment Checklist

- [ ] Heroku CLI installed
- [ ] Heroku account created
- [ ] App created on Heroku
- [ ] All environment variables set
- [ ] MongoDB connection configured
- [ ] Code pushed to Heroku
- [ ] App is running (check with `heroku ps`)
- [ ] API endpoints tested
- [ ] Frontend updated with Heroku URL
- [ ] Logs monitored for errors
- [ ] SSL/HTTPS working
- [ ] CORS configured for production

## 🎉 Success!

Your Bumbee backend should now be live on Heroku! 

**Your API URL**: `https://your-app-name.herokuapp.com`

Test it with:
```bash
curl https://your-app-name.herokuapp.com
```
