#!/bin/bash

echo "🌐 Sweet Design Hub - Frontend Deployment Script"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ vercel.json not found. Make sure you're in the project root directory.${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ frontend directory not found.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment checklist:${NC}"
echo "1. ✅ vercel.json configuration file exists"
echo "2. ✅ frontend directory exists"
echo "3. ⚠️  Make sure you have:"
echo "   - Vercel account set up"
echo "   - GitHub repository connected to Vercel"
echo "   - Backend deployed on Render (get the URL)"
echo ""

read -p "Do you have your Render backend URL? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Please deploy your backend first using:${NC}"
    echo "   ./deployment/deploy-backend.sh"
    exit 1
fi

echo ""
read -p "Enter your Render backend URL (e.g., https://your-app.onrender.com): " backend_url

if [ -z "$backend_url" ]; then
    echo -e "${RED}❌ Backend URL is required.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Ready to deploy frontend!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to https://vercel.com"
echo "2. Click 'New Project'"
echo "3. Import your GitHub repository"
echo "4. Vercel will auto-detect the configuration"
echo "5. Add environment variable:"
echo "   REACT_APP_API_URL=${backend_url}"
echo "6. Deploy!"
echo ""
echo -e "${GREEN}💡 Important: After deployment, update your backend CORS settings!${NC}"
echo -e "${YELLOW}In your Render dashboard, update CORS_ORIGIN with your Vercel URL${NC}"
echo ""
echo -e "${YELLOW}📋 After deployment, test your frontend:${NC}"
echo "   Visit your Vercel URL and check if it loads correctly"
