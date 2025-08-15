import { Handler } from '@netlify/functions';

// Simple in-memory storage for demo
const bookings: any[] = [];

// Content data to match local server
const contentData = [
  { id: "4udcea03q9p", key: "benefits_content", title: "Benefits Content", content: "Muscle Toning and Strengthening: Sculpting exercises with weights and resistance bands to build lean muscle mass and improve muscle definition.<br/><br/>Cardio improvement: Utilizing time-under-tension throughout training to ensure maximum muscle exertion while maintaining flexibility.<br/><br/>A good option for individuals with joint sensitivities or those seeking a gentler approach to fitness.", updatedAt: "2025-08-15T03:54:16.745Z" },
  { id: "23mgkrhu4ht", key: "brought_to_you_by", title: "Brought to you by", content: "• BeFitBalance with Jess • C.P.S Coffee • Makkha Health & Spa BKK • Sunshine Market", updatedAt: "2025-08-15T03:59:45.539Z" },
  { id: "c9ba9d3a-3abf-4df8-8642-b687312cee7e", key: "contact_email", title: "Contact Email", content: "collective.tonelab@gmail.com", updatedAt: "2025-08-15T03:51:24.214Z" },
  { id: "33cf6208-8ce6-4e39-bff0-1605cc182dbf", key: "early_bird_price", title: "Early Bird Price", content: "฿890", updatedAt: "2025-08-15T03:25:19.759Z" },
  { id: "ad4da994-d0af-4cfe-8380-71bc7d4a97c3", key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn", updatedAt: "2025-08-15T03:25:19.560Z" },
  { id: "a0b6273f-d17f-4b76-9c56-bb164f349cca", key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab", updatedAt: "2025-08-15T03:25:19.408Z" },
  { id: "070bef65-90d3-43d9-a325-2d45e3ef7f2f", key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation.", updatedAt: "2025-08-15T03:25:19.489Z" },
  { id: "30363325-3383-4d3c-ae80-aa82bf9ec9b4", key: "regular_price", title: "Regular Price", content: "฿1,190", updatedAt: "2025-08-15T03:25:19.825Z" }
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
};

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api-simple', '') || '/';
    const method = event.httpMethod;

    console.log(`${method} ${path}`);

    // Content endpoint
    if (method === 'GET' && path === '/api/content/public') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      };
    }

    // Booking endpoint - simplified
    if (method === 'POST' && path === '/api/bookings') {
      const body = JSON.parse(event.body || '{}');
      
      const booking = {
        id: Date.now().toString(),
        fullName: body.fullName,
        email: body.email,
        telephone: body.telephone,
        receiptPath: body.receiptPath,
        earlyBirdConfirmed: body.earlyBirdConfirmed,
        cancellationPolicyAccepted: body.cancellationPolicyAccepted,
        createdAt: new Date().toISOString()
      };
      
      bookings.push(booking);

      // Simple email notification without await
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '9f4058e1-70c7-48b0-ba8d-8d52c5339371',
          subject: `New Tonelab Booking: ${booking.fullName}`,
          from_name: 'Tonelab Booking System',
          email: 'collective.tonelab@gmail.com',
          message: `New booking: ${booking.fullName} (${booking.email}) - ID: ${booking.id}`
        })
      }).catch(err => console.log('Email failed:', err));

      return {
        statusCode: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          booking: {
            id: booking.id,
            fullName: booking.fullName,
            email: booking.email,
            createdAt: booking.createdAt
          }
        })
      };
    }

    // Admin login
    if (method === 'POST' && path === '/api/admin/login') {
      const body = JSON.parse(event.body || '{}');
      if (body.password === "tonelab2025") {
        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true })
        };
      } else {
        return {
          statusCode: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: "Invalid password" })
        };
      }
    }

    // Bookings list
    if (method === 'GET' && path === '/api/bookings') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(bookings)
      };
    }

    // Default 404
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found', path, method })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};