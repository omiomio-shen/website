# Session-Based Voting Migration Guide

## Overview
This migration updates your voting system to allow users to vote multiple times across different browser sessions while preventing duplicate votes within a single session.

## What Changed

### 1. Database Schema
- **Added**: `session_id` column to `user_submissions` table
- **Changed**: UNIQUE constraint from `(painting_id, ip_address)` to `(painting_id, ip_address, session_id)`
- **Updated**: Index to include session_id

### 2. API Endpoints
- **GET /api/emotions/[paintingId]/submission**: Now requires `session_id` query parameter
- **POST /api/emotions/[paintingId]/submission**: Now requires `sessionId` in request body

### 3. Frontend
- **ArtworkModal**: Automatically passes session_id from sessionStorage to all API calls

## Migration Steps

### Step 1: Apply Database Migration

Run the migration SQL in your Supabase SQL Editor:

```sql
-- File: supabase-migration-add-session-id.sql

-- Step 1: Add session_id column (nullable first for existing rows)
ALTER TABLE user_submissions 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Step 2: Update existing rows with a default session_id
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
```

### Step 2: Verify Migration

After running the migration, verify the changes:

```sql
-- Check the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_submissions';

-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'user_submissions';
```

### Step 3: Deploy Code Changes

The code changes are already complete and will work once the database migration is applied.

## Testing Checklist

After deployment:

1. **Initial Vote**
   - [ ] Open the paintings gallery
   - [ ] Select emotions on a painting
   - [ ] Check browser DevTools > Application > Session Storage for `emotion_session_id`
   - [ ] Close the tab (this triggers save to database)
   - [ ] Verify submission in Supabase `user_submissions` table with your session_id

2. **New Session Vote**
   - [ ] Reopen the paintings gallery in a new tab
   - [ ] Check that session_id is different from previous
   - [ ] Select different emotions on the same painting
   - [ ] Close the tab
   - [ ] Verify new submission in database with new session_id

3. **Multiple Paintings**
   - [ ] Open gallery
   - [ ] Vote on multiple paintings in the same session
   - [ ] Close tab
   - [ ] Verify all submissions saved with the same session_id

4. **Emotion Counts**
   - [ ] Verify emotion counts increment correctly
   - [ ] Check that votes from different sessions both count

## Rollback Plan

If you need to rollback:

```sql
-- Remove session_id column and restore old constraint
ALTER TABLE user_submissions DROP COLUMN session_id;
ALTER TABLE user_submissions 
ADD CONSTRAINT user_submissions_painting_id_ip_address_key 
UNIQUE(painting_id, ip_address);
CREATE INDEX idx_user_submissions_painting_ip 
ON user_submissions(painting_id, ip_address);
```

Then revert the code changes using git.

## Session Behavior

**What defines a session:**
- A session starts when a user opens the gallery
- Session ID is stored in `sessionStorage`
- Session ends when the browser tab is closed
- Each tab has its own independent session
- New tab = new session = can vote again

**Privacy:**
- Session IDs are temporary and stored in browser only
- Format: `session_[timestamp]_[random]`
- No persistent tracking across browser restarts
- IP + session_id used for duplicate prevention only

