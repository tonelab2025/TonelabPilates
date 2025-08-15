import { Handler } from "@netlify/functions";

// Simple in-memory storage for Netlify
interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  receiptPath?: string;
  createdAt: string;
}

interface ContentItem {
  id: string;
  key: string;
  title: string;
  content: string;
  updatedAt: string;
}

let bookings: Booking[] = [];
let content: ContentItem[] = [
  { id: "1", key: "venue_name", title: "Venue Name", content: "Asoke Sports Club", updatedAt: new Date().toISOString() },
  { id: "2", key: "venue_address", title: "Venue Address", content: "123 Fitness Street", updatedAt: new Date().toISOString() },
  { id: "3", key: "google_maps_url", title: "Google Maps URL", content: "https://maps.google.com", updatedAt: new Date().toISOString() }
];

// Add CORS headers to all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
};

export const handler: Handler = async (event, context) => {
  try {
    // Create a mock request object for Express
    const req = {
      method: event.httpMethod,
      url: event.path + (event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : ''),
      headers: event.headers,
      body: event.body ? JSON.parse(event.body) : undefined,
      params: {},
      query: event.queryStringParameters || {}
    };

    const res = {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: '',
      json: function(data: any) {
        this.body = JSON.stringify(data);
        return this;
      },
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      header: function(key: string, value: string) {
        this.headers[key] = value;
        return this;
      },
      sendStatus: function(code: number) {
        this.statusCode = code;
        this.body = '';
        return this;
      }
    };

    // Handle routes manually for Netlify
    const path = event.path.replace('/.netlify/functions/api', '') || '/';
    const method = event.httpMethod;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    if (method === 'GET' && path === '/api/content/public') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      };
    }

    if (method === 'POST' && path === '/api/bookings') {
      const booking: Booking = {
        id: Date.now().toString(),
        ...JSON.parse(event.body || '{}'),
        createdAt: new Date().toISOString()
      };
      bookings.push(booking);
      
      // Send email notification
      try {
        const emailData = {
          access_key: '9f4058e1-70c7-48b0-ba8d-8d52c5339371',
          subject: 'New Pilates Booking - Tonelab',
          from_name: 'Tonelab Pilates System',
          to: 'collective.tonelab@gmail.com',
          message: `New booking received!\n\nName: ${booking.firstName} ${booking.lastName}\nEmail: ${booking.email}\nPhone: ${booking.phone}\nBooking ID: ${booking.id}\nDate: ${new Date(booking.createdAt).toLocaleString()}`
        };
        
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData)
        });
      } catch (error) {
        console.error('Email error:', error);
      }
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      };
    }

    if (method === 'GET' && path === '/api/bookings') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(bookings)
      };
    }

    if (method === 'DELETE' && path.startsWith('/api/bookings/')) {
      const id = path.split('/').pop();
      const index = bookings.findIndex(b => b.id === id);
      if (index > -1) {
        bookings.splice(index, 1);
        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true })
        };
      } else {
        return {
          statusCode: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: "Booking not found" })
        };
      }
    }

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

    if (method === 'PUT' && path.startsWith('/api/content/')) {
      const id = path.split('/').pop();
      const item = content.find(c => c.id === id);
      if (item) {
        const body = JSON.parse(event.body || '{}');
        item.content = body.content;
        item.updatedAt = new Date().toISOString();
        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        };
      } else {
        return {
          statusCode: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: "Content not found" })
        };
      }
    }

    if (method === 'GET' && path === '/api/admin/stats') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalBookings: bookings.length,
          recentBookings: bookings.slice(-5),
          lastBookingDate: bookings.length > 0 ? bookings[bookings.length - 1].createdAt : null
        })
      };
    }

    if (method === 'POST' && path === '/api/upload/receipt') {
      const mockFileUrl = `https://tonelabs.netlify.app/uploads/receipt-${Date.now()}.jpg`;
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          fileUrl: mockFileUrl,
          message: "Receipt uploaded successfully" 
        })
      };
    }

    if (method === 'GET' && path === '/api/upload/config') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxFileSize: 10 * 1024 * 1024,
          allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
          uploadEndpoint: '/api/upload/receipt'
        })
      };
    }

    // Default 404
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'API endpoint not found', 
        path: path,
        method: method 
      })
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};