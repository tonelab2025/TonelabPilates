import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleSheetsStorage } from "../../server/googleSheetsStorage";
import { insertBookingSchema } from "../../shared/schema";
import { sendBookingNotificationEmail } from "../../server/email";

const storage = new GoogleSheetsStorage();

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/bookings', '');

    // POST /api/bookings - Create booking
    if (event.httpMethod === 'POST' && !path) {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const data = JSON.parse(event.body);
      const validatedData = insertBookingSchema.parse(data);

      // Check for duplicate booking (same email on the same day)
      const existingBookings = await storage.getAllBookings();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const duplicateBooking = existingBookings.find(booking => 
        booking.email.toLowerCase() === validatedData.email.toLowerCase() &&
        new Date(booking.createdAt) >= today &&
        new Date(booking.createdAt) < tomorrow
      );

      if (duplicateBooking) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: "Duplicate booking detected",
            message: "This email address has already been used for a booking today. Each email can only book once per day." 
          }),
        };
      }

      const booking = await storage.createBooking(validatedData);

      // Send email notification
      try {
        await sendBookingNotificationEmail({
          customerName: booking.fullName,
          customerEmail: booking.email,
          customerPhone: booking.telephone,
          eventType: "Pilates Full Body Sculpt & Burn",
          totalAmount: 890,
          receiptPath: booking.receiptPath || undefined,
          bookingId: booking.id,
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't fail the booking creation if email fails
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          booking: {
            id: booking.id,
            fullName: booking.fullName,
            email: booking.email,
            createdAt: booking.createdAt,
          },
        }),
      };
    }

    // GET /api/bookings - Get all bookings
    if (event.httpMethod === 'GET' && !path) {
      const bookings = await storage.getAllBookings();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(bookings),
      };
    }

    // GET /api/bookings/:id - Get specific booking
    if (event.httpMethod === 'GET' && path.startsWith('/')) {
      const id = path.substring(1);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Booking not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(booking),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error) {
    console.error('Function error:', error);
    
    if (error instanceof Error && error.message.includes("validation")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Validation failed",
          details: error.message 
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};