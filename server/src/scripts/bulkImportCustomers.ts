import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Usage:
//   ORG_ID=<orgId> npm run import:customers -- --csv=./customer.csv
// Or without npm script:
//   ORG_ID=<orgId> npx ts-node server/src/scripts/importCustomers.ts --csv=./customer.csv

const DEFAULT_PHONE = '9332100485';
const DEFAULT_EMAIL = 'esanchar@gmail.com';

// Regex pattern for Indian GSTIN: 2 digits (state code) + 10 alphanumeric (PAN) + 1 digit (entity number) + 1 letter (Z) + 1 alphanumeric (checksum)
// Format: ##AAAAAAAAAA#A# (15 characters total)
const GSTIN_REGEX = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/g;

// Initialize Firebase Admin SDK with proper credential lookup
if (!admin.apps.length) {
  try {
    // Method 1: JSON string in environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      console.log('Using Firebase credentials from FIREBASE_SERVICE_ACCOUNT_JSON');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // Method 2: Path to service account file
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
      console.log('Using Firebase credentials from FIREBASE_SERVICE_ACCOUNT_PATH');
      const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // Method 3: Standard Google credentials environment variable
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Using Firebase credentials from GOOGLE_APPLICATION_CREDENTIALS');
      admin.initializeApp();
    }
    // Method 4: Manual configuration from individual env vars
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('Using Firebase credentials from individual env vars');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        })
      });
    }
    // Method 5: Look for firestore-creds.json in server directory
    else if (fs.existsSync(path.join(__dirname, '../../firestore-creds.json'))) {
      const credPath = path.join(__dirname, '../../firestore-creds.json');
      console.log('Using Firebase credentials from', credPath);
      const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // Method 6: Look for firestore-creds.json in current directory (when run from workspace root)
    else if (fs.existsSync('server/firestore-creds.json')) {
      console.log('Using Firebase credentials from server/firestore-creds.json');
      const serviceAccount = JSON.parse(fs.readFileSync('server/firestore-creds.json', 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    // Fallback: Default initialization
    else {
      console.log('Attempting default Firebase initialization');
      admin.initializeApp();
    }

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

const firestore = admin.firestore();
firestore.settings({ ignoreUndefinedProperties: false });

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [''];
  let i = 0;
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        // lookahead for escaped quote
        if (i + 1 < text.length && text[i + 1] === '"') {
          cur[cur.length - 1] += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      // keep newlines and commas inside quotes
      cur[cur.length - 1] += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ',') {
      cur.push('');
      i++;
      continue;
    }

    if (ch === '\r') {
      // ignore CR, treat CRLF as newline
      i++;
      continue;
    }

    if (ch === '\n') {
      // end of row
      rows.push(cur.map(f => f.trim()));
      cur = [''];
      i++;
      continue;
    }

    cur[cur.length - 1] += ch;
    i++;
  }
  // push last row if not empty
  if (!(cur.length === 1 && cur[0] === '')) {
    rows.push(cur.map(f => f.trim()));
  }
  return rows;
}

function findHeaderIndex(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const r = rows[i].map(c => (c || '').toLowerCase());
    if (r.includes('customer full name') || r.includes('customer full name'.toLowerCase())) return i;
    if (r.includes('customer contact list')) return i;
    if (r.includes('customer full name') || r.includes('customer')) return i;
  }
  // fallback: assume header is at row 0
  return 0;
}

async function main() {
  const argv = process.argv.slice(2);
  let csvPathArg = '';
  let limitArg = 0;
  for (const a of argv) {
    if (a.startsWith('--csv=')) csvPathArg = a.split('=')[1];
    if (a === '--csv') {
      const idx = argv.indexOf(a);
      csvPathArg = argv[idx + 1] || '';
    }
    if (a.startsWith('--limit=')) limitArg = parseInt(a.split('=')[1], 10);
  }

  const csvPath = csvPathArg || path.resolve(process.cwd(), 'customer.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found at', csvPath);
    process.exit(1);
  }

  console.log('Reading CSV:', csvPath);
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);
  if (!rows.length) {
    console.error('No rows parsed from CSV');
    process.exit(1);
  }

  const headerIdx = findHeaderIndex(rows);
  const header = rows[headerIdx];
  console.log('Header found at row', headerIdx + 1, 'columns:', header.length);

  const dataRows = rows.slice(headerIdx + 1);

  const orgId = process.env.ORG_ID || process.env.ORGANIZATION_ID || 'default-org';
  console.log('========================================');
  console.log('Starting Customer Import');
  console.log('========================================');
  console.log('Organization ID:', orgId);
  console.log('CSV file:', csvPath);
  console.log('Total rows:', dataRows.length);
  if (limitArg > 0) console.log('LIMIT (TEST MODE):', limitArg);
  console.log('========================================\n');

  const collection = firestore.collection('customers');

  // Batch writes in groups of 400
  let batch = firestore.batch();
  let count = 0;
  let total = 0;
  const BATCH_LIMIT = 400;

  for (const r of dataRows) {
    // Stop if limit reached
    if (limitArg > 0 && total >= limitArg) {
      console.log(`\n⚠ Limit of ${limitArg} customers reached. Stopping.\n`);
      break;
    }
    // Skip blank rows
    if (r.every(c => !c || c === '')) continue;

    // Columns based on sample: [Customer full name,Phone numbers,Email,Full name,...]
    const nameCol0 = (r[0] || '').trim();
    const phoneCol = (r[1] || '').trim();
    const emailCol = (r[2] || '').trim();
    const nameCol3 = (r[3] || '').trim();

    const name = nameCol0 || nameCol3 || '';
    if (!name) continue; // skip rows without a name

    const phone = phoneCol || DEFAULT_PHONE;
    const email = emailCol || DEFAULT_EMAIL;

    // Search for GSTIN in all columns of the row
    let gstin: string | undefined = undefined;
    const rowText = r.join(' ');
    const gstinMatches = rowText.match(GSTIN_REGEX);
    if (gstinMatches && gstinMatches.length > 0) {
      gstin = gstinMatches[0]; // Take first match
    }

    const now = admin.firestore.Timestamp.now();

    const docData: any = {
      org_id: orgId,
      name,
      phone,
      email,
      total_bookings: 0,
      total_spent: 0,
      created_by: 'import-script',
      updated_by: 'import-script',
      is_deleted: false,
      created_at: now,
      updated_at: now,
    };

    // Add GSTIN if found
    if (gstin) {
      docData.gstin = gstin;
    }

    const docRef = collection.doc();
    batch.set(docRef, docData);
    count++;
    total++;

    const gstinInfo = gstin ? ` | GSTIN: ${gstin}` : '';
    console.log(`[${total}] Adding customer: ${name} | Phone: ${phone} | Email: ${email}${gstinInfo}`);

    if (count >= BATCH_LIMIT) {
      await batch.commit();
      console.log(`✓ Committed batch of ${count} documents (Total: ${total})`);
      batch = firestore.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`✓ Committed final batch of ${count} documents (Total: ${total})`);
  }

  console.log(`\n========================================`);
  console.log(`✓ Import complete!`);
  console.log(`  Total customers added: ${total}`);
  console.log(`  Organization ID: ${orgId}`);
  console.log(`========================================\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
