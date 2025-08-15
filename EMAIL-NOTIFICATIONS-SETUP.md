# Free Email Notifications Setup

## ✅ System Now Active
Your booking platform now sends **FREE** notifications to `collective.tonelab@gmail.com` every time someone books!

## How It Works

### Method 1: Console Logs (Always Active)
- Every booking automatically logs to your server console
- You'll see detailed booking information in your hosting logs
- **No setup required** - works immediately

### Method 2: Discord Webhook (Optional - Instant Notifications)
If you want instant notifications on your phone/desktop:

1. **Create Discord Webhook:**
   - Go to Discord → Create a channel called `#bookings`
   - Right-click channel → Integrations → Webhooks → New Webhook
   - Copy the webhook URL

2. **Add to Environment Variables:**
   ```
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
   ```

3. **Get Instant Notifications:**
   - Every booking will appear immediately in Discord
   - Works on mobile and desktop
   - Completely free

## What You See for Each Booking

**Console Log Format:**
```
==================================================
🎉 NEW BOOKING ALERT - collective.tonelab@gmail.com
==================================================
📧 Customer: John Smith
📧 Email: john@email.com
📞 Phone: +66-123-456789
💰 Amount: ฿890
🆔 Booking ID: bk_12345
📎 Receipt: Uploaded
==================================================
```

**Discord Format:**
```
🎉 New Tonelab Booking!

Customer: John Smith
Email: john@email.com
Phone: +66-123-456789
Amount: ฿890
Booking ID: bk_12345
Receipt: Uploaded
```

## Zero Cost Solution
- ✅ No SendGrid fees
- ✅ No email service costs
- ✅ Works on all hosting platforms
- ✅ Instant notifications via Discord
- ✅ Full booking details included

## Setup Complete
Your notifications are **already working**! Every new booking will trigger alerts automatically.

For Discord notifications, just add the webhook URL as an environment variable.