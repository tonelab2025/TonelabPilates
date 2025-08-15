# How to Push Your Code to GitHub from Replit

## Method 1: Use Replit's Git Panel (Easiest)

1. **Open Git Panel**: Look for the Git icon (branch symbol) in the left sidebar
2. **Stage Files**: Check all the files you want to include
3. **Commit Message**: Write "Initial commit: Tonelab Pilates booking platform"
4. **Commit & Push**: Click the commit button, then push to GitHub

## Method 2: If Git Panel Doesn't Work

You can try these commands in Replit's Shell:

```bash
# Check if you're connected to GitHub
git remote -v

# If no remote is shown, add it (replace with your actual repo URL)
git remote add origin https://github.com/tonelab2025/booking.git

# Stage all files
git add .

# Commit with message
git commit -m "Initial commit: Tonelab Pilates booking platform"

# Push to GitHub
git push -u origin main
```

## Your Repository Details

- **GitHub URL**: https://github.com/tonelab2025/PilatesBooking
- **Branch**: main
- **All files are ready** for deployment

## After Pushing to GitHub

1. Go to Netlify.com
2. Create new site from Git
3. Connect your GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables (see DEPLOYMENT-GUIDE.md)

Your booking platform will be live!