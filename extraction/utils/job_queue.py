# Description: RQ job queue setup and management
# Handles Redis connection and RQ queue initialization for async job processing

import logging
from typing import Optional
from redis import Redis
from rq import Queue
from utils.config import config

logger = logging.getLogger(__name__)

# Global Redis connection and queue instances
_redis_conn: Optional[Redis] = None
_job_queue: Optional[Queue] = None


def get_redis_connection() -> Redis:
    """
    Get or create Redis connection instance.
    
    Returns:
        Redis connection instance
    """
    global _redis_conn
    if _redis_conn is None:
        try:
            _redis_conn = Redis.from_url(config.REDIS_URL)
            # Test connection
            _redis_conn.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise RuntimeError(f"Failed to connect to Redis: {str(e)}")
    return _redis_conn


def get_job_queue() -> Queue:
    """
    Get or create RQ job queue instance.
    
    Returns:
        RQ Queue instance
    """
    global _job_queue
    if _job_queue is None:
        redis_conn = get_redis_connection()
        _job_queue = Queue(connection=redis_conn)
        logger.info("RQ job queue initialized")
    return _job_queue


def enqueue_job(job_function, *args, **kwargs) -> str:
    """
    Enqueue a job to the RQ queue.
    
    Args:
        job_function: Function to execute as a job
        *args: Positional arguments for the job function
        **kwargs: Keyword arguments for the job function
        
    Returns:
        Job ID string
    """
    try:
        queue = get_job_queue()
        job = queue.enqueue(job_function, *args, **kwargs)
        logger.info(f"Job enqueued: {job.id}")
        return job.id
    except Exception as e:
        logger.error(f"Failed to enqueue job: {e}")
        raise RuntimeError(f"Failed to enqueue job: {str(e)}")


def get_job_status(job_id: str) -> dict:
    """
    Get status of a job by ID.
    
    Args:
        job_id: RQ job ID
        
    Returns:
        Dictionary with job status information
    """
    try:
        from rq.job import Job
        redis_conn = get_redis_connection()
        job = Job.fetch(job_id, connection=redis_conn)
        
        return {
            'id': job.id,
            'status': job.get_status(),
            'result': job.result if job.is_finished else None,
            'error': str(job.exc_info) if job.is_failed else None,
            'created_at': job.created_at.isoformat() if job.created_at else None,
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'ended_at': job.ended_at.isoformat() if job.ended_at else None,
        }
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise RuntimeError(f"Failed to get job status: {str(e)}")


def get_job_result(job_id: str):
    """
    Get result of a completed job.
    
    Args:
        job_id: RQ job ID
        
    Returns:
        Job result (if completed) or None
    """
    try:
        from rq.job import Job
        redis_conn = get_redis_connection()
        job = Job.fetch(job_id, connection=redis_conn)
        
        if job.is_finished:
            return job.result
        elif job.is_failed:
            raise RuntimeError(f"Job failed: {job.exc_info}")
        else:
            return None
    except Exception as e:
        logger.error(f"Failed to get job result: {e}")
        raise RuntimeError(f"Failed to get job result: {str(e)}")

