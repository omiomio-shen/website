# Emotion Tags Database Implementation Summary

## Overview

The emotion tag numbers are now dynamically pulled from a Supabase database instead of being hardcoded. The implementation includes session management, IP-based duplicate prevention, and automatic state persistence.

## Architecture

### Database Schema

1. **emotion_counts** table
   - Tracks the count for each emotion per painting
   - Columns: `id`, `painting_id`, `emotion`, `count`, `created_at`, `updated_at`
   - Unique constraint on `(painting_id, emotion)`

2. **user_submissions** table
   - Tracks IP addresses and their emotion selections per painting
   - Columns: `id`, `painting_id`, `ip_address`, `selected_emotions`, `created_at`, `updated_at`
   - Unique constraint on `(painting_id, ip_address)` - prevents duplicate submissions

### API Routes

1. **GET `/api/emotions/[paintingId]`**
   - Fetches current emotion counts for a painting
   - Returns: `{ counts: { [emotion]: number } }`

2. **POST `/api/emotions/[paintingId]`**
   - Updates emotion count by a delta
   - Body: `{ emotion: string, delta: number, ipAddress: string }`
   - Used internally when saving state

3. **GET `/api/emotions/[paintingId]/submission`**
   - Checks if IP has already submitted for this painting
   - Returns: `{ hasSubmitted: boolean, previousEmotions: string[] }`

4. **POST `/api/emotions/[paintingId]/submission`**
   - Saves/updates user submission
   - Body: `{ selectedEmotions: string[] }`
   - Uses upsert to update existing submissions

### Component Logic

**ArtworkModal** component now:

1. **Fetches initial counts** from database when painting loads
2. **Checks for previous submission** by IP address
3. **Tracks session state** per painting:
   - `selectedEmotions`: Current selections in this session
   - `baseEmotions`: Original submission state (from DB or empty)
   - `pendingChanges`: Local modifications not yet saved
4. **Saves on navigation**: When user navigates to next/previous painting
5. **Restores on return**: If user navigates back, restores their previous selections
6. **Prevents duplicate submissions**: Same IP cannot submit again (but can modify in same session)

## Key Features

✅ **Dynamic counts**: Numbers pulled from database, start at 0  
✅ **Real-time updates**: Counts update when emotions are clicked  
✅ **Session persistence**: Changes saved when navigating  
✅ **State restoration**: Previous selections restored when returning to a painting  
✅ **IP-based prevention**: Same IP cannot submit again (enforced by unique constraint)  
✅ **Modification support**: Users can modify choices within the same session  

## Data Flow

1. **Initial Load**:
   - Fetch emotion counts from DB → Display in bubbles
   - Check if IP has submitted → Restore previous selections if yes

2. **User Interaction**:
   - Click emotion → Update local state and display count
   - Track changes in session state

3. **Navigation**:
   - Calculate net deltas from base state
   - Save submission to DB
   - Update emotion counts in DB
   - Navigate to next painting

4. **Return to Painting**:
   - Fetch latest counts from DB
   - Restore previous selections from DB
   - Allow modifications within session

## Files Created/Modified

### New Files
- `lib/supabase.ts` - Client-side Supabase client
- `lib/supabase-server.ts` - Server-side Supabase client (with service role)
- `app/api/emotions/[paintingId]/route.ts` - Emotion counts API
- `app/api/emotions/[paintingId]/submission/route.ts` - Submission API
- `supabase-schema.sql` - Database schema
- `scripts/init-emotion-counts.ts` - Initialization script
- `SUPABASE_SETUP.md` - Setup instructions
- `IMPLEMENTATION_SUMMARY.md` - This file

### Modified Files
- `components/ArtworkModal.tsx` - Updated to use database
- `package.json` - Added `@supabase/supabase-js` dependency

## Next Steps

1. Follow `SUPABASE_SETUP.md` to set up your Supabase project
2. Run the database schema SQL in Supabase
3. Initialize emotion counts using the script
4. Set environment variables
5. Test the implementation

## Notes

- IP address extraction handles various proxy scenarios
- The service role key is only used server-side for security
- RLS policies should be configured for production
- The implementation handles edge cases like network errors gracefully




