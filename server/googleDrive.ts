import { google } from 'googleapis';

// Initialize Google API clients using JSON file
import * as fs from 'fs';
import * as path from 'path';

let credentials;
try {
  const credentialsPath = path.resolve('./credentials.json');
  credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  console.log('Google credentials loaded successfully from file');
} catch (error) {
  console.error('Error loading credentials file:', error);
  credentials = {};
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ]
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1XNcktdtttVYDnXwCHg_4te51ym60V9XBovU8j_Bo55w';

export interface BookingData {
  bookingId?: string;
  fullName: string;
  email: string;
  telephone: string;
  receiptPath?: string;
  earlyBirdConfirmed: boolean;
  cancellationPolicyAccepted: boolean;
  createdAt: string;
}

export class GoogleDriveStorage {
  async saveBookingToSheets(bookingData: BookingData): Promise<void> {
    if (!SPREADSHEET_ID) {
      throw new Error('Google Sheets ID not configured');
    }

    const values = [[
      bookingData.bookingId || '',
      new Date().toISOString(),
      bookingData.fullName,
      bookingData.email,
      bookingData.telephone,
      bookingData.receiptPath || '',
      bookingData.earlyBirdConfirmed ? 'Yes' : 'No',
      bookingData.cancellationPolicyAccepted ? 'Yes' : 'No'
    ]];

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      throw error;
    }
  }

  async getBookingsFromSheets(): Promise<BookingData[]> {
    if (!SPREADSHEET_ID) {
      return [];
    }

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:H',
      });

      const rows = response.data.values || [];
      
      // Skip header row if exists, convert to booking data
      return rows.slice(1).map(row => ({
        createdAt: row[0] || '',
        fullName: row[1] || '',
        email: row[2] || '',
        telephone: row[3] || '',
        receiptPath: row[4] || '',
        earlyBirdConfirmed: row[5] === 'Yes',
        cancellationPolicyAccepted: row[6] === 'Yes'
      }));
    } catch (error) {
      console.error('Error reading from Google Sheets:', error);
      return [];
    }
  }

  async uploadReceiptToDrive(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    try {
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          // parents: ['your-folder-id'], // You can create a specific folder for receipts later
        },
        media: {
          mimeType,
          body: file,
        },
      });

      const fileId = response.data.id;
      
      // Make file publicly accessible
      await drive.permissions.create({
        fileId: fileId!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return `https://drive.google.com/file/d/${fileId}/view`;
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw error;
    }
  }
}

export const googleDriveStorage = new GoogleDriveStorage();