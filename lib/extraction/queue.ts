// Description: Redis queue integration for recipe extraction jobs
// Enqueues jobs for processing by the Python worker using a simple JSON-based queue

import Redis from "ioredis";

// Redis connection singleton
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
    });

    redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redis.on("connect", () => {
      console.log("Redis connected");
    });
  }
  return redis;
}

export interface RecipeExtractionJob {
  recipe_id: string;
  url: string;
  user_id: string;
}

const QUEUE_NAME = "recipe-extraction-jobs";

/**
 * Enqueue a recipe extraction job to be processed by the Python worker.
 *
 * Uses a simple JSON-based queue that the Python worker can easily parse.
 */
export async function enqueueRecipeExtraction(
  job: RecipeExtractionJob
): Promise<string> {
  const client = getRedis();

  // Create simple job data that Python can easily parse
  const jobData = {
    recipe_id: job.recipe_id,
    url: job.url,
    user_id: job.user_id,
    created_at: new Date().toISOString(),
  };

  // Push job to the queue (RPUSH for FIFO processing with BLPOP)
  await client.rpush(QUEUE_NAME, JSON.stringify(jobData));

  console.log(
    `Enqueued recipe extraction job for recipe ${job.recipe_id}`
  );

  return job.recipe_id;
}

/**
 * Check if Redis is connected and available.
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const client = getRedis();
    const result = await client.ping();
    return result === "PONG";
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
}

/**
 * Get the current queue length.
 */
export async function getQueueLength(): Promise<number> {
  try {
    const client = getRedis();
    return await client.llen(QUEUE_NAME);
  } catch (error) {
    console.error("Failed to get queue length:", error);
    return 0;
  }
}
