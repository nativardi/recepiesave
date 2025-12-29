-- Description: Update recipe status enum to include granular extraction stages
-- The Python worker uses more detailed status values than originally defined
--
-- Original: pending, processing, completed, failed
-- Updated: pending, downloading, extracting_audio, transcribing, analyzing, completed, failed

-- Drop the old constraint
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_status_check;

-- Add the new constraint with all status values
ALTER TABLE recipes
  ADD CONSTRAINT recipes_status_check
  CHECK (status IN (
    'pending',
    'downloading',
    'extracting_audio',
    'transcribing',
    'analyzing',
    'completed',
    'failed'
  ));

-- Update any 'processing' status to 'pending' (if any exist)
UPDATE recipes
SET status = 'pending'
WHERE status = 'processing';
