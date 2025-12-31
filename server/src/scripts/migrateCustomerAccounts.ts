import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Usage:
//   ORG_ID=<orgId> npm run migrate:accounts
// Or:
//   npx ts-node server/src/scripts/migrateCustomerAccounts.ts --org=<orgId>
// Or with dry-run:
//   npx ts-node server/src/scripts/migrateCustomerAccounts.ts --org=<orgId> --dry-run

// Placeholder bank account values (same as CreateCustomer use case)
const PLACEHOLDER_ACCOUNT_NO = '0000000000';
const PLACEHOLDER_IFSC = 'PLHR0000000';
const PLACEHOLDER_UPI = 'placeholder@upi';

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

async function main() {
  const argv = process.argv.slice(2);
  let orgId = '';
  let dryRun = false;

  for (const a of argv) {
    if (a.startsWith('--org=')) orgId = a.split('=')[1];
    if (a === '--org') {
      const idx = argv.indexOf(a);
      orgId = argv[idx + 1] || '';
    }
    if (a === '--dry-run' || a === '--dryrun') dryRun = true;
  }

  // Check environment variable if not provided via CLI
  if (!orgId) {
    orgId = process.env.ORG_ID || process.env.ORGANIZATION_ID || '';
  }

  if (!orgId || orgId === '') {
    console.error('Organization ID (--org) is required');
    process.exit(1);
  }

  console.log('========================================');
  console.log('Customer Account Migration');
  console.log('========================================');
  console.log('Organization ID:', orgId);
  console.log('Mode:', dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE');
  console.log('========================================\n');

  const customersCollection = firestore.collection('customers');
  const accountsCollection = firestore.collection('accounts');

  // Get all customers for the organization that need account migration
  const customersSnapshot = await customersCollection
    .where('org_id', '==', orgId)
    .where('is_deleted', '==', false)
    .get();

  console.log(`Found ${customersSnapshot.size} customers in organization\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const BATCH_LIMIT = 400;
  let batch = firestore.batch();
  let batchCount = 0;

  for (const customerDoc of customersSnapshot.docs) {
    const customerId = customerDoc.id;
    const customerData = customerDoc.data();
    const customerName = customerData.name || 'Unknown';
    const existingAccountId = customerData.account_id;

    // Skip customers that don't have an account_id
    if (!existingAccountId) {
      console.log(`⊘ [${customerId}] ${customerName} - No account_id, skipping`);
      skippedCount++;
      continue;
    }

    // Check if the existing account uses UUID format (8-4-4-4-12 characters)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingAccountId);
    
    if (isUUID) {
      console.log(`✓ [${customerId}] ${customerName} - Already has UUID account (${existingAccountId}), skipping`);
      skippedCount++;
      continue;
    }

    try {
      const now = admin.firestore.Timestamp.now();
      
      // Create new UUID-based account
      const newAccountId = uuidv4();
      
      // Fetch the old account data if it exists
      let oldAccountData: any = null;
      try {
        const oldAccountDoc = await accountsCollection.doc(existingAccountId).get();
        if (oldAccountDoc.exists) {
          oldAccountData = oldAccountDoc.data();
        }
      } catch (err) {
        console.log(`  ⚠ Warning: Could not fetch old account ${existingAccountId}`);
      }

      // Create new account with UUID, preserving old data or using placeholders
      const newAccountData: any = {
        org_id: orgId,
        account_no: oldAccountData?.account_no || PLACEHOLDER_ACCOUNT_NO,
        ifsc_code: oldAccountData?.ifsc_code || PLACEHOLDER_IFSC,
        upi_id: oldAccountData?.upi_id || PLACEHOLDER_UPI,
        bank_name: oldAccountData?.bank_name || '',
        branch_name: oldAccountData?.branch_name || '',
        is_active: oldAccountData?.is_active ?? true,
        created_by: oldAccountData?.created_by || 'migration',
        updated_by: 'migration',
        created_at: oldAccountData?.created_at || now,
        updated_at: now,
        archived_at: oldAccountData?.archived_at || null,
      };

      if (!dryRun) {
        // Add new account to batch
        const newAccountRef = accountsCollection.doc(newAccountId);
        batch.set(newAccountRef, newAccountData);
        batchCount++;

        // Update customer to reference new account
        const customerRef = customersCollection.doc(customerId);
        batch.update(customerRef, {
          account_id: newAccountId,
          updated_by: 'migration',
          updated_at: now,
        });
        batchCount++;

        // Commit batch if limit reached
        if (batchCount >= BATCH_LIMIT) {
          await batch.commit();
          console.log(`  → Committed batch of ${batchCount} operations`);
          batch = firestore.batch();
          batchCount = 0;
        }
      }

      console.log(`✓ [${customerId}] ${customerName}`);
      console.log(`  Old Account: ${existingAccountId}`);
      console.log(`  New Account: ${newAccountId}`);
      if (dryRun) {
        console.log(`  (Would create new account and update customer)`);
      }

      migratedCount++;
    } catch (error) {
      console.error(`✗ [${customerId}] ${customerName} - Error:`, error);
      errorCount++;
    }
  }

  // Commit any remaining operations
  if (!dryRun && batchCount > 0) {
    await batch.commit();
    console.log(`\n→ Committed final batch of ${batchCount} operations`);
  }

  console.log('\n========================================');
  console.log('Migration Complete!');
  console.log('========================================');
  console.log(`Total customers: ${customersSnapshot.size}`);
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  if (dryRun) {
    console.log('\n⚠ DRY RUN - No changes were made');
    console.log('Run without --dry-run to apply changes');
  }
  console.log('========================================\n');

  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
