#!/usr/bin/env python3
"""
Helper script to update .env file with service role key
"""

import os
import re

def update_service_role_key():
    """Update SUPABASE_SERVICE_ROLE_KEY in .env file."""
    env_file = '.env'
    
    if not os.path.exists(env_file):
        print(f"❌ {env_file} file not found!")
        return False
    
    # Read current .env file
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Check if service role key is already set
    if 'SUPABASE_SERVICE_ROLE_KEY=<REQUIRED' not in content:
        print("✅ Service role key appears to be already set!")
        return True
    
    print("=" * 60)
    print("Update SUPABASE_SERVICE_ROLE_KEY")
    print("=" * 60)
    print()
    print("Get your service role key from:")
    print("https://supabase.com/dashboard/project/xtnghpnxvoaclqipgtoa/settings/api")
    print()
    service_key = input("Paste your SUPABASE_SERVICE_ROLE_KEY here: ").strip()
    
    if not service_key:
        print("❌ No key provided. Exiting.")
        return False
    
    # Update the .env file
    pattern = r'SUPABASE_SERVICE_ROLE_KEY=.*'
    replacement = f'SUPABASE_SERVICE_ROLE_KEY={service_key}'
    
    new_content = re.sub(pattern, replacement, content)
    
    with open(env_file, 'w') as f:
        f.write(new_content)
    
    print()
    print("✅ Service role key updated in .env file!")
    return True

if __name__ == '__main__':
    update_service_role_key()

