import { google } from 'googleapis';

// Initialize Google API clients
const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
const auth = new google.auth.JWT(
  credentials.client_email,
  undefined,
  credentials.private_key,
  [
    'https://www.googleapis.com/auth/forms',
    'https://www.googleapis.com/auth/spreadsheets'
  ]
);

const forms = google.forms({ version: 'v1', auth });

const GOOGLE_FORMS_ID = '1FAIpQLSftndGgCU1ag_EPX_eRkH0Amhi5ictUx_VBY08RMm7jUKgMmA';

export async function getConnectedSheetsId(): Promise<string | null> {
  console.log('Using Google Forms ID:', GOOGLE_FORMS_ID);
  
  if (!GOOGLE_FORMS_ID) {
    console.log('No Google Forms ID configured');
    return null;
  }

  try {
    // Get form information
    const response = await forms.forms.get({
      formId: GOOGLE_FORMS_ID
    });

    const form = response.data;
    console.log('Form title:', form.info?.title);
    
    // Check if form has linked sheets
    if (form.linkedSheetId) {
      console.log('Found connected Google Sheets ID:', form.linkedSheetId);
      return form.linkedSheetId;
    } else {
      console.log('No connected Google Sheets found for this form');
      return null;
    }
  } catch (error) {
    console.error('Error accessing Google Forms:', error);
    return null;
  }
}

export async function getFormResponses() {
  if (!GOOGLE_FORMS_ID) {
    console.log('No Google Forms ID configured');
    return [];
  }

  try {
    const response = await forms.forms.responses.list({
      formId: GOOGLE_FORMS_ID
    });

    return response.data.responses || [];
  } catch (error) {
    console.error('Error fetching form responses:', error);
    return [];
  }
}