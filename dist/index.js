var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/objectAcl.ts
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}
var ACL_POLICY_METADATA_KEY;
var init_objectAcl = __esm({
  "server/objectAcl.ts"() {
    "use strict";
    ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
  }
});

// server/objectStorage.ts
var objectStorage_exports = {};
__export(objectStorage_exports, {
  ObjectNotFoundError: () => ObjectNotFoundError,
  ObjectStorageService: () => ObjectStorageService,
  objectStorageClient: () => objectStorageClient
});
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
function parseObjectPath(path4) {
  if (!path4.startsWith("/")) {
    path4 = `/${path4}`;
  }
  const pathParts = path4.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
var REPLIT_SIDECAR_ENDPOINT, objectStorageClient, ObjectNotFoundError, ObjectStorageService;
var init_objectStorage = __esm({
  "server/objectStorage.ts"() {
    "use strict";
    init_objectAcl();
    REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
    objectStorageClient = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token"
          }
        },
        universe_domain: "googleapis.com"
      },
      projectId: ""
    });
    ObjectNotFoundError = class _ObjectNotFoundError extends Error {
      constructor() {
        super("Object not found");
        this.name = "ObjectNotFoundError";
        Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
      }
    };
    ObjectStorageService = class {
      constructor() {
      }
      // Gets the public object search paths.
      getPublicObjectSearchPaths() {
        const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
        const paths = Array.from(
          new Set(
            pathsStr.split(",").map((path4) => path4.trim()).filter((path4) => path4.length > 0)
          )
        );
        if (paths.length === 0) {
          throw new Error(
            "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
          );
        }
        return paths;
      }
      // Gets the private object directory.
      getPrivateObjectDir() {
        const dir = process.env.PRIVATE_OBJECT_DIR || "";
        if (!dir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        return dir;
      }
      // Search for a public object from the search paths.
      async searchPublicObject(filePath) {
        for (const searchPath of this.getPublicObjectSearchPaths()) {
          const fullPath = `${searchPath}/${filePath}`;
          const { bucketName, objectName } = parseObjectPath(fullPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          const [exists] = await file.exists();
          if (exists) {
            return file;
          }
        }
        return null;
      }
      // Downloads an object to the response.
      async downloadObject(file, res, cacheTtlSec = 3600) {
        try {
          const [metadata] = await file.getMetadata();
          const aclPolicy = await getObjectAclPolicy(file);
          const isPublic = aclPolicy?.visibility === "public";
          res.set({
            "Content-Type": metadata.contentType || "application/octet-stream",
            "Content-Length": metadata.size,
            "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
          });
          const stream = file.createReadStream();
          stream.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Error streaming file" });
            }
          });
          stream.pipe(res);
        } catch (error) {
          console.error("Error downloading file:", error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error downloading file" });
          }
        }
      }
      // Gets the upload URL for an object entity with organized folder structure.
      async getObjectEntityUploadURL(bookingId) {
        const privateObjectDir = this.getPrivateObjectDir();
        if (!privateObjectDir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const timestamp2 = Date.now();
        const fileId = bookingId ? `${bookingId}_${timestamp2}` : `temp_${randomUUID()}`;
        const fullPath = `${privateObjectDir}/uploads/${today}/${fileId}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        return signObjectURL({
          bucketName,
          objectName,
          method: "PUT",
          ttlSec: 900
        });
      }
      // Gets the upload URL for a public image (for content management).
      async getPublicImageUploadURL() {
        const publicPaths = this.getPublicObjectSearchPaths();
        if (!publicPaths || publicPaths.length === 0) {
          throw new Error(
            "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var."
          );
        }
        const publicPath = publicPaths[0];
        const imageId = randomUUID();
        const fullPath = `${publicPath}/${imageId}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        return signObjectURL({
          bucketName,
          objectName,
          method: "PUT",
          ttlSec: 900
        });
      }
      // Gets the object entity file from the object path.
      async getObjectEntityFile(objectPath) {
        if (!objectPath.startsWith("/objects/")) {
          throw new ObjectNotFoundError();
        }
        const parts = objectPath.slice(1).split("/");
        if (parts.length < 2) {
          throw new ObjectNotFoundError();
        }
        const entityId = parts.slice(1).join("/");
        let entityDir = this.getPrivateObjectDir();
        if (!entityDir.endsWith("/")) {
          entityDir = `${entityDir}/`;
        }
        const objectEntityPath = `${entityDir}${entityId}`;
        const { bucketName, objectName } = parseObjectPath(objectEntityPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const objectFile = bucket.file(objectName);
        const [exists] = await objectFile.exists();
        if (!exists) {
          throw new ObjectNotFoundError();
        }
        return objectFile;
      }
      normalizeObjectEntityPath(rawPath) {
        if (!rawPath.startsWith("https://storage.googleapis.com/")) {
          return rawPath;
        }
        const url = new URL(rawPath);
        const rawObjectPath = url.pathname;
        let objectEntityDir = this.getPrivateObjectDir();
        if (!objectEntityDir.endsWith("/")) {
          objectEntityDir = `${objectEntityDir}/`;
        }
        if (!rawObjectPath.startsWith(objectEntityDir)) {
          return rawObjectPath;
        }
        const entityId = rawObjectPath.slice(objectEntityDir.length);
        return `/objects/${entityId}`;
      }
      // Tries to set the ACL policy for the object entity and return the normalized path.
      async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
        const normalizedPath = this.normalizeObjectEntityPath(rawPath);
        if (!normalizedPath.startsWith("/")) {
          return normalizedPath;
        }
        const objectFile = await this.getObjectEntityFile(normalizedPath);
        await setObjectAclPolicy(objectFile, aclPolicy);
        return normalizedPath;
      }
      // Checks if the user can access the object entity.
      async canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission
      }) {
        return canAccessObject({
          userId,
          objectFile,
          requestedPermission: requestedPermission ?? "read" /* READ */
        });
      }
    };
  }
});

// server/index.ts
import express2 from "express";
import cookieParser from "cookie-parser";
import { config } from "dotenv";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bookings: () => bookings,
  insertBookingSchema: () => insertBookingSchema,
  insertContentSchema: () => insertContentSchema,
  siteContent: () => siteContent
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  telephone: text("telephone").notNull(),
  email: text("email").notNull(),
  receiptPath: text("receipt_path"),
  earlyBirdConfirmed: boolean("early_bird_confirmed").notNull().default(false),
  cancellationPolicyAccepted: boolean("cancellation_policy_accepted").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true
}).extend({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name is too long").regex(/^[a-zA-Z\s\'\-\.]+$/, "Full name can only contain letters, spaces, apostrophes, hyphens, and periods").refine((val) => {
    return /[a-zA-Z]/.test(val);
  }, "Full name must contain at least one letter").refine((val) => {
    return !/^\d+$/.test(val.trim());
  }, "Full name cannot be only numbers"),
  telephone: z.string().min(1, "Phone number is required").regex(/^[\+]?[\d\s\-\(\)]+$/, "Phone number can only contain digits, spaces, dashes, parentheses, and + for country code").refine((val) => {
    const digitsOnly = val.replace(/\D/g, "");
    return digitsOnly.length >= 8 && digitsOnly.length <= 15;
  }, "Phone number must have 8-15 digits").refine((val) => {
    const cleaned = val.replace(/\s/g, "");
    return /^[\+]?[\d\-\(\)]+$/.test(cleaned);
  }, "Please enter a valid phone number format"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address").toLowerCase().refine((val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  }, "Please enter a valid email format").refine((val) => {
    const domain = val.split("@")[1];
    return domain && domain.length > 2 && !domain.includes("example");
  }, "Please use a real email address"),
  receiptPath: z.string().optional(),
  earlyBirdConfirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm the Early Bird payment deadline"
  }),
  cancellationPolicyAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the cancellation policy"
  })
});
var siteContent = pgTable("site_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var insertContentSchema = createInsertSchema(siteContent).omit({
  id: true,
  updatedAt: true
}).extend({
  key: z.string().min(1, "Key is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required")
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  async createBooking(insertBooking) {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }
  async getBooking(id) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || void 0;
  }
  async getAllBookings() {
    return await db.select().from(bookings);
  }
  async deleteBooking(id) {
    await db.delete(bookings).where(eq(bookings.id, id));
  }
};
var storage = new DatabaseStorage();

// server/googleDrive.ts
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
var credentials;
try {
  const credentialsPath = path.resolve("./credentials.json");
  credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  console.log("Google credentials loaded successfully from file");
} catch (error) {
  console.error("Error loading credentials file:", error);
  credentials = {};
}
var auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file"
  ]
});
var sheets = google.sheets({ version: "v4", auth });
var drive = google.drive({ version: "v3", auth });
var SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1XNcktdtttVYDnXwCHg_4te51ym60V9XBovU8j_Bo55w";
var GoogleDriveStorage = class {
  async saveBookingToSheets(bookingData) {
    if (!SPREADSHEET_ID) {
      throw new Error("Google Sheets ID not configured");
    }
    const values = [[
      bookingData.bookingId || "",
      (/* @__PURE__ */ new Date()).toISOString(),
      bookingData.fullName,
      bookingData.email,
      bookingData.telephone,
      bookingData.receiptPath || "",
      bookingData.earlyBirdConfirmed ? "Yes" : "No",
      bookingData.cancellationPolicyAccepted ? "Yes" : "No"
    ]];
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A:H",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values
        }
      });
    } catch (error) {
      console.error("Error saving to Google Sheets:", error);
      throw error;
    }
  }
  async getBookingsFromSheets() {
    if (!SPREADSHEET_ID) {
      return [];
    }
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A:H"
      });
      const rows = response.data.values || [];
      return rows.slice(1).map((row) => ({
        createdAt: row[0] || "",
        fullName: row[1] || "",
        email: row[2] || "",
        telephone: row[3] || "",
        receiptPath: row[4] || "",
        earlyBirdConfirmed: row[5] === "Yes",
        cancellationPolicyAccepted: row[6] === "Yes"
      }));
    } catch (error) {
      console.error("Error reading from Google Sheets:", error);
      return [];
    }
  }
  async uploadReceiptToDrive(file, fileName, mimeType) {
    try {
      const response = await drive.files.create({
        requestBody: {
          name: fileName
          // parents: ['your-folder-id'], // You can create a specific folder for receipts later
        },
        media: {
          mimeType,
          body: file
        }
      });
      const fileId = response.data.id;
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone"
        }
      });
      return `https://drive.google.com/file/d/${fileId}/view`;
    } catch (error) {
      console.error("Error uploading to Google Drive:", error);
      throw error;
    }
  }
};
var googleDriveStorage = new GoogleDriveStorage();

// server/routes.ts
init_objectStorage();

// server/email.ts
async function sendBookingNotificationEmail(params) {
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
        <h2 style="color: #7c3aed;">\u{1F389} New Booking Received!</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Details</h3>
            <p><strong>Name:</strong> ${params.customerName}</p>
            <p><strong>Email:</strong> ${params.customerEmail}</p>
            <p><strong>Phone:</strong> ${params.customerPhone}</p>
        </div>

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Event:</strong> ${params.eventType}</p>
            <p><strong>Total Amount:</strong> \u0E3F${params.totalAmount}</p>
            <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            ${params.receiptPath ? `<p><strong>Receipt:</strong> Uploaded</p>` : "<p><strong>Receipt:</strong> Not uploaded</p>"}
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
    const textContent = `New booking received from ${params.customerName} (${params.customerEmail}) for ${params.eventType}. Amount: \u0E3F${params.totalAmount}. Booking ID: ${params.bookingId}`;
    const freeEmailServices = [
      // Service 1: EmailJS (200 emails/month free)
      {
        name: "EmailJS",
        url: "https://api.emailjs.com/api/v1.0/email/send",
        payload: {
          service_id: "default_service",
          template_id: "template_booking",
          user_id: "public_key",
          template_params: {
            to_email: "collective.tonelab@gmail.com",
            from_name: "Tonelab Booking System",
            subject: `New Booking: ${params.customerName} - \u0E3F${params.totalAmount}`,
            message: `Customer: ${params.customerName}
Email: ${params.customerEmail}
Phone: ${params.customerPhone}
Amount: \u0E3F${params.totalAmount}
Booking ID: ${params.bookingId}`,
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
        name: "Web3Forms",
        url: "https://api.web3forms.com/submit",
        payload: {
          access_key: "9f4058e1-70c7-48b0-ba8d-8d52c5339371",
          // Web3Forms public key
          subject: `New Tonelab Booking: ${params.customerName}`,
          from_name: "Tonelab Booking System",
          email: "collective.tonelab@gmail.com",
          message: `New booking received:

Customer: ${params.customerName}
Email: ${params.customerEmail}
Phone: ${params.customerPhone}
Amount: \u0E3F${params.totalAmount}
Booking ID: ${params.bookingId}
Receipt: ${params.receiptPath ? "Uploaded" : "Not uploaded"}`,
          redirect: "https://web3forms.com/success"
        }
      },
      // Service 3: Simple HTTP POST to Netlify form (if configured)
      {
        name: "Netlify Forms",
        url: "https://tonelab-booking.netlify.app/",
        // User's actual deployed site
        payload: {
          "form-name": "booking-notifications",
          name: params.customerName,
          email: params.customerEmail,
          phone: params.customerPhone,
          subject: `New Booking - \u0E3F${params.totalAmount}`,
          message: `Booking ID: ${params.bookingId}
Amount: \u0E3F${params.totalAmount}
Receipt: ${params.receiptPath ? "Uploaded" : "Not uploaded"}`
        }
      }
    ];
    for (const service of freeEmailServices) {
      try {
        console.log(`Trying ${service.name} email service...`);
        let headers;
        let body;
        if (service.name === "Web3Forms") {
          headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
          };
          body = JSON.stringify(service.payload);
        } else if (service.name === "Netlify Forms") {
          headers = {
            "Content-Type": "application/x-www-form-urlencoded"
          };
          body = Object.entries(service.payload).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join("&");
        } else {
          headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
          };
          body = JSON.stringify(service.payload);
        }
        const response = await fetch(service.url, {
          method: "POST",
          headers,
          body
        });
        const responseText = await response.text();
        console.log(`${service.name} response:`, response.status, responseText);
        if (response.ok || response.status === 200) {
          console.log(`\u2705 Email notification sent via ${service.name}`);
          return true;
        }
      } catch (error) {
        console.log(`\u26A0\uFE0F ${service.name} service failed:`, error);
      }
    }
    console.log("\u26A0\uFE0F All email services failed, trying webhook backup");
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `\u{1F389} **New Tonelab Booking!**

**Customer:** ${params.customerName}
**Email:** ${params.customerEmail}
**Phone:** ${params.customerPhone}
**Amount:** \u0E3F${params.totalAmount}
**Booking ID:** ${params.bookingId}
**Receipt:** ${params.receiptPath ? "Uploaded" : "Not uploaded"}`
          })
        });
        console.log("\u2705 Discord webhook notification sent successfully");
        return true;
      }
    } catch (webhookError) {
      console.log("\u26A0\uFE0F All notification methods failed, using console log");
    }
    console.log("\n" + "=".repeat(50));
    console.log("\u{1F389} NEW BOOKING ALERT - collective.tonelab@gmail.com");
    console.log("=".repeat(50));
    console.log(`\u{1F4E7} Customer: ${params.customerName}`);
    console.log(`\u{1F4E7} Email: ${params.customerEmail}`);
    console.log(`\u{1F4DE} Phone: ${params.customerPhone}`);
    console.log(`\u{1F4B0} Amount: \u0E3F${params.totalAmount}`);
    console.log(`\u{1F194} Booking ID: ${params.bookingId}`);
    console.log(`\u{1F4CE} Receipt: ${params.receiptPath ? "Uploaded" : "Not uploaded"}`);
    console.log("=".repeat(50) + "\n");
    return true;
  } catch (error) {
    console.error("\u274C Email notification failed:", error);
    console.log("\u{1F4CB} BOOKING ALERT:", {
      customer: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
      amount: `\u0E3F${params.totalAmount}`,
      bookingId: params.bookingId,
      receipt: params.receiptPath ? "Uploaded" : "Not uploaded"
    });
    return false;
  }
}

// server/routes.ts
import { eq as eq2 } from "drizzle-orm";
var useGoogleSheets = true;
var dataStorage = storage;
async function registerRoutes(app) {
  app.get("/api/receipt-preview", async (req, res) => {
    try {
      const imageUrl = req.query.url;
      if (!imageUrl) {
        return res.status(400).json({ error: "URL parameter required" });
      }
      console.log("Receipt preview request for:", imageUrl);
      const objectStorageService = new ObjectStorageService();
      const urlObj = new URL(imageUrl);
      const pathParts = urlObj.pathname.split("/");
      const bucketIndex = pathParts.findIndex((part) => part.startsWith("replit-objstore-"));
      if (bucketIndex === -1) {
        console.log("Invalid URL format - no bucket found");
        return res.status(400).json({ error: "Invalid URL format" });
      }
      const bucketName = pathParts[bucketIndex];
      const objectPath = pathParts.slice(bucketIndex + 1).join("/");
      console.log("Extracted bucket:", bucketName, "path:", objectPath);
      const { objectStorageClient: objectStorageClient2 } = await Promise.resolve().then(() => (init_objectStorage(), objectStorage_exports));
      const bucket = objectStorageClient2.bucket(bucketName);
      const file = bucket.file(objectPath);
      const [exists] = await file.exists();
      if (!exists) {
        console.log("File does not exist in bucket");
        return res.status(404).json({ error: "Image not found" });
      }
      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType || "image/jpeg";
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=3600");
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to stream image" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Receipt preview error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to load image" });
      }
    }
  });
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
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path
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
  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const existingBookings = await dataStorage.getAllBookings();
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const duplicateBooking = existingBookings.find(
        (booking2) => booking2.email.toLowerCase() === validatedData.email.toLowerCase() && new Date(booking2.createdAt) >= today && new Date(booking2.createdAt) < tomorrow
      );
      if (duplicateBooking) {
        return res.status(400).json({
          error: "Duplicate booking detected",
          message: "This email address has already been used for a booking today. Each email can only book once per day."
        });
      }
      if (validatedData.receiptPath) {
        const objectStorageService = new ObjectStorageService();
        validatedData.receiptPath = objectStorageService.normalizeObjectEntityPath(
          validatedData.receiptPath
        );
      }
      const booking = await dataStorage.createBooking(validatedData);
      if (useGoogleSheets) {
        try {
          await googleDriveStorage.saveBookingToSheets({
            bookingId: booking.id,
            fullName: booking.fullName,
            email: booking.email,
            telephone: booking.telephone,
            receiptPath: booking.receiptPath || "",
            earlyBirdConfirmed: booking.earlyBirdConfirmed,
            cancellationPolicyAccepted: booking.cancellationPolicyAccepted,
            createdAt: booking.createdAt.toISOString()
          });
        } catch (error) {
          console.error("\u274C Google Sheets save failed:", error.message || error);
        }
      }
      try {
        await sendBookingNotificationEmail({
          customerName: booking.fullName,
          customerEmail: booking.email,
          customerPhone: booking.telephone,
          eventType: "Pilates Full Body Sculpt & Burn",
          totalAmount: 890,
          receiptPath: booking.receiptPath || void 0,
          bookingId: booking.id
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
      }
      res.status(201).json({
        success: true,
        booking: {
          id: booking.id,
          fullName: booking.fullName,
          email: booking.email,
          createdAt: booking.createdAt
        }
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
  const requireAdminAuth = (req, res, next) => {
    if (req.cookies?.admin_auth === "authenticated") {
      next();
    } else {
      res.status(401).json({ error: "Authentication required" });
    }
  };
  app.get("/api/content", requireAdminAuth, async (req, res) => {
    try {
      const content = await db.select().from(siteContent).orderBy(siteContent.key);
      if (content.length === 0) {
        const defaultContent = [
          { key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab" },
          { key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation." },
          { key: "hero_image", title: "Hero Image", content: "/public-objects/hero-image.jpg" },
          { key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn" },
          { key: "event_date", title: "Event Date", content: "Sunday, 19th January 2025" },
          { key: "event_time", title: "Event Time", content: "4:00 PM - 5:30 PM" },
          { key: "early_bird_price", title: "Early Bird Price", content: "\u0E3F890" },
          { key: "regular_price", title: "Regular Price", content: "\u0E3F1,190" },
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
      const defaultContent = [
        { id: "1", key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab", updatedAt: /* @__PURE__ */ new Date() },
        { id: "2", key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation.", updatedAt: /* @__PURE__ */ new Date() },
        { id: "3", key: "hero_image", title: "Hero Image", content: "/public-objects/hero-image.jpg", updatedAt: /* @__PURE__ */ new Date() },
        { id: "4", key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn", updatedAt: /* @__PURE__ */ new Date() },
        { id: "5", key: "event_date", title: "Event Date", content: "Sunday, 19th January 2025", updatedAt: /* @__PURE__ */ new Date() },
        { id: "6", key: "event_time", title: "Event Time", content: "4:00 PM - 5:30 PM", updatedAt: /* @__PURE__ */ new Date() },
        { id: "7", key: "early_bird_price", title: "Early Bird Price", content: "\u0E3F890", updatedAt: /* @__PURE__ */ new Date() },
        { id: "8", key: "regular_price", title: "Regular Price", content: "\u0E3F1,190", updatedAt: /* @__PURE__ */ new Date() },
        { id: "9", key: "payment_image", title: "Payment QR Code", content: "/public-objects/qr-code.png", updatedAt: /* @__PURE__ */ new Date() },
        { id: "10", key: "venue_name", title: "Venue Name", content: "Asoke Sports Club", updatedAt: /* @__PURE__ */ new Date() },
        { id: "11", key: "venue_address", title: "Venue Address", content: "48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand", updatedAt: /* @__PURE__ */ new Date() },
        { id: "12", key: "contact_email", title: "Contact Email", content: "collective.tonelab@gmail.com", updatedAt: /* @__PURE__ */ new Date() },
        { id: "13", key: "contact_phone", title: "Contact Phone", content: "+66 (0) 12-345-6789", updatedAt: /* @__PURE__ */ new Date() }
      ];
      res.json(defaultContent);
    }
  });
  app.put("/api/content/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { content: newContent } = req.body;
      const updated = await db.update(siteContent).set({ content: newContent, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(siteContent.id, id)).returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ error: "Failed to update content" });
    }
  });
  app.get("/api/content/public", async (req, res) => {
    try {
      const content = await db.select().from(siteContent).orderBy(siteContent.key);
      if (content.length === 0) {
        const defaultContent = [
          { id: "1", key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab", updatedAt: /* @__PURE__ */ new Date() },
          { id: "2", key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation.", updatedAt: /* @__PURE__ */ new Date() },
          { id: "3", key: "hero_image", title: "Hero Image", content: "/public-objects/hero-image.jpg", updatedAt: /* @__PURE__ */ new Date() },
          { id: "4", key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn", updatedAt: /* @__PURE__ */ new Date() },
          { id: "5", key: "event_date", title: "Event Date", content: "Sunday, 19th January 2025", updatedAt: /* @__PURE__ */ new Date() },
          { id: "6", key: "event_time", title: "Event Time", content: "4:00 PM - 5:30 PM", updatedAt: /* @__PURE__ */ new Date() },
          { id: "7", key: "early_bird_price", title: "Early Bird Price", content: "\u0E3F890", updatedAt: /* @__PURE__ */ new Date() },
          { id: "8", key: "regular_price", title: "Regular Price", content: "\u0E3F1,190", updatedAt: /* @__PURE__ */ new Date() },
          { id: "9", key: "payment_image", title: "Payment QR Code", content: "/public-objects/qr-code.png", updatedAt: /* @__PURE__ */ new Date() },
          { id: "10", key: "venue_name", title: "Venue Name", content: "Asoke Sports Club", updatedAt: /* @__PURE__ */ new Date() },
          { id: "11", key: "venue_address", title: "Venue Address", content: "48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand", updatedAt: /* @__PURE__ */ new Date() },
          { id: "12", key: "contact_email", title: "Contact Email", content: "collective.tonelab@gmail.com", updatedAt: /* @__PURE__ */ new Date() },
          { id: "13", key: "contact_phone", title: "Contact Phone", content: "+66 (0) 12-345-6789", updatedAt: /* @__PURE__ */ new Date() }
        ];
        return res.json(defaultContent);
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching public content:", error);
      const defaultContent = [
        { id: "1", key: "hero_title", title: "Hero Title", content: "Tune Your Tone with Tonelab", updatedAt: /* @__PURE__ */ new Date() },
        { id: "2", key: "hero_description", title: "Hero Description", content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation.", updatedAt: /* @__PURE__ */ new Date() },
        { id: "3", key: "hero_image", title: "Hero Image", content: "/public-objects/hero-image.jpg", updatedAt: /* @__PURE__ */ new Date() },
        { id: "4", key: "event_title", title: "Event Title", content: "Pilates Full Body Sculpt & Burn", updatedAt: /* @__PURE__ */ new Date() },
        { id: "5", key: "event_date", title: "Event Date", content: "Sunday, 19th January 2025", updatedAt: /* @__PURE__ */ new Date() },
        { id: "6", key: "event_time", title: "Event Time", content: "4:00 PM - 5:30 PM", updatedAt: /* @__PURE__ */ new Date() },
        { id: "7", key: "early_bird_price", title: "Early Bird Price", content: "\u0E3F890", updatedAt: /* @__PURE__ */ new Date() },
        { id: "8", key: "regular_price", title: "Regular Price", content: "\u0E3F1,190", updatedAt: /* @__PURE__ */ new Date() },
        { id: "9", key: "payment_image", title: "Payment QR Code", content: "/public-objects/qr-code.png", updatedAt: /* @__PURE__ */ new Date() },
        { id: "10", key: "venue_name", title: "Venue Name", content: "Asoke Sports Club", updatedAt: /* @__PURE__ */ new Date() },
        { id: "11", key: "venue_address", title: "Venue Address", content: "48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand", updatedAt: /* @__PURE__ */ new Date() },
        { id: "12", key: "contact_email", title: "Contact Email", content: "collective.tonelab@gmail.com", updatedAt: /* @__PURE__ */ new Date() },
        { id: "13", key: "contact_phone", title: "Contact Phone", content: "+66 (0) 12-345-6789", updatedAt: /* @__PURE__ */ new Date() }
      ];
      res.json(defaultContent);
    }
  });
  app.post("/api/content/upload-image", requireAdminAuth, async (req, res) => {
    try {
      const { ObjectStorageService: ObjectStorageService2 } = await Promise.resolve().then(() => (init_objectStorage(), objectStorage_exports));
      const objectStorageService = new ObjectStorageService2();
      const uploadURL = await objectStorageService.getPublicImageUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });
  app.get("/api/bookings", async (req, res) => {
    try {
      let bookings2 = await dataStorage.getAllBookings();
      if (useGoogleSheets) {
        try {
          const sheetsBookings = await googleDriveStorage.getBookingsFromSheets();
          const validSheetsBookings = sheetsBookings.filter(
            (booking) => booking.bookingId && booking.fullName && booking.email && typeof booking.bookingId === "string"
          ).map((booking) => ({
            id: booking.bookingId || "unknown",
            fullName: booking.fullName,
            telephone: booking.telephone,
            email: booking.email,
            receiptPath: booking.receiptPath || null,
            earlyBirdConfirmed: booking.earlyBirdConfirmed,
            cancellationPolicyAccepted: booking.cancellationPolicyAccepted,
            createdAt: new Date(booking.createdAt)
          }));
          const allBookings = [...bookings2, ...validSheetsBookings];
          const uniqueBookings = allBookings.reduce((acc, booking) => {
            const existing = acc.find((b) => b.email === booking.email && b.createdAt === booking.createdAt);
            if (!existing) {
              acc.push(booking);
            }
            return acc;
          }, []);
          bookings2 = uniqueBookings;
        } catch (error) {
          console.error("Error fetching from Google Sheets:", error);
        }
      }
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });
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
  app.get("/api/debug/test-sheets", async (req, res) => {
    try {
      await googleDriveStorage.saveBookingToSheets({
        fullName: "Test Connection",
        email: "test@sheets.com",
        telephone: "1234567890",
        receiptPath: "",
        earlyBirdConfirmed: false,
        cancellationPolicyAccepted: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      const bookings2 = await googleDriveStorage.getBookingsFromSheets();
      res.json({
        success: true,
        message: "Google Sheets connection working!",
        bookingsCount: bookings2.length,
        sheetsId: "1XNcktdtttVYDnXwCHg_4te51ym60V9XBovU8j_Bo55w"
      });
    } catch (error) {
      console.error("Google Sheets connection error:", error);
      res.json({
        success: false,
        error: error.message,
        message: "Please share the sheet with: tonelabs@astute-atlas-469008-j9.iam.gserviceaccount.com"
      });
    }
  });
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "tonelab2025";
      if (password === adminPassword) {
        res.cookie("admin_auth", "authenticated", {
          httpOnly: true,
          secure: false,
          // Allow HTTP for development
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1e3
          // 24 hours
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
  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("admin_auth");
    res.json({ success: true });
  });
  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const bookings2 = await storage.getAllBookings();
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const stats = {
        totalBookings: bookings2.length,
        totalRevenue: bookings2.length * 890,
        // 890 THB per booking
        todayBookings: bookings2.filter(
          (booking) => new Date(booking.createdAt) >= today
        ).length,
        pendingPayments: bookings2.filter((booking) => !booking.receiptPath).length
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  app.get("/api/admin/recent-bookings", requireAdminAuth, async (req, res) => {
    try {
      let bookings2 = await dataStorage.getAllBookings();
      if (useGoogleSheets) {
        try {
          const sheetsBookings = await googleDriveStorage.getBookingsFromSheets();
          const validSheetsBookings = sheetsBookings.filter(
            (booking) => booking.bookingId && booking.fullName && booking.email && typeof booking.bookingId === "string"
          ).map((booking) => ({
            id: booking.bookingId || "unknown",
            fullName: booking.fullName,
            telephone: booking.telephone,
            email: booking.email,
            receiptPath: booking.receiptPath || null,
            earlyBirdConfirmed: booking.earlyBirdConfirmed,
            cancellationPolicyAccepted: booking.cancellationPolicyAccepted,
            createdAt: new Date(booking.createdAt)
          }));
          const allBookings = [...bookings2, ...validSheetsBookings];
          const uniqueBookings = allBookings.reduce((acc, booking) => {
            const existing = acc.find((b) => b.email === booking.email && b.createdAt === booking.createdAt);
            if (!existing) {
              acc.push(booking);
            }
            return acc;
          }, []);
          bookings2 = uniqueBookings;
        } catch (error) {
          console.error("Failed to fetch Google Sheets data for recent bookings:", error);
        }
      }
      const recentBookings = bookings2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
      res.json(recentBookings);
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
      res.status(500).json({ error: "Failed to fetch recent bookings" });
    }
  });
  app.delete("/api/bookings/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Attempting to delete booking: ${id}`);
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
      const bookings2 = await storage.getAllBookings();
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });
  app.get("/api/admin/recent-bookings", requireAdminAuth, async (req, res) => {
    try {
      const bookings2 = await storage.getAllBookings();
      const recentBookings = bookings2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
      res.json(recentBookings);
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
      res.status(500).json({ error: "Failed to fetch recent bookings" });
    }
  });
  const httpServer = createServer(app);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
config({ path: ".env.local" });
async function createServer2() {
  const app = express2();
  app.use(express2.json());
  app.use(express2.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    const start = Date.now();
    const path4 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path4.startsWith("/api")) {
        let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "\u2026";
        }
        log(logLine);
      }
    });
    next();
  });
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  return app;
}
if (!process.env.NETLIFY) {
  createServer2().then((app) => {
    const port = parseInt(process.env.PORT || "5000", 10);
    app.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
    });
  });
}
export {
  createServer2 as createServer
};
