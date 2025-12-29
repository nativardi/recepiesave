/**
 * Setup Supabase resources programmatically:
 * - Apply database migrations
 * - Create storage buckets
 * - Set up storage policies
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📝 Applying migration 004_update_recipe_status_enum.sql...');

  const migrationPath = join(process.cwd(), 'supabase/migrations/004_update_recipe_status_enum.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  try {
    // Execute SQL via RPC function
    // Note: This requires a custom RPC function in Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.log('⚠️  exec_sql function not available. Skipping migration.');
      console.log('   Please apply migration manually via Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/vrmcsskflsvxcujunevm/sql/new');
      return false;
    }

    console.log('✅ Migration applied successfully');
    return true;
  } catch (error) {
    console.log('⚠️  Could not apply migration automatically');
    console.log('   Please apply migration manually via Supabase SQL Editor');
    return false;
  }
}

async function createStorageBuckets() {
  console.log('\n📦 Creating storage buckets...');

  const buckets = [
    {
      name: 'recipe-thumbnails',
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    },
    {
      name: 'recipe-audio',
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav']
    }
  ];

  for (const bucket of buckets) {
    console.log(`  Creating bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})...`);

    const { data, error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`  ⚠️  Bucket ${bucket.name} already exists`);
      } else {
        console.error(`  ✗ Failed to create bucket ${bucket.name}:`, error.message);
      }
    } else {
      console.log(`  ✅ Created bucket: ${bucket.name}`);
    }
  }
}

async function setupStoragePolicies() {
  console.log('\n🔒 Setting up storage policies...');

  console.log('  Note: Storage policies are typically managed via Supabase Dashboard');
  console.log('  Public bucket (recipe-thumbnails): accessible to all');
  console.log('  Private bucket (recipe-audio): accessible only to authenticated users');

  // Storage policies require SQL execution or Dashboard configuration
  // For now, we'll document what needs to be set up

  console.log('\n  Policies needed:');
  console.log('  1. recipe-thumbnails:');
  console.log('     - Public read access for all users');
  console.log('     - Authenticated users can upload to their own folder');
  console.log('  2. recipe-audio:');
  console.log('     - Authenticated users can read their own files');
  console.log('     - Service role can read/write all files');
}

async function main() {
  console.log('🚀 Starting Supabase setup...\n');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: SUPABASE credentials not found');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }

  console.log(`📍 Supabase URL: ${supabaseUrl}`);

  // Step 1: Apply migration (if possible)
  await applyMigration();

  // Step 2: Create storage buckets
  await createStorageBuckets();

  // Step 3: Document storage policies
  await setupStoragePolicies();

  console.log('\n✨ Supabase setup complete!');
}

main().catch(console.error);
