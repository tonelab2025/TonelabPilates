import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleSheetsStorage } from "./googleSheetsStorage";
import { googleDriveStorage } from "./googleDrive";
import { getConnectedSheetsId } from "./googleForms";

// Use in-memory storage for now, with Google Sheets as supplementary sync
const useGoogleSheets = true; // Enable Google Sheets sync alongside local storage
const dataStorage = storage; // Use local storage as primary
import { insertBookingSchema, siteContent, insertContentSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { sendBookingNotificationEmail } from "./email";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Receipt preview proxy endpoint  
  app.get("/api/receipt-preview", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: "URL parameter required" });
      }

      console.log('Receipt preview request for:', imageUrl);

      // Use object storage service to get the image
      const objectStorageService = new ObjectStorageService();
      
      // Extract path from the GCS URL
      const urlObj = new URL(imageUrl);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part.startsWith('replit-objstore-'));
      
      if (bucketIndex === -1) {
        console.log('Invalid URL format - no bucket found');
        return res.status(400).json({ error: "Invalid URL format" });
      }
      
      const bucketName = pathParts[bucketIndex];
      const objectPath = pathParts.slice(bucketIndex + 1).join('/');
      
      console.log('Extracted bucket:', bucketName, 'path:', objectPath);
      
      // Get the file from object storage
      const { objectStorageClient } = await import('./objectStorage');
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectPath);
      
      const [exists] = await file.exists();
      if (!exists) {
        console.log('File does not exist in bucket');
        return res.status(404).json({ error: "Image not found" });
      }

      // Get file metadata and stream the file
      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType || 'image/jpeg';
      
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=3600');
      
      const stream = file.createReadStream();
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to stream image" });
        }
      });
      
      stream.pipe(res);
      
    } catch (error) {
      console.error('Receipt preview error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to load image" });
      }
    }
  });
  // Get upload URL for receipt file
  app.post("/api/receipts/upload", async (req, res) => {
    try {
      const { bookingId } = req.body;
      console.log("Receipt upload request - bookingId:", bookingId);
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL(bookingId);
      console.log("Generated organized upload URL:", uploadURL);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Serve uploaded receipt files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving receipt file:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Create a new booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      
      // Check for duplicate booking (same email on the same day)
      const existingBookings = await dataStorage.getAllBookings();
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
        return res.status(400).json({ 
          error: "Duplicate booking detected",
          message: "This email address has already been used for a booking today. Each email can only book once per day." 
        });
      }
      
      // If receiptPath is provided, normalize it
      if (validatedData.receiptPath) {
        const objectStorageService = new ObjectStorageService();
        validatedData.receiptPath = objectStorageService.normalizeObjectEntityPath(
          validatedData.receiptPath
        );
      }

      const booking = await dataStorage.createBooking(validatedData);
      
      // If using Google Sheets, also save to Google Drive Storage
      if (useGoogleSheets) {
        try {
          await googleDriveStorage.saveBookingToSheets({
            bookingId: booking.id,
            fullName: booking.fullName,
            email: booking.email,
            telephone: booking.telephone,
            receiptPath: booking.receiptPath || '',
            earlyBirdConfirmed: booking.earlyBirdConfirmed,
            cancellationPolicyAccepted: booking.cancellationPolicyAccepted,
            createdAt: booking.createdAt.toISOString()
          });
        } catch (error) {
          console.error("❌ Google Sheets save failed:", (error as Error).message || error);
          // Don't fail the booking if Sheets save fails
        }
      }
      
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
      
      res.status(201).json({
        success: true,
        booking: {
          id: booking.id,
          fullName: booking.fullName,
          email: booking.email,
          createdAt: booking.createdAt,
        },
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        return res.status(400).json({ 
          error: "Validation failed",
          details: error.message 
        });
      }
      if (error instanceof Error && error.message.includes("Duplicate")) {
        return res.status(400).json({ 
          error: "Duplicate booking",
          details: error.message 
        });
      }
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Middleware to check admin authentication
  const requireAdminAuth = (req: any, res: any, next: any) => {
    if (req.cookies?.admin_auth === 'authenticated') {
      next();
    } else {
      res.status(401).json({ error: "Authentication required" });
    }
  };

  // Content management endpoints (protected)
  app.get("/api/content", requireAdminAuth, async (req, res) => {
    try {
      const content = await db.select().from(siteContent).orderBy(siteContent.key);
      
      // If no content exists, create default content
      if (content.length === 0) {
        const defaultContent = [
          { key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab" },
          { key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation." },
          { key: "hero_image", title: "Hero Image", content: "/public-objects/hero-image.jpg" },
          { key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn" },
          { key: "event_date", title: "Event Date", content: "Sunday, 19th January 2025" },
          { key: "event_time", title: "Event Time", content: "4:00 PM - 5:30 PM" },
          { key: "early_bird_price", title: "Early Bird Price", content: "฿890" },
          { key: "regular_price", title: "Regular Price", content: "฿1,190" },
          { key: "payment_image", title: "Payment QR Code", content: "/public-objects/qr-code.png" },
          { key: "venue_name", title: "Venue Name", content: "Asoke Sports Club" },
          { key: "venue_address", title: "Venue Address", content: "48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand" },
          { key: "google_maps_url", title: "Google Maps URL", content: "https://maps.app.goo.gl/5Tru3vjNYC87xc1g7?g_st=ipc" },
          { key: "contact_email", title: "Contact Email", content: "collective.tonelab@gmail.com" },
          { key: "contact_phone", title: "Contact Phone", content: "+66 (0) 12-345-6789" }
        ];
        
        for (const item of defaultContent) {
          await db.insert(siteContent).values(item);
        }
        
        const newContent = await db.select().from(siteContent).orderBy(siteContent.key);
        return res.json(newContent);
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      // Return default content as fallback
      const defaultContent = [
        { id: "1", key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab", updatedAt: new Date() },
        { id: "2", key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation.", updatedAt: new Date() },
        { id: "3", key: "hero_image", title: "Hero Image", content: "/public-objects/hero-image.jpg", updatedAt: new Date() },
        { id: "4", key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn", updatedAt: new Date() },
        { id: "5", key: "event_date", title: "Event Date", content: "Sunday, 19th January 2025", updatedAt: new Date() },
        { id: "6", key: "event_time", title: "Event Time", content: "4:00 PM - 5:30 PM", updatedAt: new Date() },
        { id: "7", key: "early_bird_price", title: "Early Bird Price", content: "฿890", updatedAt: new Date() },
        { id: "8", key: "regular_price", title: "Regular Price", content: "฿1,190", updatedAt: new Date() },
        { id: "9", key: "payment_image", title: "Payment QR Code", content: "/public-objects/qr-code.png", updatedAt: new Date() },
        { id: "10", key: "venue_name", title: "Venue Name", content: "Asoke Sports Club", updatedAt: new Date() },
        { id: "11", key: "venue_address", title: "Venue Address", content: "48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand", updatedAt: new Date() },
        { id: "12", key: "contact_email", title: "Contact Email", content: "collective.tonelab@gmail.com", updatedAt: new Date() },
        { id: "13", key: "contact_phone", title: "Contact Phone", content: "+66 (0) 12-345-6789", updatedAt: new Date() }
      ];
      res.json(defaultContent);
    }
  });

  app.put("/api/content/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { content: newContent } = req.body;
      
      const updated = await db
        .update(siteContent)
        .set({ content: newContent, updatedAt: new Date() })
        .where(eq(siteContent.id, id))
        .returning();
      
      if (updated.length === 0) {
        return res.status(404).json({ error: "Content not found" });
      }
      
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ error: "Failed to update content" });
    }
  });

  // Public content endpoint (no auth required)
  app.get("/api/content/public", async (req, res) => {
    try {
      const content = await db.select().from(siteContent).orderBy(siteContent.key);
      
      // If no content exists, return default content
      if (content.length === 0) {
        const defaultContent = [
          { id: "1", key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab", updatedAt: new Date() },
          { id: "2", key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation.", updatedAt: new Date() },
          { id: "3", key: "hero_image", title: "Hero Image", content: "/public-objects/hero-image.jpg", updatedAt: new Date() },
          { id: "4", key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn", updatedAt: new Date() },
          { id: "5", key: "event_date", title: "Event Date", content: "Sunday, 19th January 2025", updatedAt: new Date() },
          { id: "6", key: "event_time", title: "Event Time", content: "4:00 PM - 5:30 PM", updatedAt: new Date() },
          { id: "7", key: "early_bird_price", title: "Early Bird Price", content: "฿890", updatedAt: new Date() },
          { id: "8", key: "regular_price", title: "Regular Price", content: "฿1,190", updatedAt: new Date() },
          { id: "9", key: "payment_image", title: "Payment QR Code", content: "/public-objects/qr-code.png", updatedAt: new Date() },
          { id: "10", key: "venue_name", title: "Venue Name", content: "Asoke Sports Club", updatedAt: new Date() },
          { id: "11", key: "venue_address", title: "Venue Address", content: "48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand", updatedAt: new Date() },
          { id: "12", key: "contact_email", title: "Contact Email", content: "collective.tonelab@gmail.com", updatedAt: new Date() },
          { id: "13", key: "contact_phone", title: "Contact Phone", content: "+66 (0) 12-345-6789", updatedAt: new Date() }
        ];
        return res.json(defaultContent);
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error fetching public content:", error);
      // Return default content as fallback
      const defaultContent = [
        { id: "1", key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab", updatedAt: new Date() },
        { id: "2", key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation.", updatedAt: new Date() },
        { id: "3", key: "hero_image", title: "Hero Image", content: "/public-objects/hero-image.jpg", updatedAt: new Date() },
        { id: "4", key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn", updatedAt: new Date() },
        { id: "5", key: "event_date", title: "Event Date", content: "Sunday, 19th January 2025", updatedAt: new Date() },
        { id: "6", key: "event_time", title: "Event Time", content: "4:00 PM - 5:30 PM", updatedAt: new Date() },
        { id: "7", key: "early_bird_price", title: "Early Bird Price", content: "฿890", updatedAt: new Date() },
        { id: "8", key: "regular_price", title: "Regular Price", content: "฿1,190", updatedAt: new Date() },
        { id: "9", key: "payment_image", title: "Payment QR Code", content: "/public-objects/qr-code.png", updatedAt: new Date() },
        { id: "10", key: "venue_name", title: "Venue Name", content: "Asoke Sports Club", updatedAt: new Date() },
        { id: "11", key: "venue_address", title: "Venue Address", content: "48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand", updatedAt: new Date() },
        { id: "12", key: "contact_email", title: "Contact Email", content: "collective.tonelab@gmail.com", updatedAt: new Date() },
        { id: "13", key: "contact_phone", title: "Contact Phone", content: "+66 (0) 12-345-6789", updatedAt: new Date() }
      ];
      res.json(defaultContent);
    }
  });

  // Image upload endpoint for content management
  app.post("/api/content/upload-image", requireAdminAuth, async (req, res) => {
    try {
      // Import ObjectStorageService dynamically
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      // Generate presigned URL for public image upload
      const uploadURL = await objectStorageService.getPublicImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Get all bookings (admin endpoint)
  app.get("/api/bookings", async (req, res) => {
    try {
      let bookings = await dataStorage.getAllBookings();
      
      // If using Google Sheets, also try to fetch from Google Sheets
      if (useGoogleSheets) {
        try {
          const sheetsBookings = await googleDriveStorage.getBookingsFromSheets();
          // Filter out invalid entries and merge with existing bookings
          const validSheetsBookings = sheetsBookings.filter(booking => 
            booking.bookingId && 
            booking.fullName && 
            booking.email &&
            typeof booking.bookingId === 'string'
          ).map(booking => ({
            id: booking.bookingId || 'unknown',
            fullName: booking.fullName,
            telephone: booking.telephone,
            email: booking.email,
            receiptPath: booking.receiptPath || null,
            earlyBirdConfirmed: booking.earlyBirdConfirmed,
            cancellationPolicyAccepted: booking.cancellationPolicyAccepted,
            createdAt: new Date(booking.createdAt)
          }));
          const allBookings = [...bookings, ...validSheetsBookings];
          const uniqueBookings = allBookings.reduce((acc, booking) => {
            const existing = acc.find(b => b.email === booking.email && b.createdAt === booking.createdAt);
            if (!existing) {
              acc.push(booking);
            }
            return acc;
          }, [] as typeof bookings);
          bookings = uniqueBookings;
        } catch (error) {
          console.error("Error fetching from Google Sheets:", error);
          // Fall back to regular storage
        }
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Get a specific booking
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await dataStorage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // Test Google Sheets connection
  app.get("/api/debug/test-sheets", async (req, res) => {
    try {
      // Test writing a simple row to verify connection
      await googleDriveStorage.saveBookingToSheets({
        fullName: "Test Connection",
        email: "test@sheets.com", 
        telephone: "1234567890",
        receiptPath: "",
        earlyBirdConfirmed: false,
        cancellationPolicyAccepted: true,
        createdAt: new Date().toISOString()
      });
      
      // Try to read back data
      const bookings = await googleDriveStorage.getBookingsFromSheets();
      
      res.json({ 
        success: true,
        message: 'Google Sheets connection working!',
        bookingsCount: bookings.length,
        sheetsId: '1XNcktdtttVYDnXwCHg_4te51ym60V9XBovU8j_Bo55w'
      });
    } catch (error) {
      console.error("Google Sheets connection error:", error);
      res.json({ 
        success: false,
        error: (error as Error).message,
        message: 'Please share the sheet with: tonelabs@astute-atlas-469008-j9.iam.gserviceaccount.com'
      });
    }
  });

  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      // Simple password check - in production you'd use proper auth
      const adminPassword = process.env.ADMIN_PASSWORD || "tonelab2025";
      
      if (password === adminPassword) {
        // Set a simple session cookie
        res.cookie('admin_auth', 'authenticated', { 
          httpOnly: true, 
          secure: false, // Allow HTTP for development
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie('admin_auth');
    res.json({ success: true });
  });

  // Admin endpoints (protected)
  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const stats = {
        totalBookings: bookings.length,
        totalRevenue: bookings.length * 890, // 890 THB per booking
        todayBookings: bookings.filter(booking => 
          new Date(booking.createdAt) >= today
        ).length,
        pendingPayments: bookings.filter(booking => !booking.receiptPath).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/recent-bookings", requireAdminAuth, async (req, res) => {
    try {
      let bookings = await dataStorage.getAllBookings();
      
      // If using Google Sheets, also try to fetch from Google Sheets
      if (useGoogleSheets) {
        try {
          const sheetsBookings = await googleDriveStorage.getBookingsFromSheets();
          const validSheetsBookings = sheetsBookings.filter(booking => 
            booking.bookingId && 
            booking.fullName && 
            booking.email &&
            typeof booking.bookingId === 'string'
          ).map(booking => ({
            id: booking.bookingId || 'unknown',
            fullName: booking.fullName,
            telephone: booking.telephone,
            email: booking.email,
            receiptPath: booking.receiptPath || null,
            earlyBirdConfirmed: booking.earlyBirdConfirmed,
            cancellationPolicyAccepted: booking.cancellationPolicyAccepted,
            createdAt: new Date(booking.createdAt)
          }));
          const allBookings = [...bookings, ...validSheetsBookings];
          const uniqueBookings = allBookings.reduce((acc, booking) => {
            const existing = acc.find(b => b.email === booking.email && b.createdAt === booking.createdAt);
            if (!existing) {
              acc.push(booking);
            }
            return acc;
          }, [] as typeof bookings);
          bookings = uniqueBookings;
        } catch (error) {
          console.error("Failed to fetch Google Sheets data for recent bookings:", error);
        }
      }
      
      // Sort by date (newest first) and take last 5
      const recentBookings = bookings
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      res.json(recentBookings);
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
      res.status(500).json({ error: "Failed to fetch recent bookings" });
    }
  });

  // Delete booking endpoint
  app.delete("/api/bookings/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Attempting to delete booking: ${id}`);
      
      // Delete from database storage
      await storage.deleteBooking(id);
      console.log(`Successfully deleted booking ${id} from storage`);
      
      res.json({ success: true, message: "Booking deleted successfully" });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  app.get("/api/admin/bookings", requireAdminAuth, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/recent-bookings", requireAdminAuth, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      const recentBookings = bookings
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      res.json(recentBookings);
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
      res.status(500).json({ error: "Failed to fetch recent bookings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
