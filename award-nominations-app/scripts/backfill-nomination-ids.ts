import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { randomUUID } from 'crypto';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

async function backfillNominationIds() {
  console.log('Starting nomination ID backfill...');

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

  // Get the Nominations sheet
  const sheet = doc.sheetsByTitle['Nominations'];
  if (!sheet) {
    console.error('Nominations sheet not found!');
    return;
  }

  console.log(`Working with sheet: ${sheet.title}`);

  const rows = await sheet.getRows();
  console.log(`Found ${rows.length} nominations`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const currentId = row.get('id');

    if (!currentId || currentId.trim() === '') {
      // Generate new UUID
      const newId = `nomination-${randomUUID()}`;
      row.set('id', newId);
      await row.save();
      console.log(`✓ Row ${row.rowNumber}: ${row.get('candidateName')} -> ${newId}`);
      updated++;
    } else {
      console.log(`- Row ${row.rowNumber}: Already has ID: ${currentId}`);
      skipped++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total nominations: ${rows.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already had ID): ${skipped}`);
  console.log('\nDone!');
}

backfillNominationIds().catch(console.error);
