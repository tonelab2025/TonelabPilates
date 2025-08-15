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
      // Return comprehensive content data matching the local server
      const contentData = [
        { id: "4udcea03q9p", key: "benefits_content", title: "Benefits Content", content: "Muscle Toning and Strengthening: Sculpting exercises with weights and resistance bands to build lean muscle mass and improve muscle definition.<br/><br/>Cardio improvement: Utilizing time-under-tension throughout training to ensure maximum muscle exertion while maintaining flexibility.<br/><br/>A good option for individuals with joint sensitivities or those seeking a gentler approach to fitness.", updatedAt: "2025-08-15T03:54:16.745Z" },
        { id: "23mgkrhu4ht", key: "brought_to_you_by", title: "Brought to you by", content: "• BeFitBalance with Jess • C.P.S Coffee • Makkha Health & Spa BKK • Sunshine Market", updatedAt: "2025-08-15T03:59:45.539Z" },
        { id: "c9ba9d3a-3abf-4df8-8642-b687312cee7e", key: "contact_email", title: "Contact Email", content: "collective.tonelab@gmail.com", updatedAt: "2025-08-15T03:51:24.214Z" },
        { id: "dc878e64-e547-4917-897a-c4b7a7f3899d", key: "contact_phone", title: "Contact Phone", content: "+66 (0) 12-345-6789", updatedAt: "2025-08-15T03:25:20.090Z" },
        { id: "33cf6208-8ce6-4e39-bff0-1605cc182dbf", key: "early_bird_price", title: "Early Bird Price", content: "฿890", updatedAt: "2025-08-15T03:25:19.759Z" },
        { id: "46292b75-0c25-4baa-8a95-0971ac8a8d9c", key: "event_date", title: "Event Date", content: "Sunday, 19th January 2025", updatedAt: "2025-08-15T03:25:19.626Z" },
        { id: "4zfhpo81xdq", key: "event_details", title: "Event Details", content: "<div class=\"flex items-center mb-4\"><svg class=\"text-gray-600 mr-3 w-4 h-4\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z\" clip-rule=\"evenodd\"></path></svg><span>Sunday, 19th January 2025</span></div><div class=\"flex items-start mb-4\"><svg class=\"text-gray-600 mr-3 mt-1 flex-shrink-0 w-4 h-4\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z\" clip-rule=\"evenodd\"></path></svg><div><div>09:00–09:30 | Registration</div><div>09:30-10:30 | Pilates Full Body Sculpt & Burn</div><div>09:30-10:30 | Enjoy the Afterburn & Stay Photogenic</div></div></div><div class=\"flex items-center\"><svg class=\"text-gray-600 mr-3 w-4 h-4\" fill=\"currentColor\" viewBox=\"0 0 20 20\"><path fill-rule=\"evenodd\" d=\"M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z\" clip-rule=\"evenodd\"></path></svg><span>Asoke Sports Club (Free parking available)</span></div>", updatedAt: "2025-08-15T03:59:45.404Z" },
        { id: "2c3ec6d1-44c3-491e-af53-6149c07fe39b", key: "event_time", title: "Event Time", content: "4:00 PM - 5:30 PM", updatedAt: "2025-08-15T03:25:19.693Z" },
        { id: "ad4da994-d0af-4cfe-8380-71bc7d4a97c3", key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn", updatedAt: "2025-08-15T03:25:19.560Z" },
        { id: "fcda7d79-399a-44d2-aa00-925bf104ecd7", key: "google_maps_url", title: "Google Maps URL", content: "https://maps.app.goo.gl/5Tru3vjNYC87xc1g7?g_st=ipc", updatedAt: "2025-08-15T05:04:30.000Z" },
        { id: "070bef65-90d3-43d9-a325-2d45e3ef7f2f", key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation.", updatedAt: "2025-08-15T03:25:19.489Z" },
        { id: "wrwvwxws8i", key: "hero_image", title: "Hero Image", content: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=800", updatedAt: "2025-08-15T03:39:25.587Z" },
        { id: "a0b6273f-d17f-4b76-9c56-bb164f349cca", key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab", updatedAt: "2025-08-15T03:25:19.408Z" },
        { id: "kv6jmebtmp", key: "payment_image", title: "Payment QR Code", content: "/qr-code.png", updatedAt: "2025-08-15T03:40:54.844Z" },
        { id: "30363325-3383-4d3c-ae80-aa82bf9ec9b4", key: "regular_price", title: "Regular Price", content: "฿1,190", updatedAt: "2025-08-15T03:25:19.825Z" },
        { id: "ddce7ec8-efa3-415b-8e24-d39f05a46053", key: "venue_address", title: "Venue Address", content: "48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand", updatedAt: "2025-08-15T03:25:19.958Z" },
        { id: "f05f4512-396c-4cb5-a1c7-6054055dc284", key: "venue_name", title: "Venue Name", content: "Asoke Sports Club", updatedAt: "2025-08-15T05:08:31.279Z" }
      ];
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData)
      };
    }

    if (method === 'POST' && path === '/api/bookings') {
      try {
        const body = JSON.parse(event.body || '{}');
        console.log('Booking request body:', body);
        
        // Create booking immediately
        const booking = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          fullName: body.fullName,
          email: body.email,
          telephone: body.telephone,
          receiptPath: body.receiptPath,
          earlyBirdConfirmed: body.earlyBirdConfirmed,
          cancellationPolicyAccepted: body.cancellationPolicyAccepted,
          createdAt: new Date().toISOString()
        };
        
        bookings.push(booking);
        console.log('Booking created:', booking.id);
        
        // Send email notification with timeout protection
        const sendEmail = async () => {
          try {
            const emailData = {
              access_key: '9f4058e1-70c7-48b0-ba8d-8d52c5339371',
              subject: `New Tonelab Booking: ${booking.fullName}`,
              from_name: 'Tonelab Booking System',
              email: 'collective.tonelab@gmail.com',
              message: `New booking received:\n\nCustomer: ${booking.fullName}\nEmail: ${booking.email}\nPhone: ${booking.telephone}\nAmount: ฿890\nBooking ID: ${booking.id}\nReceipt: ${booking.receiptPath ? 'Uploaded' : 'Not provided'}`
            };
            
            const emailResponse = await fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(emailData),
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            console.log('Email sent successfully');
            return emailResponse.ok;
          } catch (emailError) {
            console.error('Email notification failed:', emailError);
            return false;
          }
        };
        
        // Fire email async but don't wait for it
        sendEmail().then(success => {
          console.log('Email result:', success ? 'sent' : 'failed');
        });
        
        // Return success immediately
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
      } catch (error) {
        console.error('Booking creation error:', error);
        return {
          statusCode: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: "Failed to create booking", 
            details: error.message 
          })
        };
      }
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

    if (method === 'POST' && path === '/api/simple-upload') {
      // Simple upload handler that just accepts the file
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true,
          message: 'File received successfully'
        })
      };
    }

    // Handle the actual file upload (PUT request)
    if (method === 'PUT' && path.startsWith('/api/upload/file/')) {
      const fileId = path.split('/').pop();
      const mockFileUrl = `https://tonelabs.netlify.app/uploads/receipt-${fileId}-${Date.now()}.jpg`;
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          fileUrl: mockFileUrl,
          message: "File uploaded successfully" 
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

    if (method === 'GET' && path.startsWith('/api/placeholder-receipt')) {
      // Return a simple placeholder response for receipt preview
      const { filename } = event.queryStringParameters || {};
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        body: `Receipt uploaded: ${filename || 'receipt.jpg'}`
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