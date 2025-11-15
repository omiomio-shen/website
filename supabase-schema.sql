-- Create emotion_counts table to track counts for each emotion per painting
CREATE TABLE IF NOT EXISTS emotion_counts (
  id BIGSERIAL PRIMARY KEY,
  painting_id INTEGER NOT NULL,
  emotion TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(painting_id, emotion)
);

-- Create user_submissions table to track IP addresses and prevent duplicate submissions
CREATE TABLE IF NOT EXISTS user_submissions (
  id BIGSERIAL PRIMARY KEY,
  painting_id INTEGER NOT NULL,
  ip_address TEXT NOT NULL,
  selected_emotions TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(painting_id, ip_address)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_emotion_counts_painting_id ON emotion_counts(painting_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_painting_ip ON user_submissions(painting_id, ip_address);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_emotion_counts_updated_at BEFORE UPDATE ON emotion_counts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_submissions_updated_at BEFORE UPDATE ON user_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize emotion counts for all paintings (run this after creating the table)
-- This should be done via a migration script or manually
-- Example for painting_id 1 with emotions ['Calm', 'Mysterious', 'Nostalgic']:
-- INSERT INTO emotion_counts (painting_id, emotion, count) VALUES
--   (1, 'Calm', 0),
--   (1, 'Mysterious', 0),
--   (1, 'Nostalgic', 0)
-- ON CONFLICT (painting_id, emotion) DO NOTHING;







