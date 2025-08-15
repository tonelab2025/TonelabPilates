# Connect Replit to GitHub Repository

## Step 1: Configure Remote Repository in Replit

1. **Click on "Settings view"** (as mentioned in the orange banner in your screenshot)
2. **In the Settings panel, look for Git/GitHub settings**
3. **Add remote repository URL:** `https://github.com/tonelab2025/PilatesBooking.git`

## Step 2: Alternative - Manual GitHub Setup

Since you see "No remote repositories configured", try this:

1. **Go to Replit Shell (not the Git panel)**
2. **Run these commands one by one:**
   ```bash
   # Check current status
   pwd
   ls -la
   
   # Initialize fresh git (if needed)
   rm -rf .git/config.lock
   git init
   
   # Add your repository
   git remote add origin https://github.com/tonelab2025/PilatesBooking.git
   
   # Stage all files
   git add .
   
   # Commit
   git commit -m "Complete Tonelab Pilates booking platform"
   
   # Push to GitHub
   git push -u origin main
   ```

## Step 3: If Git Commands Fail

**Download and Upload Manually:**

1. **In Replit**: Click the three dots menu → "Download as ZIP"
2. **Extract the ZIP** on your computer
3. **Go to GitHub.com** → Your PilatesBooking repository
4. **Upload files**: Click "Add file" → "Upload files" → Drag all files from the extracted folder
5. **Commit**: Add message "Complete Tonelab Pilates booking platform" → "Commit changes"

## Step 4: After Code is on GitHub

1. **Go to Netlify.com**
2. **New site from Git** → Connect GitHub → Select PilatesBooking repo
3. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Add environment variables** (from DEPLOYMENT-GUIDE.md)

## Your Repository Details

- **GitHub URL**: https://github.com/tonelab2025/PilatesBooking
- **Branch**: main
- **All files ready**: ✅ Complete booking platform with admin dashboard

The platform will be live once deployed!