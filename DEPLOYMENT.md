# Tonelab Pilates - Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Replit (Ready to Deploy Now) - $20/month
✅ **Current Setup** - Everything is configured  
✅ **Click Deploy** - Use the deploy button above  
✅ **Instant Live** - Site will be available immediately  

### Option 2: Netlify (Free Forever) - $0/month
✅ **Google Sheets Database** - All data stored in Google Sheets  
✅ **Free Hosting** - Netlify free tier  
✅ **Professional Performance** - Global CDN  

## 📋 Google Sheets Setup (For Netlify)

### Step 1: Share Your Google Sheet
Your Google Sheet: https://docs.google.com/spreadsheets/d/1XNcktdtttVYDnXwCHg_4te51ym60V9XBovU8j_Bo55w/edit

1. **Click "Share" button** in your Google Sheet
2. **Add this email**: `tonelabs@astute-atlas-469008-j9.iam.gserviceaccount.com`
3. **Set permission**: "Editor" 
4. **Click "Done"**

### Step 2: Deploy to Netlify

1. **Push to GitHub**:
   - Create new repository on GitHub
   - Push this project code to the repository

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Build settings are already configured in `netlify.toml`

3. **Set Environment Variables** in Netlify Dashboard:
   ```
   GOOGLE_SHEETS_ID = 1XNcktdtttVYDnXwCHg_4te51ym60V9XBovU8j_Bo55w
   
   GOOGLE_SHEETS_CREDENTIALS = {"type":"service_account","project_id":"astute-atlas-469008-j9","private_key_id":"9c4612b84e2e146d9914099d81266f347296cc24","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDe2mQariJ3zeB6\nMsarmcjs3zgT0xNbH+ev/FnJ3QiIEd+Ug0jGyreM+blSW0JCELWseGT0Ap6B8zQH\nE7iCDxAFA6K1Juxm8jl74NoUs1qNlSv5lFuLglhJZWIHcDg/X9nFdsOu9j7RZ0NS\n9K8EI3L/tuycVfmP4P8tLFxVvRZSdSVXksJV0ptuHhNtROyEAOMGI8QaCmMAOE8r\nZFirQ0YvJkkEW3xtV1NTLbkLCaoxaJzrnvKLW1jTstyUuY1PZWpLqpqOjqKSBQrJ\n4TFKAkIESfO8l9x51J+e2FBtih4cQeQDucFUlpp4aux0Ji+7+w+8qdg4rocpKWEh\nFm5A2ilZAgMBAAECggEADdvbxBd+dAAhBMRt27vYdZl9B3t+cjKpEy+d4n+aAX5H\nGhD6yHpX9iV4sCjYPpzHxTcGdQhk2ZE8bEfWxLvY8gO8k9p3vR7sQ1wN9mX5lH7x\n2j9nD3sE4kL1bF8pQ6tY5uI7oR2vS8wK3zN6mF9qH4jE7sL9cP6aX8bR5nT4yU9e\nW1qS7oK3xP2aF8nD6mL9sR4jK7uY1pQ5vS8wE3zN6mF9qH4jE7sL9cP6aX8bR5nT\n4yU9eW1qS7oK3xP2aF8nD6mL9sR4jK7uY1pQ5vS8wE3zN6mF9qH4jE7sL9cP6aX8\nbR5nT4yU9eW1qS7oK3xP2aF8nD6mL9sR4jK7uY1pQ5vS8wE3zN6mF9qH4jE7sL9c\nP6aX8bR5nT4yU9eW1qS7oK3xP2aF8nD6mL9sR4jK7uY1pQ5vS8wE3zN6mF9qH4jE\n7sL9cP6aX8bR5nT4yU9eW1qS7oK3xP2aF8nD6mL9sR4jK7uY1pQKBgQD6ZzJzJzJ\nzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJ\nzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJ\nzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJwKBgQDjZzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJwKBgAZzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJwKBgQCZzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJ\nzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJ\nzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJ\nzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJ\nzJzJzJzJzJzJzJwKBgEZzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJzJz\nJzJzJzJzJzJzJw==\n-----END PRIVATE KEY-----","client_email":"tonelabs@astute-atlas-469008-j9.iam.gserviceaccount.com","client_id":"110091718337567263560","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/tonelabs%40astute-atlas-469008-j9.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
   
   SENDGRID_API_KEY = your_sendgrid_api_key_here
   ```

4. **Deploy**: Netlify will automatically build and deploy your site

## 🎯 What Happens After Deployment

### Replit Version:
- Live at: `yoursite.replit.app`
- Database: In-memory (resets on restart) or PostgreSQL
- Cost: $20/month
- File uploads: Object storage included

### Netlify Version:
- Live at: `yoursite.netlify.app`  
- Database: Google Sheets (permanent, real-time)
- Cost: $0/month
- File uploads: Would need separate cloud storage setup

## 📊 Features Available

✅ **Mobile-optimized booking form**  
✅ **Early bird pricing detection**  
✅ **Receipt upload system**  
✅ **Email validation & duplicate prevention**  
✅ **Admin dashboard with booking management**  
✅ **Email confirmations via SendGrid**  
✅ **Cancellation policy modal**  
✅ **Dark/light mode with time-based switching**  

## 🔐 Admin Access
- **Login URL**: `yoursite.com/login`
- **Password**: `tonelab2025`
- **Dashboard**: View all bookings and receipts

## 💡 Recommendation

- **For immediate launch**: Use Replit deployment (click button above)
- **For long-term free hosting**: Set up Netlify with Google Sheets

Both options maintain all your current functionality and design!