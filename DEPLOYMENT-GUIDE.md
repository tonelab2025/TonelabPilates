# Tonelab Pilates Deployment Guide

## Step 1: Push to GitHub

1. **Create the repository on GitHub:**
   - Repository name: `tonelab-pilates-booking`
   - Set it to Public
   - Don't initialize with README (we already have files)

2. **Push your code to GitHub:**
   ```bash
   git remote add origin https://github.com/tonelab2025/PilatesBooking.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Netlify

1. **Go to Netlify.com and sign up/login**

2. **Import from Git:**
   - Click "New site from Git"
   - Choose GitHub
   - Select your `tonelab-pilates-booking` repository

3. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 20

4. **Environment Variables** (Add these in Netlify Dashboard > Site Settings > Environment Variables):

   **Google Sheets Integration:**
   ```
   GOOGLE_SHEETS_SPREADSHEET_ID=1XNcktdtttVYDnXwCHg_4te51ym60V9XBovU8j_Bo55w
   ```

   **Service Account (Create as file upload):**
   - Upload your `astute-atlas-469008-j9-9c4612b84e2e.json` file as `GOOGLE_SERVICE_ACCOUNT_JSON`

   **Database (if using PostgreSQL):**
   ```
   DATABASE_URL=your_neon_database_url_here
   ```

   **Email Service:**
   ```
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   ```

   **Object Storage (Google Cloud Storage):**
   ```
   DEFAULT_OBJECT_STORAGE_BUCKET_ID=your_bucket_id
   PRIVATE_OBJECT_DIR=/.private
   PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket-name/public
   ```

## Step 3: Configure Custom Domain (Optional)

1. **In Netlify Dashboard:**
   - Go to Domain Settings
   - Add custom domain: `tonelabpilates.com` (or your domain)
   - Follow DNS configuration instructions

## Step 4: Test Deployment

1. **Visit your Netlify URL** (will be something like `amazing-app-123456.netlify.app`)

2. **Test Key Features:**
   - Booking form submission
   - Receipt file upload
   - Google Sheets integration
   - Admin dashboard access
   - Payment confirmation flow

## Troubleshooting

**Build Failures:**
- Check Netlify build logs
- Ensure all environment variables are set
- Verify Node.js version is 20

**Google Sheets Not Working:**
- Verify service account has Editor permissions
- Check spreadsheet ID is correct
- Ensure service account JSON is properly uploaded

**File Uploads Not Working:**
- Check Google Cloud Storage bucket permissions
- Verify object storage environment variables

## Zero-Cost Architecture ✅

- **Frontend Hosting:** Netlify (Free tier: 100GB bandwidth)
- **Database:** Google Sheets (Unlimited storage)
- **File Storage:** Google Drive (15GB free)
- **Email:** SendGrid (100 emails/day free)
- **Authentication:** Built-in session management

**Total Monthly Cost: $0** 🎉

## Support

- **Google Sheets:** Automatic sync ensures no data loss
- **File Organization:** Receipts organized by date and booking ID
- **Admin Access:** Password: `tonelab2025`
- **Real-time Updates:** New bookings appear immediately in Google Sheets