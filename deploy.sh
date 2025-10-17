#!/bin/bash

echo "🚀 Starting Vercel deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Install API dependencies
echo "📦 Installing API dependencies..."
cd api
npm install
cd ..

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo ""
echo "🔧 Don't forget to set up your environment variables in Vercel Dashboard:"
echo "   - GROQ_API_KEY"
echo "   - DATABASE_URL (for production database)"
echo "   - JWT_SECRET"
echo "   - ENCRYPTION_KEY"
echo ""
echo "🌍 Your app will be available at the provided Vercel URL"
