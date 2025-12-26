# Description: RQ worker entry point for processing background jobs
# Run this worker to process audio pipeline jobs asynchronously
# Usage: OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES python worker.py
# Or: python worker.py (will set env var automatically)

import os
import sys

# Fix for macOS fork() issue with RQ - MUST be set before any imports
# This prevents crashes when RQ forks worker processes on macOS
if sys.platform == 'darwin':  # macOS
    os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'

import logging
from rq import Worker
from utils.job_queue import get_redis_connection, get_job_queue

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def start_worker():
    """Start RQ worker to process jobs."""
    try:
        redis_conn = get_redis_connection()
        queue = get_job_queue()
        
        logger.info("Starting RQ worker...")
        logger.info(f"Listening on queue: {queue.name}")
        
        # Create worker with connection and queue
        # In newer RQ versions, Worker takes connection and queues directly
        worker = Worker([queue], connection=redis_conn)
        worker.work()
            
    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
    except Exception as e:
        logger.error(f"Worker error: {e}")
        raise


if __name__ == '__main__':
    start_worker()

