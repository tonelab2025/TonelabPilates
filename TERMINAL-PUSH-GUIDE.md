# Push to GitHub from Terminal

## Step 1: Navigate to Your Project Folder

```bash
# Go to your downloads folder
cd ~/Downloads

# Find your extracted project folder (might be named something like 'workspace' or 'PilatesBooking')
ls -la

# Enter the project folder
cd [your-project-folder-name]
```

## Step 2: Initialize Git and Push

```bash
# Initialize git repository
git init

# Add your GitHub repository as remote
git remote add origin https://github.com/tonelab2025/PilatesBooking.git

# Add all files except large folders (use .gitignore)
git add .

# Commit your changes
git commit -m "Complete Tonelab Pilates booking platform with Google Sheets integration"

# Push to GitHub (this will create the main branch)
git push -u origin main
```

## Step 3: If You Need Authentication

If it asks for authentication, you have two options:

**Option A: Personal Access Token**
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
2. Generate new token with repo permissions
3. Use your GitHub username and the token as password when prompted

**Option B: GitHub CLI (if installed)**
```bash
gh auth login
```

## Step 4: After Successful Push

1. Go to your GitHub repository: https://github.com/tonelab2025/PilatesBooking
2. Verify all files are there
3. Deploy to Netlify using your GitHub repo

## Common Commands if Needed

```bash
# Check current directory
pwd

# List files
ls -la

# Check git status
git status

# Check remotes
git remote -v
```

Your booking platform will be live once pushed to GitHub and deployed to Netlify!