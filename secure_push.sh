#!/bin/bash

# Secure Git Push Script for SacralTrack
# Usage: ./secure_push.sh YOUR_GITHUB_TOKEN
# Or set GITHUB_TOKEN environment variable

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 SacralTrack Secure Push Script${NC}"
echo -e "${BLUE}=================================${NC}"

# Get token from parameter or environment variable
if [ -n "$1" ]; then
    GITHUB_TOKEN="$1"
elif [ -n "$GITHUB_TOKEN" ]; then
    echo -e "${GREEN}✅ Using token from environment variable${NC}"
else
    echo -e "${RED}❌ Error: No GitHub token provided${NC}"
    echo -e "${YELLOW}Usage: ./secure_push.sh YOUR_GITHUB_TOKEN${NC}"
    echo -e "${YELLOW}Or set: export GITHUB_TOKEN=your_token${NC}"
    exit 1
fi

# Validate we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

echo -e "${BLUE}📂 Current directory: $(pwd)${NC}"

# Set up authenticated remote URL
REPO_URL="https://${GITHUB_TOKEN}@github.com/sacraltrack/sacraltrack.git"
echo -e "${BLUE}🔗 Setting up secure remote connection...${NC}"

# Remove existing sacraltrack remote if it exists
if git remote get-url sacraltrack > /dev/null 2>&1; then
    git remote remove sacraltrack
    echo -e "${YELLOW}🔄 Removed existing sacraltrack remote${NC}"
fi

# Add new secure remote
git remote add sacraltrack "$REPO_URL"
echo -e "${GREEN}✅ Added secure sacraltrack remote${NC}"

# Show git status
echo -e "${BLUE}📊 Current git status:${NC}"
git status --short

# Add our modified files
echo -e "${BLUE}📁 Adding modified files...${NC}"
git add app/people/page.tsx
git add app/people/styles.module.css
git add app/components/ui/DefaultAvatar.tsx

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    exit 0
fi

# Create detailed commit
echo -e "${BLUE}💾 Creating commit...${NC}"
git commit -m "feat: enhance people page with full-size avatars and improved UX

✨ Major Features:
- Full-size avatars covering entire card background
- 5px precise padding from all card edges
- Real database statistics (ratings, friends count)
- Removed likes indicator per requirements
- Simple default avatar without animations
- English translations for all UI elements

🎨 UI/UX Improvements:
- Cards now scroll to screen edge on mobile
- Enhanced responsive design for all devices
- Better touch interactions and hover effects
- Optimized card layout and spacing
- Clean minimal design for default avatars

📱 Mobile Enhancements:
- Removed bottom strip for edge-to-edge scrolling
- Improved mobile navigation positioning
- Better scroll performance and touch handling
- Enhanced mobile user experience

🌐 Localization:
- 'Show Full Top 100' button in English
- Top ranking modal texts translated
- Consistent English interface

🔧 Technical:
- Created DefaultAvatar component
- Updated CSS for mobile responsiveness
- Optimized database queries for real stats
- Improved component performance and caching"

# Push to GitHub
echo -e "${BLUE}🚀 Pushing to SacralTrack repository...${NC}"
if git push sacraltrack main; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo -e "${GREEN}🎉 People page enhancements are now live!${NC}"
else
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi

# Clean up - remove the remote with token for security
git remote remove sacraltrack
echo -e "${YELLOW}🔒 Removed remote with token for security${NC}"

# Success summary
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}🎯 Push Summary:${NC}"
echo -e "${GREEN}✓ Enhanced People page with full-size avatars${NC}"
echo -e "${GREEN}✓ Implemented 5px padding from card edges${NC}"
echo -e "${GREEN}✓ Show real database statistics${NC}"
echo -e "${GREEN}✓ Added simple default avatar component${NC}"
echo -e "${GREEN}✓ Translated UI elements to English${NC}"
echo -e "${GREEN}✓ Improved mobile scrolling experience${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "${BLUE}🔗 Repository: https://github.com/sacraltrack/sacraltrack${NC}"
echo -e "${BLUE}📱 Your People page enhancements are now live!${NC}"
