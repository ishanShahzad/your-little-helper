# 🚀 Heroku Deployment Checklist

## Pre-Deployment

### 1. Prerequisites
- [ ] Heroku account created at [heroku.com](https://heroku.com)
- [ ] Heroku CLI installed ([download](https://devcenter.heroku.com/articles/heroku-cli))
- [ ] Git installed and repository initialized
- [ ] MongoDB Atlas account with database created
- [ ] All API keys and secrets ready

### 2. Local Testing
- [ ] Backend runs locally without errors: `cd bumbee-be && npm run start:dev`
- [ ] All environment variables in `.env` are working
- [ ] Database connection successful
- [ ] API endpoints tested and working
- [ ] No TypeScript compilation errors: `npm run build`

### 3. Code Preparation
- [ ] All changes committed to git
- [ ] `.gitignore` includes `.env` file
- [ ] `Procfile` exists in `bumbee-be/` directory
- [ ] `package.json` has `heroku-postbuild` script
- [ ] `package.json` has `engines` field with Node version

## Deployment Steps

### 4. Heroku Setup
- [ ] Logged in to Heroku: `heroku login`
- [ ] Heroku app created: `heroku create your-app-name`
- [ ] Git remote added: `heroku git:remote -a your-app-name`

### 5. Environment Variables
Set all required config vars on Heroku:

**Required**:
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` (generate: `openssl rand -base64 32`)
- [ ] `JWT_REFRESH_SECRET` (generate: `openssl rand -base64 32`)
- [ ] `JWT_EXPIRES_IN=15m`
- [ ] `JWT_REFRESH_EXPIRES_IN=30d`
- [ ] `MONGODB_URI` (your MongoDB connection string)

**Optional** (set if using these features):
- [ ] `ALLOWED_ORIGINS` (comma-separated, e.g., `https://yourdomain.com,https://app.yourdomain.com`)
- [ ] `FACEBOOK_APP_ID`
- [ ] `FACEBOOK_APP_SECRET`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_MONTHLY_PRICE_ID`
- [ ] `STRIPE_ANNUAL_PRICE_ID`
- [ ] `GOOGLE_MAPS_API_KEY`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `REDIS_HOST` (if using external Redis)
- [ ] `REDIS_PORT` (if using external Redis)

**Set with**:
```bash
heroku config:set KEY=value --app your-app-name
```

### 6. Database Configuration
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs)
- [ ] MongoDB connection string tested
- [ ] Database user has read/write permissions

### 7. Deploy Code
- [ ] Code pushed to Heroku: `git push heroku main`
- [ ] Build completed successfully (check logs)
- [ ] No build errors in Heroku logs

### 8. Scale Dyno
- [ ] Web dyno scaled: `heroku ps:scale web=1`
- [ ] Dyno is running: `heroku ps`

## Post-Deployment

### 9. Verification
- [ ] App is accessible: `heroku open`
- [ ] Root endpoint works: `curl https://your-app-name.herokuapp.com`
- [ ] Health check works: `curl https://your-app-name.herokuapp.com/health`
- [ ] No errors in logs: `heroku logs --tail`
- [ ] Database connection successful (check logs)

### 10. API Testing
Test key endpoints:
- [ ] `GET /` - Returns "Bumbee API is running! 🐝"
- [ ] `GET /health` - Returns health status
- [ ] `POST /auth/register` - User registration works
- [ ] `POST /auth/login` - User login works
- [ ] `POST /auth/facebook` - Facebook login works (if configured)

### 11. Frontend Integration
- [ ] Update `Bumbee-expo-app/.env`:
  ```env
  EXPO_PUBLIC_API_URL=https://your-app-name.herokuapp.com
  ```
- [ ] Frontend can connect to backend
- [ ] Test login from mobile app
- [ ] Test API calls from mobile app

### 12. Security
- [ ] HTTPS is enabled (automatic on Heroku)
- [ ] CORS configured properly (not using `*` in production)
- [ ] JWT secrets are strong and unique
- [ ] No sensitive data in logs
- [ ] Rate limiting is active
- [ ] Helmet security headers enabled

### 13. Monitoring
- [ ] Logs are accessible: `heroku logs --tail`
- [ ] App metrics visible: `heroku ps`
- [ ] Error tracking configured (optional: Sentry, New Relic)

## Production Optimization

### 14. Performance
- [ ] Consider upgrading to Hobby dyno ($7/month) to prevent sleeping
- [ ] Add Redis for caching (optional): `heroku addons:create heroku-redis:mini`
- [ ] Monitor response times
- [ ] Optimize database queries

### 15. Backup & Recovery
- [ ] MongoDB backups configured in Atlas
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Rollback plan in place: `heroku rollback`

### 16. Domain & SSL (Optional)
- [ ] Custom domain added: `heroku domains:add api.yourdomain.com`
- [ ] DNS CNAME record configured
- [ ] SSL certificate verified (automatic on Heroku)

## Troubleshooting

### Common Issues

**App crashes on startup**:
```bash
heroku logs --tail
# Check for missing environment variables or connection errors
```

**Build fails**:
```bash
heroku logs --tail
# Check for TypeScript errors or missing dependencies
```

**Can't connect to MongoDB**:
- Verify MongoDB URI: `heroku config:get MONGODB_URI`
- Check IP whitelist in MongoDB Atlas
- Test connection string locally

**CORS errors**:
- Set `ALLOWED_ORIGINS` config var
- Include your frontend domain

**502 Bad Gateway**:
- Check if dyno is running: `heroku ps`
- Restart app: `heroku restart`
- Check logs for startup errors

## Useful Commands

```bash
# View logs
heroku logs --tail --app your-app-name

# Restart app
heroku restart --app your-app-name

# View config
heroku config --app your-app-name

# Scale dynos
heroku ps:scale web=1 --app your-app-name

# Run bash
heroku run bash --app your-app-name

# View releases
heroku releases --app your-app-name

# Rollback
heroku rollback --app your-app-name

# Open app
heroku open --app your-app-name
```

## Success Criteria

✅ **Deployment is successful when**:
1. App is accessible at Heroku URL
2. Health check endpoint returns 200 OK
3. User can register and login
4. Frontend can communicate with backend
5. No errors in Heroku logs
6. Database operations work correctly
7. All API endpoints respond correctly

## Next Steps

After successful deployment:
1. Monitor logs for the first 24 hours
2. Test all features thoroughly
3. Set up monitoring and alerts
4. Document any issues and solutions
5. Plan for scaling if needed
6. Consider upgrading dyno type for production

## Support

- **Heroku Documentation**: [devcenter.heroku.com](https://devcenter.heroku.com)
- **Heroku Status**: [status.heroku.com](https://status.heroku.com)
- **Support**: [help.heroku.com](https://help.heroku.com)

---

## Quick Deploy Commands

```bash
# One-liner deployment (after setup)
cd bumbee-be && git add . && git commit -m "Deploy" && git push heroku main

# Or use the automated script
cd bumbee-be && ./deploy-heroku.sh
```

---

**Last Updated**: March 8, 2026
**Version**: 1.0.0
