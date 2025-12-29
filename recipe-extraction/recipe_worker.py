#!/usr/bin/env python3
"""
Redis Queue worker for recipe extraction jobs.

Usage:
    cd recipe-extraction
    python recipe_worker.py

This worker uses a simple JSON-based queue that's compatible with the
TypeScript enqueuing from the Next.js API routes.
"""
import json
import os
import sys
import logging
import signal
import time

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Add extraction/ to Python path for IG Downloader utilities
extraction_path = os.path.join(os.path.dirname(__file__), '..', 'extraction')
sys.path.insert(0, extraction_path)

from redis import Redis

from recipe_processor import process_recipe_extraction
from config import get_redis_url

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Queue name must match TypeScript
QUEUE_NAME = "recipe-extraction-jobs"

# Global flag for graceful shutdown
running = True


def signal_handler(signum, frame):
    """Handle shutdown signals."""
    global running
    logger.info("Received shutdown signal, finishing current job...")
    running = False


def process_job(job_data: dict) -> None:
    """
    Process a single job from the queue.

    Args:
        job_data: Dictionary with recipe_id, url, user_id
    """
    recipe_id = job_data.get('recipe_id')
    url = job_data.get('url')
    user_id = job_data.get('user_id')

    if not all([recipe_id, url, user_id]):
        logger.error(f"Invalid job data: {job_data}")
        return

    logger.info(f"Processing job for recipe {recipe_id}")
    logger.info(f"URL: {url}")

    try:
        result = process_recipe_extraction(recipe_id, url, user_id)
        logger.info(f"Job completed successfully: {result}")
    except Exception as e:
        logger.error(f"Job failed: {e}", exc_info=True)


def main():
    """Start the worker to process recipe extraction jobs."""
    global running

    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    redis_url = get_redis_url()

    logger.info(f"Connecting to Redis: {redis_url}")
    redis_conn = Redis.from_url(redis_url, decode_responses=True)

    # Test Redis connection
    try:
        redis_conn.ping()
        logger.info("Redis connection successful")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        logger.error("Make sure Redis is running: docker-compose up -d")
        sys.exit(1)

    logger.info("=" * 50)
    logger.info("Recipe Extraction Worker Started")
    logger.info(f"Listening on queue: {QUEUE_NAME}")
    logger.info("Press Ctrl+C to stop")
    logger.info("=" * 50)

    while running:
        try:
            # BLPOP blocks until a job is available (timeout 5 seconds)
            result = redis_conn.blpop(QUEUE_NAME, timeout=5)

            if result is None:
                # Timeout, no job available, continue loop
                continue

            queue_name, job_json = result
            logger.info(f"Received job from queue: {queue_name}")

            try:
                job_data = json.loads(job_json)
                process_job(job_data)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse job JSON: {e}")
                logger.error(f"Raw data: {job_json}")

        except Exception as e:
            if running:
                logger.error(f"Error in worker loop: {e}", exc_info=True)
                # Brief pause before retrying
                time.sleep(1)

    logger.info("Worker shutdown complete")


if __name__ == '__main__':
    main()
