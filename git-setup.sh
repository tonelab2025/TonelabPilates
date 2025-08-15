#!/bin/bash

# Git setup script for Replit to connect to GitHub repository

echo "Setting up Git remote for PilatesBooking repository..."

# Remove any existing remote
git remote remove origin 2>/dev/null || true

# Add the correct remote
git remote add origin https://github.com/tonelab2025/PilatesBooking.git

# Verify the remote was added
git remote -v

# Set the upstream branch
git branch --set-upstream-to=origin/main main

echo "Git remote configured successfully!"
echo "Repository: https://github.com/tonelab2025/PilatesBooking.git"