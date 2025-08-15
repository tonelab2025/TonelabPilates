import { Handler } from "@netlify/functions";
import express from "express";
import { config } from "dotenv";

// Load environment variables
config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Routes
app.get("/api/bookings", (req, res) => {
  res.json(bookings);
});

app.post("/api/bookings", async (req, res) => {
  const booking: Booking = {
    id: Date.now().toString(),
    ...req.body,
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
    
    const emailResponse = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    
    if (!emailResponse.ok) {
      console.error('Email sending failed:', await emailResponse.text());
    }
  } catch (error) {
    console.error('Email error:', error);
  }
  
  res.json(booking);
});

app.delete("/api/bookings/:id", (req, res) => {
  const index = bookings.findIndex(b => b.id === req.params.id);
  if (index > -1) {
    bookings.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Booking not found" });
  }
});

app.get("/api/content/public", (req, res) => {
  res.json(content);
});

app.put("/api/content/:id", (req, res) => {
  const item = content.find(c => c.id === req.params.id);
  if (item) {
    item.content = req.body.content;
    item.updatedAt = new Date().toISOString();
    res.json(item);
  } else {
    res.status(404).json({ error: "Content not found" });
  }
});

app.post("/api/admin/login", (req, res) => {
  if (req.body.password === "tonelab2025") {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// File upload endpoints for receipt handling
app.post("/api/upload/receipt", async (req, res) => {
  try {
    // For demo purposes, return a mock file URL
    // In production, this would integrate with your storage service
    const mockFileUrl = `https://tonelabs.netlify.app/uploads/receipt-${Date.now()}.jpg`;
    res.json({ 
      success: true, 
      fileUrl: mockFileUrl,
      message: "Receipt uploaded successfully" 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/api/upload/config", (req, res) => {
  // Return upload configuration for the frontend
  res.json({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    uploadEndpoint: '/api/upload/receipt'
  });
});

// Admin stats endpoint
app.get("/api/admin/stats", (req, res) => {
  res.json({
    totalBookings: bookings.length,
    recentBookings: bookings.slice(-5),
    lastBookingDate: bookings.length > 0 ? bookings[bookings.length - 1].createdAt : null
  });
});

export const handler: Handler = async (event, context) => {
  const serverless = await import("@netlify/functions");
  return serverless.default(app)(event, context);
};