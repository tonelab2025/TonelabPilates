import { Handler } from '@netlify/functions';

const bookings: any[] = [];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api-minimal', '');

  try {
    if (path === '/api/content/public') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { id: "1", key: "hero_title", content: "Tune Your Tone with Tonelab" },
          { id: "2", key: "hero_description", content: "Join us for an exclusive Pilates experience" },
          { id: "3", key: "early_bird_price", content: "฿890" },
          { id: "4", key: "regular_price", content: "฿1,190" },
          { id: "5", key: "event_title", content: "Pilates Full Body Sculpt & Burn" },
          { id: "6", key: "venue_name", content: "Asoke Sports Club" },
          { id: "7", key: "venue_address", content: "48 Soi Sukhumvit 16, Bangkok" },
          { id: "8", key: "contact_email", content: "collective.tonelab@gmail.com" },
          { id: "9", key: "event_date", content: "Sunday, 19th January 2025" }
        ])
      };
    }

    if (path === '/api/bookings' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const booking = {
        id: Date.now().toString(),
        ...body,
        createdAt: new Date().toISOString()
      };
      bookings.push(booking);

      // Fire-and-forget email
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '9f4058e1-70c7-48b0-ba8d-8d52c5339371',
          subject: `New Booking: ${booking.fullName}`,
          email: 'collective.tonelab@gmail.com',
          message: `Name: ${booking.fullName}\nEmail: ${booking.email}\nPhone: ${booking.telephone}`
        })
      }).catch(() => {});

      return {
        statusCode: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, booking })
      };
    }

    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};