/**
 * Verification script to test Phase 1 setup
 * Run with: npx tsx scripts/verify-setup.ts
 */

import { bvaApiClient } from '../lib/bva-api/client';
import { qdrantClient, initializeCollections } from '../lib/vector/client';
import { db, client as dbClient } from '../lib/db/client';
import { decisions } from '../lib/db/schema';

async function main() {
  console.log('🔍 Verifying BVA Decision Intelligence Platform Setup\n');

  let allPassed = true;

  // Test 1: BVA API Connection
  console.log('1. Testing BVA API connection...');
  try {
    const health = await bvaApiClient.healthCheck();
    if (health) {
      console.log('   ✅ BVA API is reachable');
    } else {
      console.log('   ❌ BVA API health check failed');
      allPassed = false;
    }
  } catch (error) {
    console.log('   ❌ BVA API connection error:', error);
    allPassed = false;
  }

  // Test 2: BVA API Search
  console.log('\n2. Testing BVA API search...');
  try {
    const result = await bvaApiClient.searchDecisions({
      query: 'veteran',
      limit: 1,
    });
    console.log(`   ✅ Search works - found ${result.count} total decisions`);
    if (result.decisions.length > 0) {
      console.log(`   Sample decision: ${result.decisions[0].citation_number}`);
    }
  } catch (error) {
    console.log('   ❌ BVA API search error:', error);
    allPassed = false;
  }

  // Test 3: SQLite Database
  console.log('\n3. Testing SQLite database...');
  try {
    // Simple query to test connection
    const result = await dbClient.execute('SELECT 1 as test');
    console.log('   ✅ SQLite database is accessible');

    // Check decisions table
    const count = await db.select().from(decisions);
    console.log(`   Current decisions in database: ${count.length}`);
  } catch (error) {
    console.log('   ❌ SQLite database error:', error);
    allPassed = false;
  }

  // Test 4: Qdrant Connection
  console.log('\n4. Testing Qdrant connection...');
  try {
    const collections = await qdrantClient.getCollections();
    console.log('   ✅ Qdrant is accessible');
    console.log(`   Existing collections: ${collections.collections.map(c => c.name).join(', ') || 'none'}`);
  } catch (error) {
    console.log('   ❌ Qdrant connection error:', error);
    console.log('   Make sure Qdrant is running: docker-compose up -d');
    allPassed = false;
  }

  // Test 5: Initialize Qdrant Collections
  console.log('\n5. Initializing Qdrant collections...');
  try {
    await initializeCollections();
    console.log('   ✅ Qdrant collections initialized');
  } catch (error) {
    console.log('   ❌ Collection initialization error:', error);
    allPassed = false;
  }

  // Test 6: Environment Variables
  console.log('\n6. Checking environment variables...');
  const envVars = [
    { name: 'OPENROUTER_API_KEY', required: true },
    { name: 'QDRANT_URL', required: false },
    { name: 'BVA_API_BASE_URL', required: false },
    { name: 'DATABASE_URL', required: false },
  ];

  for (const envVar of envVars) {
    const value = process.env[envVar.name];
    if (value) {
      const display = envVar.name === 'OPENROUTER_API_KEY'
        ? value.slice(0, 10) + '...'
        : value;
      console.log(`   ✅ ${envVar.name}: ${display}`);
    } else if (envVar.required) {
      console.log(`   ❌ ${envVar.name}: NOT SET (required)`);
      allPassed = false;
    } else {
      console.log(`   ⚠️  ${envVar.name}: NOT SET (using default)`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All verification tests passed!');
    console.log('\nNext steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Run initial sync: Create and run scripts/sync.ts');
    console.log('3. Open http://localhost:3000');
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n💥 Verification failed with error:', error);
  process.exit(1);
});
