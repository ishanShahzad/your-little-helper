#!/bin/bash

# Bumbee Backend - Heroku Deployment Script
# This script automates the deployment process to Heroku

set -e  # Exit on error

echo "🐝 Bumbee Backend - Heroku Deployment"
echo "======================================"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Error: Heroku CLI is not installed"
    echo "Install it from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Error: Not logged in to Heroku"
    echo "Run: heroku login"
    exit 1
fi

# Get app name
read -p "Enter your Heroku app name (or press Enter to create new): " APP_NAME

if [ -z "$APP_NAME" ]; then
    echo "Creating new Heroku app..."
    heroku create
    APP_NAME=$(heroku apps:info --json | grep -o '"name":"[^"]*' | cut -d'"' -f4)
    echo "✅ Created app: $APP_NAME"
else
    # Check if app exists
    if heroku apps:info --app "$APP_NAME" &> /dev/null; then
        echo "✅ Using existing app: $APP_NAME"
    else
        echo "Creating app: $APP_NAME"
        heroku create "$APP_NAME"
        echo "✅ Created app: $APP_NAME"
    fi
fi

echo ""
echo "📝 Setting up environment variables..."
echo "You'll need to provide the following:"
echo ""

# JWT Secret
read -sp "JWT_SECRET (press Enter to generate): " JWT_SECRET
echo ""
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "✅ Generated JWT_SECRET"
fi

# JWT Refresh Secret
read -sp "JWT_REFRESH_SECRET (press Enter to generate): " JWT_REFRESH_SECRET
echo ""
if [ -z "$JWT_REFRESH_SECRET" ]; then
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    echo "✅ Generated JWT_REFRESH_SECRET"
fi

# MongoDB URI
read -p "MONGODB_URI: " MONGODB_URI
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MongoDB URI is required"
    exit 1
fi

echo ""
echo "Setting environment variables on Heroku..."

heroku config:set \
    NODE_ENV=production \
    JWT_SECRET="$JWT_SECRET" \
    JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
    JWT_EXPIRES_IN=15m \
    JWT_REFRESH_EXPIRES_IN=30d \
    MONGODB_URI="$MONGODB_URI" \
    --app "$APP_NAME"

echo "✅ Environment variables set"

# Optional: Ask for additional configs
echo ""
read -p "Do you want to set Facebook OAuth credentials? (y/n): " SET_FACEBOOK
if [ "$SET_FACEBOOK" = "y" ]; then
    read -p "FACEBOOK_APP_ID: " FACEBOOK_APP_ID
    read -p "FACEBOOK_APP_SECRET: " FACEBOOK_APP_SECRET
    heroku config:set \
        FACEBOOK_APP_ID="$FACEBOOK_APP_ID" \
        FACEBOOK_APP_SECRET="$FACEBOOK_APP_SECRET" \
        --app "$APP_NAME"
    echo "✅ Facebook OAuth configured"
fi

echo ""
read -p "Do you want to set Stripe credentials? (y/n): " SET_STRIPE
if [ "$SET_STRIPE" = "y" ]; then
    read -p "STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
    read -p "STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET
    heroku config:set \
        STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
        STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
        --app "$APP_NAME"
    echo "✅ Stripe configured"
fi

echo ""
echo "🚀 Deploying to Heroku..."

# Check if we're in a git repo
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for Heroku deployment"
fi

# Add Heroku remote if not exists
if ! git remote | grep -q heroku; then
    heroku git:remote --app "$APP_NAME"
fi

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Pushing to Heroku from branch: $BRANCH"
git push heroku "$BRANCH:main" --force

echo ""
echo "📊 Scaling web dyno..."
heroku ps:scale web=1 --app "$APP_NAME"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is live at: https://$APP_NAME.herokuapp.com"
echo ""
echo "📋 Useful commands:"
echo "  View logs:    heroku logs --tail --app $APP_NAME"
echo "  Open app:     heroku open --app $APP_NAME"
echo "  View config:  heroku config --app $APP_NAME"
echo "  Restart app:  heroku restart --app $APP_NAME"
echo ""
echo "🔗 Update your frontend .env file:"
echo "  EXPO_PUBLIC_API_URL=https://$APP_NAME.herokuapp.com"
echo ""
