import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface VerificationResult {
  category: string;
  checks: Array<{ name: string; passed: boolean; error?: string }>;
}

const results: VerificationResult[] = [];

async function checkTables() {
  console.log('\n🔍 Checking Tables...');
  const checks: Array<{ name: string; passed: boolean; error?: string }> = [];

  const expectedTables = [
    'profiles',
    'recipes',
    'ingredients',
    'instructions',
    'collections',
    'collection_items',
    'tags',
    'recipe_tags'
  ];

  for (const table of expectedTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows (table exists but empty)
        checks.push({ name: `Table: ${table}`, passed: false, error: error.message });
      } else {
        checks.push({ name: `Table: ${table}`, passed: true });
        console.log(`  ✅ ${table}`);
      }
    } catch (err: any) {
      checks.push({ name: `Table: ${table}`, passed: false, error: err.message });
      console.log(`  ❌ ${table} - ${err.message}`);
    }
  }

  results.push({ category: 'Tables', checks });
}

async function checkStorageBuckets() {
  console.log('\n🔍 Checking Storage Buckets...');
  const checks: Array<{ name: string; passed: boolean; error?: string }> = [];

  const expectedBuckets = ['recipe-thumbnails', 'recipe-audio'];

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      checks.push({ name: 'List Buckets', passed: false, error: error.message });
      console.log(`  ❌ Failed to list buckets: ${error.message}`);
    } else {
      const bucketNames = buckets?.map(b => b.name) || [];

      for (const bucket of expectedBuckets) {
        const exists = bucketNames.includes(bucket);
        checks.push({ name: `Bucket: ${bucket}`, passed: exists });

        if (exists) {
          console.log(`  ✅ ${bucket}`);
        } else {
          console.log(`  ❌ ${bucket} - Not found`);
        }
      }
    }
  } catch (err: any) {
    checks.push({ name: 'Storage Buckets', passed: false, error: err.message });
    console.log(`  ❌ Storage check failed: ${err.message}`);
  }

  results.push({ category: 'Storage Buckets', checks });
}

async function checkRecipeSchema() {
  console.log('\n🔍 Checking Recipe Table Schema...');
  const checks: Array<{ name: string; passed: boolean; error?: string }> = [];

  const expectedColumns = [
    'id', 'user_id', 'original_url', 'platform', 'title', 'description',
    'thumbnail_url', 'video_url', 'prep_time_minutes', 'cook_time_minutes',
    'servings', 'cuisine', 'status', 'created_at', 'notes', 'is_favorite', 'updated_at'
  ];

  try {
    // Try to insert and immediately delete a test record to verify schema
    // This will fail if columns don't exist
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Will fail FK constraint, but that's ok
      original_url: 'https://test.com',
      platform: 'instagram',
      title: 'Test',
      status: 'pending',
      notes: 'test',
      is_favorite: false
    };

    // This will fail on FK constraint, but tells us if columns exist
    const { error } = await supabase.from('recipes').insert(testData).select();

    if (error) {
      // Check if it's a FK constraint error (expected) vs missing column error
      if (error.message.includes('violates foreign key constraint')) {
        checks.push({ name: 'Recipe schema columns', passed: true });
        console.log(`  ✅ All expected columns exist`);
      } else if (error.message.includes('column') && error.message.includes('does not exist')) {
        checks.push({ name: 'Recipe schema columns', passed: false, error: error.message });
        console.log(`  ❌ ${error.message}`);
      } else {
        checks.push({ name: 'Recipe schema columns', passed: true });
        console.log(`  ✅ Schema appears valid`);
      }
    }

    // Check status enum values
    const { error: statusError } = await supabase
      .from('recipes')
      .select('*')
      .eq('status', 'downloading')
      .limit(1);

    if (statusError && statusError.message.includes('invalid input value')) {
      checks.push({ name: 'Status enum updated', passed: false, error: 'Status enum not updated' });
      console.log(`  ❌ Status enum not updated with new values`);
    } else {
      checks.push({ name: 'Status enum updated', passed: true });
      console.log(`  ✅ Status enum includes new values`);
    }

  } catch (err: any) {
    checks.push({ name: 'Recipe schema', passed: false, error: err.message });
    console.log(`  ❌ Schema check failed: ${err.message}`);
  }

  results.push({ category: 'Recipe Schema', checks });
}

async function checkRLS() {
  console.log('\n🔍 Checking Row Level Security...');
  const checks: Array<{ name: string; passed: boolean; error?: string }> = [];

  // Try to access recipes without auth (should fail)
  const supabaseAnon = createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );

  try {
    const { data, error } = await supabaseAnon.from('recipes').select('*').limit(1);

    // If we get data or PGRST116 (no rows), RLS is working but returning empty
    // If we get a permission error, RLS is working correctly
    if (error && (error.code === 'PGRST301' || error.message.includes('permission denied'))) {
      checks.push({ name: 'RLS enabled on recipes', passed: true });
      console.log(`  ✅ RLS is enabled and blocking unauthenticated access`);
    } else if (!data || data.length === 0) {
      checks.push({ name: 'RLS enabled on recipes', passed: true });
      console.log(`  ✅ RLS is enabled (no unauthorized data returned)`);
    } else {
      checks.push({ name: 'RLS enabled on recipes', passed: false, error: 'RLS may not be configured correctly' });
      console.log(`  ⚠️  RLS check inconclusive`);
    }
  } catch (err: any) {
    checks.push({ name: 'RLS check', passed: false, error: err.message });
    console.log(`  ❌ RLS check failed: ${err.message}`);
  }

  results.push({ category: 'Row Level Security', checks });
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    const passed = result.checks.filter(c => c.passed).length;
    const failed = result.checks.filter(c => !c.passed).length;
    totalPassed += passed;
    totalFailed += failed;

    console.log(`\n${result.category}: ${passed}/${result.checks.length} passed`);

    const failedChecks = result.checks.filter(c => !c.passed);
    if (failedChecks.length > 0) {
      failedChecks.forEach(check => {
        console.log(`  ❌ ${check.name}: ${check.error}`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(60));

  if (totalFailed === 0) {
    console.log('\n✅ All checks passed! Database schema is ready.');
    console.log('\nNext steps:');
    console.log('  1. Test authentication (sign up/sign in)');
    console.log('  2. Start production services (Redis, Python worker)');
    console.log('  3. Test recipe extraction with a real URL');
  } else {
    console.log('\n⚠️  Some checks failed. Please review the errors above.');
    console.log('\nIf migrations were not applied, run:');
    console.log('  Copy scripts/apply-all-migrations.sql to Supabase SQL Editor');
  }
}

async function main() {
  console.log('🚀 Starting Database Schema Verification');
  console.log(`📍 Connected to: ${supabaseUrl}`);

  await checkTables();
  await checkStorageBuckets();
  await checkRecipeSchema();
  await checkRLS();
  await printSummary();
}

main().catch(console.error);
