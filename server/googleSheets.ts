import { google } from 'googleapis';
import type { Booking } from '@shared/schema';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const SHEET_NAME = 'Bookings';

// Initialize Google Sheets API
const getGoogleSheetsClient = () => {
  const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!credentials) {
    throw new Error('GOOGLE_SHEETS_CREDENTIALS environment variable is required');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

// Create headers row if sheet is empty
export async function initializeSheet(): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Check if sheet exists and has headers
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:H1`,
    });

    if (!response.data.values || response.data.values.length === 0) {
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:H1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'ID',
            'Full Name',
            'Email',
            'Phone',
            'Receipt Path',
            'Early Bird',
            'Policy Accepted',
            'Created At'
          ]],
        },
      });
    }
  } catch (error) {
    console.error('Error initializing Google Sheet:', error);
    throw error;
  }
}

// Add a booking to Google Sheets
export async function addBookingToSheet(booking: Booking): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          booking.id,
          booking.fullName,
          booking.email,
          booking.telephone,
          booking.receiptPath || '',
          booking.earlyBirdConfirmed ? 'Yes' : 'No',
          booking.cancellationPolicyAccepted ? 'Yes' : 'No',
          booking.createdAt.toISOString()
        ]],
      },
    });
  } catch (error) {
    console.error('Error adding booking to Google Sheet:', error);
    throw error;
  }
}

// Get all bookings from Google Sheets
export async function getAllBookingsFromSheet(): Promise<Booking[]> {
  try {
    const sheets = getGoogleSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:H`, // Skip header row
    });

    if (!response.data.values) {
      return [];
    }

    return response.data.values.map((row: any[]) => ({
      id: row[0] || '',
      fullName: row[1] || '',
      email: row[2] || '',
      telephone: row[3] || '',
      receiptPath: row[4] || null,
      earlyBirdConfirmed: row[5] === 'Yes',
      cancellationPolicyAccepted: row[6] === 'Yes',
      createdAt: new Date(row[7] || Date.now()),
    }));
  } catch (error) {
    console.error('Error getting bookings from Google Sheet:', error);
    throw error;
  }
}

// Get a specific booking from Google Sheets
export async function getBookingFromSheet(bookingId: string): Promise<Booking | null> {
  try {
    const bookings = await getAllBookingsFromSheet();
    return bookings.find(booking => booking.id === bookingId) || null;
  } catch (error) {
    console.error('Error getting booking from Google Sheet:', error);
    throw error;
  }
}