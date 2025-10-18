#!/bin/bash

echo "🚀 Sweet Design Hub - Backend Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo -e "${RED}❌ render.yaml not found. Make sure you're in the project root directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment checklist:${NC}"
echo "1. ✅ render.yaml configuration file exists"
echo "2. ⚠️  Make sure you have:"
echo "   - Render account set up"
echo "   - GitHub repository connected to Render"
echo "   - Required environment variables ready:"
echo "     * GROQ_API_KEY"
echo "     * JWT_SECRET (random 32+ character string)"
echo "     * ENCRYPTION_KEY (exactly 32 characters)"
echo "     * CORS_ORIGIN (your Vercel frontend URL)"
echo ""

read -p "Do you have all the required environment variables ready? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📋 Please prepare your environment variables first using:${NC}"
    echo "   deployment/render-env-template.txt"
    echo ""
    echo -e "${YELLOW}🔑 Generate secure keys:${NC}"
    echo "   JWT_SECRET: openssl rand -hex 32"
    echo "   ENCRYPTION_KEY: openssl rand -hex 16"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Ready to deploy!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to https://render.com"
echo "2. Click 'New +' → 'Blueprint'"
echo "3. Connect your GitHub repository"
echo "4. Render will automatically detect render.yaml"
echo "5. Add your environment variables in the Render dashboard"
echo "6. Deploy!"
echo ""
echo -e "${GREEN}💡 Tip: The deployment will take 5-10 minutes. You can monitor progress in the Render dashboard.${NC}"
echo ""
echo -e "${YELLOW}📋 After deployment, test your backend:${NC}"
echo "   curl https://your-service-name.onrender.com/health"
