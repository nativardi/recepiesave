# Description: Helper script to apply database schema to Supabase
# Run this script after setting up your Supabase project and configuring .env file
# Usage: python utils/apply_schema.py

import logging
from utils.config import config
from utils.supabase_client import get_supabase_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def apply_schema():
    """Apply database schema to Supabase project."""
    try:
        # Read SQL schema file
        with open('utils/database_schema.sql', 'r') as f:
            schema_sql = f.read()
        
        logger.info("Applying database schema to Supabase...")
        
        # Note: Supabase Python client doesn't directly support raw SQL execution
        # You'll need to apply this via Supabase MCP or dashboard
        logger.warning(
            "Direct SQL execution via Python client is not supported. "
            "Please apply the schema using one of these methods:\n"
            "1. Use Supabase MCP: mcp_supabase_apply_migration\n"
            "2. Use Supabase Dashboard: SQL Editor\n"
            "3. Use Supabase CLI: supabase db push\n"
            "\nSchema file location: utils/database_schema.sql"
        )
        
        print("\n" + "="*60)
        print("To apply the schema, use Supabase MCP:")
        print("="*60)
        print("mcp_supabase_apply_migration with:")
        print("  - project_id: your_supabase_project_id")
        print("  - name: create_audio_pipeline_schema")
        print("  - query: (contents of utils/database_schema.sql)")
        print("="*60)
        
    except Exception as e:
        logger.error(f"Error applying schema: {e}")
        raise


if __name__ == "__main__":
    apply_schema()

