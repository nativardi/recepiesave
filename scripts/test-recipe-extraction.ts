import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRecipeExtraction(testUrl: string) {
  const TEST_URL = testUrl;
  console.log('🧪 Testing End-to-End Recipe Extraction\n');
  console.log('📍 URL:', TEST_URL);
  console.log('');

  let testUserId: string | null = null;
  let recipeId: string | null = null;

  try {
    // Step 1: Create a test user and profile
    console.log('1️⃣  Creating test user...');

    const testEmail = `extraction-test-${Date.now()}@saveittest.com`;
    const testPassword = 'TestPassword123!';

    const { data: userData, error: createUserError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Extraction Test User'
      }
    });

    if (createUserError) {
      console.error('❌ Failed to create user:', createUserError.message);
      return;
    }

    testUserId = userData.user.id;
    console.log('✅ Test user created');
    console.log(`   User ID: ${testUserId}`);

    // Create profile manually (since trigger may not work)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: testUserId,
      email: testEmail,
      full_name: 'Extraction Test User'
    });

    if (profileError) {
      console.error('❌ Failed to create profile:', profileError.message);
      return;
    }

    console.log('✅ Profile created\n');

    // Step 2: Submit recipe extraction request
    console.log('2️⃣  Submitting recipe extraction request...');

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: testUserId,
        original_url: TEST_URL,
        platform: 'instagram',
        title: 'Pending Extraction',
        status: 'pending'
      })
      .select()
      .single();

    if (recipeError) {
      console.error('❌ Failed to create recipe:', recipeError.message);
      return;
    }

    recipeId = recipe.id;
    console.log('✅ Recipe created');
    console.log(`   Recipe ID: ${recipeId}`);
    console.log(`   Status: ${recipe.status}\n`);

    // Step 3: Call the extraction API
    console.log('3️⃣  Triggering recipe extraction...');

    const extractResponse = await fetch('http://localhost:3000/api/recipes/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: TEST_URL,
        userId: testUserId
      })
    });

    const extractResult = await extractResponse.json();

    if (!extractResponse.ok) {
      console.error('❌ Extraction API failed:', extractResult);
      return;
    }

    console.log('✅ Extraction job queued');
    console.log(`   Job ID: ${extractResult.jobId}`);
    console.log(`   Recipe ID: ${extractResult.recipeId}\n`);

    recipeId = extractResult.recipeId;

    // Step 4: Poll status until completion or failure
    console.log('4️⃣  Monitoring extraction progress...\n');

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    let currentStatus = 'pending';

    while (attempts < maxAttempts) {
      attempts++;

      const { data: statusData, error: statusError } = await supabase
        .from('recipes')
        .select('status, title, description')
        .eq('id', recipeId)
        .single();

      if (statusError) {
        console.error('❌ Failed to check status:', statusError.message);
        break;
      }

      if (statusData.status !== currentStatus) {
        currentStatus = statusData.status;
        const timestamp = new Date().toLocaleTimeString();
        console.log(`   [${timestamp}] Status: ${currentStatus}`);

        if (currentStatus === 'completed') {
          console.log('\n✅ Recipe extraction completed!');
          console.log(`   Title: ${statusData.title}`);
          console.log(`   Description: ${statusData.description?.substring(0, 100)}...`);
          break;
        } else if (currentStatus === 'failed') {
          console.log('\n❌ Recipe extraction failed');
          break;
        }
      }

      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (attempts >= maxAttempts) {
      console.log('\n⏱️  Timeout: Recipe extraction took longer than expected');
      console.log(`   Last status: ${currentStatus}`);
    }

    // Step 5: Fetch complete recipe data
    if (currentStatus === 'completed') {
      console.log('\n5️⃣  Fetching complete recipe data...\n');

      const { data: fullRecipe, error: fetchError } = await supabase
        .from('recipes')
        .select(`
          *,
          ingredients (*),
          instructions (*)
        `)
        .eq('id', recipeId)
        .single();

      if (fetchError) {
        console.error('❌ Failed to fetch recipe:', fetchError.message);
      } else {
        console.log('📋 Recipe Details:');
        console.log(`   Title: ${fullRecipe.title}`);
        console.log(`   Platform: ${fullRecipe.platform}`);
        console.log(`   Prep Time: ${fullRecipe.prep_time_minutes || 'N/A'} min`);
        console.log(`   Cook Time: ${fullRecipe.cook_time_minutes || 'N/A'} min`);
        console.log(`   Servings: ${fullRecipe.servings || 'N/A'}`);
        console.log(`   Cuisine: ${fullRecipe.cuisine || 'N/A'}`);
        console.log(`   Ingredients: ${fullRecipe.ingredients?.length || 0}`);
        console.log(`   Instructions: ${fullRecipe.instructions?.length || 0} steps`);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
  } finally {
    // Cleanup
    console.log('\n6️⃣  Cleaning up test data...');

    if (recipeId) {
      await supabase.from('recipes').delete().eq('id', recipeId);
      console.log('   ✅ Recipe deleted');
    }

    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
      console.log('   ✅ Test user deleted\n');
    }

    console.log('='.repeat(60));
    console.log('✅ End-to-end test complete!');
    console.log('='.repeat(60));
  }
}

// Check command line args for URL
const urlArg = process.argv[2];

if (!urlArg) {
  console.error('❌ Error: Please provide an Instagram URL as an argument\n');
  console.log('Usage: npx tsx scripts/test-recipe-extraction.ts <instagram-url>\n');
  console.log('Example:');
  console.log('  npx tsx scripts/test-recipe-extraction.ts "https://www.instagram.com/reel/ABC123/"\n');
  process.exit(1);
}

testRecipeExtraction(urlArg).catch(console.error);
