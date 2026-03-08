# Heroku Quick Deploy - 3 Methods

## 🚀 Method 1: Automated Script (Easiest)

```bash
cd bumbee-be
./deploy-heroku.sh
```

The script will:
- ✅ Check if Heroku CLI is installed
- ✅ Create or use existing Heroku app
- ✅ Generate JWT secrets automatically
- ✅ Set all environment variables
- ✅ Deploy your code
- ✅ Scale the web dyno

**Prerequisites**: Heroku CLI installed and logged in

---

## 📝 Method 2: Manual Step-by-Step

### 1. Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login
```bash
heroku login
```

### 3. Create App
```bash
cd bumbee-be
heroku create your-app-name
```

### 4. Set Environment Variables
```bash
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET=$(openssl rand -base64 32) \
  JWT_REFRESH_SECRET=$(openssl rand -base64 32) \
  MONGODB_URI=your_mongodb_connection_string
```

### 5. Deploy
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### 6. Scale Dyno
```bash
heroku ps:scale web=1
```

---

## 🌐 Method 3: Heroku Dashboard (No CLI)

### 1. Create App
- Go to [dashboard.heroku.com](https://dashboard.heroku.com)
- Click "New" → "Create new app"
- Enter app name and region

### 2. Connect GitHub (Optional)
- Go to "Deploy" tab
- Select "GitHub" as deployment method
- Connect your repository
- Enable automatic deploys

### 3. Set Config Vars
- Go to "Settings" tab
- Click "Reveal Config Vars"
- Add all environment variables:
  - `NODE_ENV` = `production`
  - `JWT_SECRET` = (generate with: `openssl rand -base64 32`)
  - `JWT_REFRESH_SECRET` = (generate with: `openssl rand -base64 32`)
  - `MONGODB_URI` = your MongoDB connection string
  - Add others as needed

### 4. Deploy
- Go to "Deploy" tab
- Click "Deploy Branch" (if manual)
- Or push to GitHub (if automatic deploys enabled)

---

## ✅ After Deployment

### 1. Test Your API
```bash
curl https://your-app-name.herokuapp.com
```

### 2. View Logs
```bash
heroku logs --tail
```

### 3. Update Frontend
Edit `Bumbee-expo-app/.env`:
```env
EXPO_PUBLIC_API_URL=https://your-app-name.herokuapp.com
```

---

## 🔧 Required Environment Variables

**Minimum Required**:
- `NODE_ENV=production`
- `JWT_SECRET` (generate: `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET` (generate: `openssl rand -base64 32`)
- `MONGODB_URI` (your MongoDB connection string)

**Optional** (add as needed):
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_MAPS_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## 🐛 Troubleshooting

### "Application Error"
```bash
heroku logs --tail
```
Check for missing environment variables or startup errors.

### Build Fails
```bash
heroku logs --tail
```
Ensure all dependencies are in `dependencies`, not `devDependencies`.

### Can't Connect to MongoDB
- Whitelist Heroku IPs in MongoDB Atlas (use 0.0.0.0/0 for all IPs)
- Verify `MONGODB_URI` is correct: `heroku config:get MONGODB_URI`

---

## 📚 Full Documentation

For detailed information, see: `HEROKU_DEPLOYMENT_GUIDE.md`

---

## 🎉 Success!

Your backend is now live at: `https://your-app-name.herokuapp.com`
