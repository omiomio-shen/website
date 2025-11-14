# Supabase Setup Guide

This guide will help you set up Supabase for the emotion tracking feature.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details and create the project
4. Wait for the project to be provisioned

## 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (this is your `SUPABASE_SERVICE_ROLE_KEY`) - Keep this secret!

## 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist) and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** Never commit `.env.local` to git. It should already be in `.gitignore`.

## 4. Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the SQL

This will create:
- `emotion_counts` table - tracks counts for each emotion per painting
- `user_submissions` table - tracks IP addresses and prevents duplicate submissions
- Indexes for better performance
- Triggers to auto-update timestamps

## 5. Initialize Emotion Counts

After creating the tables, you need to initialize the emotion counts for all paintings.

### Option A: Using the Script (Recommended)

1. Install tsx if you haven't already:
   ```bash
   npm install -D tsx
   ```

2. Run the initialization script:
   ```bash
   npx tsx scripts/init-emotion-counts.ts
   ```

### Option B: Manual SQL

You can also manually insert the initial counts using SQL in the Supabase SQL Editor:

```sql
-- Example for painting 1
INSERT INTO emotion_counts (painting_id, emotion, count) VALUES
  (1, 'Calm', 0),
  (1, 'Mysterious', 0),
  (1, 'Nostalgic', 0)
ON CONFLICT (painting_id, emotion) DO NOTHING;

-- Repeat for all paintings (see ArtworkGallery.tsx for the full list)
```

## 6. Set Up Row Level Security (RLS)

For security, you should enable RLS on your tables:

1. Go to **Authentication** > **Policies** in Supabase
2. For `emotion_counts` table:
   - Enable RLS
   - Create a policy that allows SELECT for everyone (anon users)
   - Create a policy that allows INSERT/UPDATE for service role only
3. For `user_submissions` table:
   - Enable RLS
   - Create a policy that allows SELECT/INSERT/UPDATE for service role only

Alternatively, you can use the SQL Editor to set up policies:

```sql
-- Enable RLS
ALTER TABLE emotion_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to emotion_counts
CREATE POLICY "Allow public read access" ON emotion_counts
  FOR SELECT USING (true);

-- Restrict writes to service role (handled by API routes)
CREATE POLICY "Service role only writes" ON emotion_counts
  FOR ALL USING (false);

-- Restrict user_submissions to service role only
CREATE POLICY "Service role only" ON user_submissions
  FOR ALL USING (false);
```

Note: Since we're using the service role key in API routes, the policies above will work. The API routes run server-side with elevated privileges.

## 7. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your paintings page
3. Click on a painting to open the modal
4. Try selecting/unselecting emotions
5. Navigate to the next painting - the counts should save
6. Navigate back - your previous selections should be restored

## Troubleshooting

### Counts not updating
- Check that your environment variables are set correctly
- Verify the API routes are accessible (check browser console for errors)
- Check Supabase logs in the dashboard

### IP address not being detected
- The IP extraction handles various proxy scenarios
- Check the `x-forwarded-for` header if behind a proxy
- In development, you might see 'unknown' - this is normal

### Database connection errors
- Verify your Supabase URL and keys are correct
- Check that the tables were created successfully
- Ensure RLS policies allow the necessary operations

## Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` should **never** be exposed to the client
- It's only used in server-side API routes
- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose (it's public)
- IP-based rate limiting is handled by the database constraints





