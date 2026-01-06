import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { randomUUID } from 'crypto';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

async function backfillAwardIds() {
  console.log('Starting award ID backfill...');

  // Setup auth
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });

  // Load spreadsheet
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
  await doc.loadInfo();
  console.log(`Loaded spreadsheet: ${doc.title}`);

  // Get the Awards sheet
  const sheet = doc.sheetsByTitle['Awards'] || doc.sheetsByIndex[0];
  console.log(`Working with sheet: ${sheet.title}`);

  const rows = await sheet.getRows();
  console.log(`Found ${rows.length} awards`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const currentId = row.get('awardId');

    if (!currentId || currentId.trim() === '') {
      // Generate new UUID
      const newId = `award-${randomUUID()}`;
      row.set('awardId', newId);
      await row.save();
      console.log(`✓ Row ${row.rowNumber}: ${row.get('Award or Prize')} -> ${newId}`);
      updated++;
    } else {
      console.log(`- Row ${row.rowNumber}: Already has ID: ${currentId}`);
      skipped++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total awards: ${rows.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already had ID): ${skipped}`);
  console.log('\nDone!');
}

backfillAwardIds().catch(console.error);
