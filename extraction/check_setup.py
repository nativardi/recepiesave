#!/usr/bin/env python3
"""
Quick setup checker for Audio Processing Pipeline
Checks if all required environment variables are set correctly
"""

import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("Audio Processing Pipeline - Setup Checker")
print("=" * 60)
print()

# Check required environment variables
required_vars = {
    'SUPABASE_URL': os.getenv('SUPABASE_URL'),
    'SUPABASE_ANON_KEY': os.getenv('SUPABASE_ANON_KEY'),
    'SUPABASE_SERVICE_ROLE_KEY': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
    'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
    'REDIS_URL': os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
}

missing = []
for var_name, var_value in required_vars.items():
    if not var_value or var_value.startswith('<REQUIRED'):
        print(f"❌ {var_name}: NOT SET")
        missing.append(var_name)
    else:
        # Show first 20 chars for security
        display_value = var_value[:20] + "..." if len(var_value) > 20 else var_value
        print(f"✅ {var_name}: {display_value}")

print()
print("=" * 60)

if missing:
    print("⚠️  MISSING REQUIRED VARIABLES:")
    for var in missing:
        print(f"   - {var}")
    print()
    print("To fix:")
    print("1. Get SUPABASE_SERVICE_ROLE_KEY from:")
    print("   https://supabase.com/dashboard/project/xtnghpnxvoaclqipgtoa/settings/api")
    print("2. Get OPENAI_API_KEY from:")
    print("   https://platform.openai.com/api-keys")
    print("3. Update your .env file with these values")
else:
    print("✅ All required environment variables are set!")
    print()
    print("Next steps:")
    print("1. Make sure Redis is running: redis-cli ping")
    print("2. Start RQ worker: python worker.py")
    print("3. Start Flask app: python app.py")
    print("4. Test the pipeline!")

print("=" * 60)

