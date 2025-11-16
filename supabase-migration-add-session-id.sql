-- Migration: Add session_id to user_submissions table
-- This allows the same IP to vote multiple times across different browser sessions

-- Step 1: Add session_id column (nullable first for existing rows)
ALTER TABLE user_submissions 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Step 2: Update existing rows with a default session_id
-- (Any existing submissions will get a unique session_id)
UPDATE user_submissions 
SET session_id = 'legacy_' || id::text 
WHERE session_id IS NULL;

-- Step 3: Make session_id NOT NULL
ALTER TABLE user_submissions 
ALTER COLUMN session_id SET NOT NULL;

-- Step 4: Drop old unique constraint
ALTER TABLE user_submissions 
DROP CONSTRAINT IF EXISTS user_submissions_painting_id_ip_address_key;

-- Step 5: Add new unique constraint with session_id
ALTER TABLE user_submissions 
ADD CONSTRAINT user_submissions_painting_id_ip_address_session_id_key 
UNIQUE(painting_id, ip_address, session_id);

-- Step 6: Drop old index and create new one
DROP INDEX IF EXISTS idx_user_submissions_painting_ip;
CREATE INDEX IF NOT EXISTS idx_user_submissions_painting_ip_session 
ON user_submissions(painting_id, ip_address, session_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_submissions';

