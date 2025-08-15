# Tonelab Pilates - Netlify Deployment Guide

## Prerequisites

1. **Google Sheets Setup**
   - Create a new Google Sheet
   - Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Set up Google Sheets API access (instructions below)

2. **Google Sheets API Credentials**
   - Go to Google Cloud Console
   - Create a new project or select existing one
   - Enable Google Sheets API
   - Create Service Account credentials
   - Download the JSON credentials file

3. **SendGrid Account**
   - Sign up at SendGrid
   - Create an API key
   - Verify sender email

## Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"..."}
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

## Deployment Steps

### 1. Fork/Clone this repository to your GitHub

### 2. Connect to Netlify
- Go to [Netlify](https://netlify.com)
- Click "New site from Git"
- Connect your GitHub repo
- Use these build settings:
  - **Build command**: `npm run build`
  - **Publish directory**: `dist`
  - **Functions directory**: `netlify/functions`

### 3. Set Environment Variables
In Netlify Dashboard:
- Go to Site Settings → Environment Variables
- Add all the environment variables listed above

### 4. Deploy
- Click "Deploy Site"
- Your site will be available at `https://yoursite.netlify.app`

## Features

✅ **Free Hosting**: Completely free on Netlify  
✅ **Google Sheets Database**: All booking data stored in Google Sheets  
✅ **Email Notifications**: SendGrid integration for booking confirmations  
✅ **Mobile Optimized**: Responsive design for all devices  
✅ **Receipt Uploads**: File upload system (configure cloud storage)  
✅ **Admin Dashboard**: Staff can view all bookings and receipts  
✅ **Duplicate Prevention**: Email validation prevents double bookings  

## Google Sheets Setup Guide

1. **Create Google Service Account**:
   ```bash
   # Go to Google Cloud Console
   # APIs & Services → Credentials → Create Credentials → Service Account
   # Download the JSON key file
   ```

2. **Share Google Sheet**:
   - Copy the "client_email" from your service account JSON
   - Share your Google Sheet with this email address
   - Give "Editor" permissions

3. **Environment Variable**:
   - Copy the entire JSON content
   - Paste as `GOOGLE_SHEETS_CREDENTIALS` in Netlify

## Cost Breakdown

| Service | Cost |
|---------|------|
| **Netlify Hosting** | Free |
| **Google Sheets** | Free |
| **SendGrid** | Free (100 emails/day) |
| **Total** | **$0/month** |

## Support

- Admin password: `tonelab2025`
- Google Sheets will automatically create headers on first booking
- All booking data is stored in real-time in your Google Sheet

Perfect for small businesses and events with up to 100 bookings per month!