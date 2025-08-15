import type { IStorage } from './storage';
import type { Booking, InsertBooking } from '@shared/schema';
import { 
  initializeSheet, 
  addBookingToSheet, 
  getAllBookingsFromSheet, 
  getBookingFromSheet 
} from './googleSheets';
import { randomUUID } from 'crypto';

export class GoogleSheetsStorage implements IStorage {
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      await initializeSheet();
      this.initialized = true;
    }
  }

  async createBooking(data: InsertBooking): Promise<Booking> {
    await this.ensureInitialized();
    
    const booking: Booking = {
      id: randomUUID(),
      ...data,
      receiptPath: data.receiptPath || null,
      createdAt: new Date(),
    };

    await addBookingToSheet(booking);
    return booking;
  }

  async getBooking(id: string): Promise<Booking | null> {
    await this.ensureInitialized();
    const booking = await getBookingFromSheet(id);
    return booking || null;
  }

  async getAllBookings(): Promise<Booking[]> {
    await this.ensureInitialized();
    return await getAllBookingsFromSheet();
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | null> {
    // For Google Sheets, we'd need to find the row and update it
    // This is more complex with Google Sheets API, so keeping simple for now
    console.warn('Update operation not implemented for Google Sheets storage');
    return null;
  }

  async deleteBooking(id: string): Promise<boolean> {
    // For Google Sheets, we'd need to find the row and delete it
    // This is more complex with Google Sheets API, so keeping simple for now
    console.warn('Delete operation not implemented for Google Sheets storage');
    return false;
  }
}