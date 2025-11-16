# Session-Based Voting System

## Quick Start

### For Deployment

1. **Apply Database Migration** (REQUIRED)
   ```bash
   # In Supabase SQL Editor, run:
   # supabase-migration-add-session-id.sql
   ```

2. **Deploy Code**
   ```bash
   git add .
   git commit -m "Implement session-based voting system"
   git push
   ```

3. **Test** (see IMPLEMENTATION_COMPLETE.md for detailed tests)

## How It Works

### User Flow
1. User opens gallery → New session ID generated in browser
2. User votes on paintings → Stored in sessionStorage only
3. User changes votes → Updated in sessionStorage (no database calls)
4. User closes tab → Votes saved to database with session_id
5. User opens gallery again → New session, can vote again! ✅

### Technical Flow

**Browser (sessionStorage)**
```
emotion_session_id: "session_1731715200_abc123xyz"
emotion_selection_session: {
  sessionId: "session_1731715200_abc123xyz",
  paintings: {
    1: { selectedEmotions: ["Calm", "Mysterious"], baseEmotions: [] },
    2: { selectedEmotions: ["Joyful"], baseEmotions: [] }
  }
}
```

**Database (Supabase)**
```sql
-- user_submissions table
| painting_id | ip_address | session_id                    | selected_emotions        |
|-------------|------------|-------------------------------|--------------------------|
| 1           | 192.0.2.1  | session_1731715200_abc123xyz  | ["Calm", "Mysterious"]   |
| 2           | 192.0.2.1  | session_1731715200_abc123xyz  | ["Joyful"]               |
| 1           | 192.0.2.1  | session_1731716000_xyz789abc  | ["Nostalgic"]            | <- NEW SESSION!

-- UNIQUE constraint: (painting_id, ip_address, session_id)
-- This allows same IP to vote multiple times in different sessions
```

## Architecture

### Session Identification
- **Session ID Format**: `session_[timestamp]_[random]`
- **Storage**: Browser sessionStorage (clears when tab closes)
- **Scope**: Per-tab (new tab = new session)
- **Privacy**: No cross-session tracking possible

### Vote Persistence
- **During Session**: sessionStorage only (instant, no API calls)
- **Session End**: Batch save to Supabase via beforeunload event
- **Delta Calculation**: Only net changes saved (prevents count inflation)

### API Endpoints

**GET** `/api/emotions/[paintingId]/submission?session_id={sessionId}`
- Check if this session has voted on this painting
- Returns previous emotions if any

**POST** `/api/emotions/[paintingId]/submission`
```json
{
  "selectedEmotions": ["Calm", "Mysterious"],
  "sessionId": "session_1731715200_abc123xyz"
}
```

**POST** `/api/emotions/[paintingId]`
```json
{
  "emotion": "Calm",
  "delta": 1,  // or -1 for removal
  "ipAddress": "client"
}
```

## Database Schema

### user_submissions
```sql
CREATE TABLE user_submissions (
  id BIGSERIAL PRIMARY KEY,
  painting_id INTEGER NOT NULL,
  ip_address TEXT NOT NULL,
  session_id TEXT NOT NULL,          -- NEW
  selected_emotions TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(painting_id, ip_address, session_id)  -- CHANGED
);
```

### emotion_counts
```sql
CREATE TABLE emotion_counts (
  id BIGSERIAL PRIMARY KEY,
  painting_id INTEGER NOT NULL,
  emotion TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(painting_id, emotion)
);
```

## Files Changed

### Core Implementation
- `supabase-schema.sql` - Schema definition
- `supabase-migration-add-session-id.sql` - Migration script
- `app/api/emotions/[paintingId]/submission/route.ts` - API with session support
- `components/ArtworkModal.tsx` - Frontend integration
- `lib/session-storage.ts` - No changes (already perfect!)

### Documentation
- `MIGRATION_GUIDE.md` - Step-by-step migration instructions
- `IMPLEMENTATION_COMPLETE.md` - Detailed testing guide
- `README_SESSION_VOTING.md` - This file

## Edge Cases Handled

✅ **User closes tab before vote saves**: beforeunload event ensures save
✅ **User navigates away**: visibilitychange event as backup
✅ **User votes, changes mind**: Only final selection counts
✅ **Multiple tabs**: Each tab = separate session
✅ **Incognito mode**: Works normally, each window separate
✅ **Same IP, different sessions**: Allowed by design
✅ **API failures**: Graceful error handling with console logs

## Monitoring

Check your Supabase logs for:
- `[DEBUG] Submission check result:` - Vote lookups
- `Error saving submission:` - Save failures
- Session IDs in logs for debugging

Query for analytics:
```sql
-- Count unique sessions per painting
SELECT painting_id, COUNT(DISTINCT session_id) as session_count
FROM user_submissions
GROUP BY painting_id;

-- Count votes from same IP (multi-session users)
SELECT ip_address, COUNT(*) as vote_count
FROM user_submissions
GROUP BY ip_address
HAVING COUNT(*) > 1;

-- Most recent sessions
SELECT * FROM user_submissions
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

**Problem**: API returns "Missing session_id" error
- **Solution**: Clear sessionStorage and refresh page

**Problem**: Votes not saving
- **Solution**: Check browser console for errors, verify Supabase connection

**Problem**: Can't vote multiple times
- **Solution**: Verify database migration applied (check for session_id column)

**Problem**: Same session voting multiple times
- **Solution**: Check UNIQUE constraint includes session_id

## Future Enhancements (Optional)

- Add session expiry (e.g., 24 hours)
- Track session duration/engagement time
- Add undo/redo within session
- Export voting analytics
- Rate limiting per IP per time period

