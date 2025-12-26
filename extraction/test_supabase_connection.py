#!/usr/bin/env python3
"""Test Supabase connection"""
from utils.config import config
from utils.supabase_client import get_supabase_client

try:
    print("Testing Supabase connection...")
    print(f"URL: {config.SUPABASE_URL}")
    print(f"Service Role Key (first 20 chars): {config.SUPABASE_SERVICE_ROLE_KEY[:20]}...")
    
    client = get_supabase_client()
    
    # Try to list tables
    result = client.table('audio_jobs').select('id').limit(1).execute()
    print("✅ Supabase connection successful!")
    print(f"✅ Can access audio_jobs table")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

