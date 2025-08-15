# Google Forms Setup Guide for Tonelab Pilates

## Why Google Forms is Perfect for Your Booking System

✅ **Built-in File Upload** - Customers upload receipt images directly  
✅ **Automatic Storage** - All data and files saved to your Google Drive  
✅ **Easy Management** - View all bookings and images in one place  
✅ **Free Forever** - No hosting costs or storage limits  
✅ **Mobile Friendly** - Perfect interface for phone users  
✅ **Professional** - Clean, trustworthy Google interface  

## Step-by-Step Setup

### 1. Create Your Google Form

1. Go to [forms.google.com](https://forms.google.com)
2. Click "Create a new form"
3. Title: "Tonelab Pilates - Event Booking"

### 2. Add These Form Fields

**Field 1: Full Name**
- Type: Short answer
- Required: Yes

**Field 2: Email Address**
- Type: Short answer  
- Required: Yes
- Validation: Email

**Field 3: Phone Number**
- Type: Short answer
- Required: Yes

**Field 4: Early Bird Pricing**
- Type: Multiple choice
- Options: "Yes - I qualify for early bird pricing", "No - Regular pricing"
- Required: Yes

**Field 5: Receipt Upload**
- Type: File upload
- Required: Yes
- Accept: Images only
- Max files: 1
- Max size: 10MB

**Field 6: Cancellation Policy**
- Type: Checkbox
- Text: "I have read and accept the no-refund cancellation policy"
- Required: Yes

### 3. Configure Form Settings

1. Click Settings (gear icon)
2. **Responses tab**:
   - ✅ Collect email addresses
   - ✅ Limit to 1 response per person
   - ✅ Edit after submit (if needed)

3. **Presentation tab**:
   - Show progress bar: Yes
   - Shuffle question order: No
   - Custom thank you message: "Thank you for booking! We'll contact you soon to confirm your registration."

### 4. Get Field Entry IDs (Important!)

After creating your form, you need to get the field entry IDs for pre-filling:

1. Click "Send" button → Copy link
2. Open the link in a new browser tab
3. Right-click → "View Page Source" 
4. Search for "entry." to find field IDs like:
   - `entry.123456789` - Full Name field
   - `entry.987654321` - Email field  
   - `entry.456789123` - Phone field
   - `entry.789123456` - Early Bird field
   - `entry.321654987` - Policy field

5. **Update the website code** in `client/src/pages/home.tsx`:
   ```javascript
   // Replace YOUR_GOOGLE_FORMS_ID_HERE with your actual form ID
   const GOOGLE_FORMS_ID = 'YOUR_ACTUAL_FORM_ID';
   
   // Replace these entry IDs with the actual ones from your form
   const params = new URLSearchParams({
     'entry.123456789': data.fullName,      // Replace with actual entry ID
     'entry.987654321': data.email,         // Replace with actual entry ID
     'entry.456789123': data.telephone,     // Replace with actual entry ID
     'entry.789123456': isEarlyBird ? 'Yes - I qualify for early bird pricing (฿690)' : 'No - Regular pricing (฿890)',
     'entry.321654987': 'Yes - I accept the cancellation policy',
   });
   ```

### 5. Test the Integration

1. Submit a test booking on your website
2. Verify it opens Google Forms with pre-filled data
3. Complete the form with receipt upload
4. Check that responses appear in your Google Forms dashboard

## Current Integration: Hybrid Approach ✅

**How it works:**
- Customer fills form on your website (validation, early bird detection)
- Clicks "Continue to Google Forms" 
- Redirected to Google Form with pre-filled data
- Uploads receipt and completes final submission
- **Best of both worlds!**

## Viewing Your Bookings

1. **Responses**: View in Google Forms or linked Google Sheet
2. **Receipt Images**: Automatically saved to your Google Drive
3. **Export Data**: Download as Excel/CSV anytime
4. **Real-time Updates**: See bookings as they come in

## Cost Breakdown

| Service | Cost |
|---------|------|
| Google Forms | Free |
| Google Drive Storage | 15GB Free (expandable) |
| Website Hosting | $0 (Netlify) |
| Email Notifications | $0 (SendGrid free tier) |
| **Total** | **$0/month** |

## Benefits

✅ **Zero Technical Setup** - Google handles everything  
✅ **Professional Image Handling** - Customers see preview, you get full quality  
✅ **Spam Protection** - Google's built-in security  
✅ **Mobile Optimized** - Perfect on all devices  
✅ **Backup Included** - All data safely stored in Google  
✅ **Easy Sharing** - Multiple staff can access responses  

## Next Steps

1. **Create your Google Form** following the field setup above
2. **Get the form ID and entry IDs** using the instructions in step 4
3. **Update the website code** with your actual IDs
4. **Test the complete flow** with a real booking

This hybrid approach gives you enterprise-level functionality at zero cost while being much simpler to set up and manage than custom file upload systems.

## Need Help?

If you have questions about:
- **Finding entry IDs** - Use browser developer tools or "View Source"  
- **Testing the flow** - Try a booking and check if data pre-fills correctly
- **Managing responses** - All bookings appear in Google Forms → Responses tab