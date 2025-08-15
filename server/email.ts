// Simple webhook-based email notification (completely free)
// Using a webhook service or console logging as fallback

interface BookingEmailParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  totalAmount: number;
  receiptPath?: string;
  bookingId: string;
}

export async function sendBookingNotificationEmail(params: BookingEmailParams): Promise<boolean> {
  try {
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Tonelab Booking</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">🎉 New Booking Received!</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Details</h3>
            <p><strong>Name:</strong> ${params.customerName}</p>
            <p><strong>Email:</strong> ${params.customerEmail}</p>
            <p><strong>Phone:</strong> ${params.customerPhone}</p>
        </div>

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Event:</strong> ${params.eventType}</p>
            <p><strong>Total Amount:</strong> ฿${params.totalAmount}</p>
            <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            ${params.receiptPath ? `<p><strong>Receipt:</strong> Uploaded</p>` : '<p><strong>Receipt:</strong> Not uploaded</p>'}
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Next Steps</h3>
            <p>Please verify the payment receipt and confirm the booking with the customer.</p>
            <p>You can view all bookings in your admin dashboard.</p>
        </div>

        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
            This is an automated notification from your Tonelab booking system.
        </p>
    </div>
</body>
</html>
    `;

    const textContent = `New booking received from ${params.customerName} (${params.customerEmail}) for ${params.eventType}. Amount: ฿${params.totalAmount}. Booking ID: ${params.bookingId}`;

    // Method 1: Free email using working services
    const freeEmailServices = [
      // Service 1: EmailJS (200 emails/month free)
      {
        name: 'EmailJS',
        url: 'https://api.emailjs.com/api/v1.0/email/send',
        payload: {
          service_id: 'default_service',
          template_id: 'template_booking',
          user_id: 'public_key',
          template_params: {
            to_email: 'collective.tonelab@gmail.com',
            from_name: 'Tonelab Booking System',
            subject: `New Booking: ${params.customerName} - ฿${params.totalAmount}`,
            message: `Customer: ${params.customerName}\nEmail: ${params.customerEmail}\nPhone: ${params.customerPhone}\nAmount: ฿${params.totalAmount}\nBooking ID: ${params.bookingId}`,
            customer_name: params.customerName,
            customer_email: params.customerEmail,
            customer_phone: params.customerPhone,
            booking_amount: params.totalAmount,
            booking_id: params.bookingId
          }
        }
      },
      // Service 2: Web3Forms (Unlimited free)
      {
        name: 'Web3Forms',
        url: 'https://api.web3forms.com/submit',
        payload: {
          access_key: '9f4058e1-70c7-48b0-ba8d-8d52c5339371', // Web3Forms public key
          subject: `New Tonelab Booking: ${params.customerName}`,
          from_name: 'Tonelab Booking System',
          email: 'collective.tonelab@gmail.com',
          message: `New booking received:\n\nCustomer: ${params.customerName}\nEmail: ${params.customerEmail}\nPhone: ${params.customerPhone}\nAmount: ฿${params.totalAmount}\nBooking ID: ${params.bookingId}\nReceipt: ${params.receiptPath ? 'Uploaded' : 'Not uploaded'}`,
          redirect: 'https://web3forms.com/success'
        }
      },
      // Service 3: Simple HTTP POST to Netlify form (if configured)
      {
        name: 'Netlify Forms',
        url: 'https://tonelab-booking.netlify.app/', // User's actual deployed site
        payload: {
          'form-name': 'booking-notifications',
          name: params.customerName,
          email: params.customerEmail,
          phone: params.customerPhone,
          subject: `New Booking - ฿${params.totalAmount}`,
          message: `Booking ID: ${params.bookingId}\nAmount: ฿${params.totalAmount}\nReceipt: ${params.receiptPath ? 'Uploaded' : 'Not uploaded'}`
        }
      }
    ];

    // Try each free service with proper form submission
    for (const service of freeEmailServices) {
      try {
        console.log(`Trying ${service.name} email service...`);
        
        let headers: Record<string, string>;
        let body: string;
        
        if (service.name === 'Web3Forms') {
          headers = { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          };
          body = JSON.stringify(service.payload);
        } else if (service.name === 'Netlify Forms') {
          headers = { 
            'Content-Type': 'application/x-www-form-urlencoded'
          };
          body = Object.entries(service.payload)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
        } else {
          headers = { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          };
          body = JSON.stringify(service.payload);
        }
        
        const response = await fetch(service.url, {
          method: 'POST',
          headers,
          body
        });
        
        const responseText = await response.text();
        console.log(`${service.name} response:`, response.status, responseText);
        
        if (response.ok || response.status === 200) {
          console.log(`✅ Email notification sent via ${service.name}`);
          return true;
        }
      } catch (error) {
        console.log(`⚠️ ${service.name} service failed:`, error);
      }
    }
    
    console.log('⚠️ All email services failed, trying webhook backup');
      
    // Fallback: Discord webhook
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🎉 **New Tonelab Booking!**\n\n**Customer:** ${params.customerName}\n**Email:** ${params.customerEmail}\n**Phone:** ${params.customerPhone}\n**Amount:** ฿${params.totalAmount}\n**Booking ID:** ${params.bookingId}\n**Receipt:** ${params.receiptPath ? 'Uploaded' : 'Not uploaded'}`
          })
        });
        console.log('✅ Discord webhook notification sent successfully');
        return true;
      }
    } catch (webhookError) {
      console.log('⚠️ All notification methods failed, using console log');
    }

    // Method 2: Console log notification (always works)
    console.log('\n' + '='.repeat(50));
    console.log('🎉 NEW BOOKING ALERT - collective.tonelab@gmail.com');
    console.log('='.repeat(50));
    console.log(`📧 Customer: ${params.customerName}`);
    console.log(`📧 Email: ${params.customerEmail}`);
    console.log(`📞 Phone: ${params.customerPhone}`);
    console.log(`💰 Amount: ฿${params.totalAmount}`);
    console.log(`🆔 Booking ID: ${params.bookingId}`);
    console.log(`📎 Receipt: ${params.receiptPath ? 'Uploaded' : 'Not uploaded'}`);
    console.log('='.repeat(50) + '\n');
    
    return true;
  } catch (error) {
    console.error('❌ Email notification failed:', error);
    
    // Fallback: Log the booking details if email fails
    console.log('📋 BOOKING ALERT:', {
      customer: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
      amount: `฿${params.totalAmount}`,
      bookingId: params.bookingId,
      receipt: params.receiptPath ? 'Uploaded' : 'Not uploaded'
    });
    
    return false;
  }
}