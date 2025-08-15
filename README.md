# Tonelab Pilates Booking Platform

A modern, mobile-first Pilates event booking platform with Google Sheets integration and zero-cost deployment.

## Features

- **Modern Booking Form** - Real-time validation, file upload, payment confirmation
- **Google Sheets Integration** - All bookings automatically saved to Google Sheets
- **Receipt Management** - Organized file storage with Google Drive integration  
- **Admin Dashboard** - Comprehensive booking management and analytics
- **Zero Cost** - Deploys completely free on Netlify with Google services

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, Google Sheets API, Google Drive API
- **Database:** Google Sheets (unlimited storage)
- **File Storage:** Google Drive (15GB free)
- **Hosting:** Netlify (free tier)

## Quick Deploy

1. **Push to GitHub** (replace with your username):
   ```bash
   git remote add origin https://github.com/tonelab2025/PilatesBooking.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy to Netlify:**
   - Go to netlify.com
   - Click "New site from Git" 
   - Select your GitHub repo
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variables in Netlify:**
   ```
   GOOGLE_SHEETS_SPREADSHEET_ID=1XNcktdtttVYDnXwCHg_4te51ym60V9XBovU8j_Bo55w
   ```
   Upload your service account JSON file as `GOOGLE_SERVICE_ACCOUNT_JSON`

## Admin Access

- URL: `/admin/login`
- Password: `tonelab2025`

## Architecture

- **Frontend:** Single-page React application
- **API:** Google Sheets for data storage
- **Files:** Google Drive with organized folder structure
- **Auth:** Session-based admin authentication

Total monthly cost: **$0** 🎉