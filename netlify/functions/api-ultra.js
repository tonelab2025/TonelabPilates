// Ultra-minimal serverless function - zero dependencies, pure JavaScript
exports.handler = async (event, context) => {
  console.log('Request:', event.httpMethod, event.path);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api-ultra', '');
  console.log('Processed path:', path);

  try {
    // Content endpoint
    if (path === '/api/content/public') {
      const content = [
        { id: "1", key: "hero_title", content: "Tune Your Tone with Tonelab" },
        { id: "2", key: "hero_description", content: "Join us for an exclusive Pilates experience" },
        { id: "3", key: "early_bird_price", content: "฿890" },
        { id: "4", key: "regular_price", content: "฿1,190" },
        { id: "5", key: "event_title", content: "Pilates Full Body Sculpt & Burn" },
        { id: "6", key: "venue_name", content: "Asoke Sports Club" },
        { id: "7", key: "venue_address", content: "48 Soi Sukhumvit 16, Bangkok" },
        { id: "8", key: "contact_email", content: "collective.tonelab@gmail.com" },
        { id: "9", key: "event_date", content: "Sunday, 19th January 2025" }
      ];
      return { statusCode: 200, headers, body: JSON.stringify(content) };
    }

    // Admin login
    if (path === '/api/admin/login' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (body.password === 'tonelab2025') {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid password' }) };
    }

    // Admin stats
    if (path === '/api/admin/stats') {
      const stats = {
        totalBookings: 0,
        totalRevenue: 0,
        todayBookings: 0,
        pendingPayments: 0
      };
      return { statusCode: 200, headers, body: JSON.stringify(stats) };
    }

    // Bookings list
    if (path === '/api/bookings') {
      return { statusCode: 200, headers, body: JSON.stringify([]) };
    }

    // Booking submission
    if (path === '/api/bookings' && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      // Send email notification
      const emailData = {
        access_key: '9f4058e1-70c7-48b0-ba8d-8d52c5339371',
        subject: `New Booking: ${body.fullName}`,
        email: 'collective.tonelab@gmail.com',
        message: `Name: ${body.fullName}\nEmail: ${body.email}\nPhone: ${body.telephone}`
      };
      
      // Fire-and-forget email
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      }).catch(() => {});

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true, 
          booking: { id: Date.now().toString(), ...body, createdAt: new Date().toISOString() }
        })
      };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
    
  } catch (error) {
    console.error('Error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Server error', details: error.message }) 
    };
  }
};