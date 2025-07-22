#!/bin/bash

# Git push script for SacralTrack repository
# This script will push the People page enhancements to GitHub

set -e  # Exit on any error

echo "🚀 Starting push to SacralTrack repository..."

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository directory"
    exit 1
fi

# Add the sacraltrack remote if it doesn't exist
if ! git remote get-url sacraltrack > /dev/null 2>&1; then
    echo "📡 Adding sacraltrack remote repository..."
    git remote add sacraltrack https://github.com/sacraltrack/sacraltrack.git
else
    echo "✅ SacralTrack remote already exists"
fi

# Show current remotes
echo "📋 Current remotes:"
git remote -v | grep sacraltrack

# Add the specific files we modified
echo "📁 Adding modified files..."
git add app/people/page.tsx
git add app/people/styles.module.css
git add app/components/ui/DefaultAvatar.tsx

# Check git status
echo "📊 Git status:"
git status --short

# Create commit with detailed message
echo "💾 Creating commit..."
git commit -m "feat: enhance people page with full-size avatars and improved UX

✨ Features:
- Avatars now cover full card width/height as background
- 5px padding from card edges for all content
- Show real database stats (ratings, friends count)
- Remove likes indicator as requested
- Simple default avatar without animations
- Translate 'Show Full Top 100' button to English
- Cards scroll to screen edge on mobile (removed bottom strip)

🎨 Improvements:
- Better responsive design for mobile UX
- Optimized card layout with proper spacing
- Clean minimal default avatar design
- Enhanced mobile navigation and scrolling

📱 Mobile Enhancements:
- Cards now scroll under mobile nav to screen edge
- Improved touch interactions
- Better spacing and padding on all devices

🌐 Translations:
- Top ranking modal texts translated to English
- Consistent English interface for all user-facing text"

# Fetch latest changes from sacraltrack (optional, commented out to avoid conflicts)
# echo "⬇️ Fetching latest changes..."
# git fetch sacraltrack main

# Push to sacraltrack repository
echo "🚀 Pushing to SacralTrack repository..."
git push sacraltrack main

echo "✅ Successfully pushed to https://github.com/sacraltrack/sacraltrack"
echo "🎉 People page enhancements are now live!"

# Show the final status
echo ""
echo "📈 Push summary:"
echo "- Enhanced People page with full-size avatars"
echo "- Implemented 5px padding from card edges"
echo "- Show real database statistics (no more likes)"
echo "- Added simple default avatar component"
echo "- Translated UI to English"
echo "- Improved mobile scrolling experience"
echo ""
echo "🔗 Repository: https://github.com/sacraltrack/sacraltrack"
