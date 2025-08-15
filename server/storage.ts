import { bookings, type Booking, type InsertBooking } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  deleteBooking(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }
}

// Keep MemStorage as fallback for development
export class MemStorage implements IStorage {
  private bookings: Map<string, Booking>;

  constructor() {
    this.bookings = new Map();
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      ...insertBooking,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      receiptPath: insertBooking.receiptPath || null,
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async deleteBooking(id: string): Promise<void> {
    this.bookings.delete(id);
  }
}

export const storage = new DatabaseStorage();
