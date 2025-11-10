/**
 * Script to initialize emotion counts in the database
 * Run this after setting up your Supabase database
 * 
 * Usage: npx tsx scripts/init-emotion-counts.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Artworks data matching your ArtworkGallery.tsx
const artworks = [
  { id: 1, emotions: ['Calm', 'Mysterious', 'Nostalgic'] },
  { id: 2, emotions: ['Solitary', 'Accepting'] },
  { id: 3, emotions: ['Hopeful', 'Curious', 'Warm'] },
  { id: 4, emotions: ['Wondering', 'Mysterious'] },
  { id: 5, emotions: ['Joyful', 'Energetic', 'Loving'] },
  { id: 6, emotions: ['Reflective', 'Resilient'] },
  { id: 7, emotions: ['Contemplative', 'Intimate'] },
  { id: 8, emotions: ['Romantic', 'Harmonious'] },
  { id: 9, emotions: ['Relaxed', 'Connected'] },
  { id: 10, emotions: ['Chaotic', 'Unsettling'] },
  { id: 11, emotions: ['Connected', 'Warm'] },
  { id: 12, emotions: ['Playful', 'Quirky'] },
  { id: 13, emotions: ['Energetic', 'Optimistic'] },
  { id: 14, emotions: ['Reflective', 'Warm'] },
  { id: 15, emotions: ['Happy', 'Hopeful'] },
  { id: 16, emotions: ['Passionate', 'Curious'] },
]

async function initEmotionCounts() {
  console.log('Initializing emotion counts...')

  for (const artwork of artworks) {
    for (const emotion of artwork.emotions) {
      const { error } = await supabase
        .from('emotion_counts')
        .upsert(
          {
            painting_id: artwork.id,
            emotion: emotion,
            count: 0,
          },
          {
            onConflict: 'painting_id,emotion',
          }
        )

      if (error) {
        console.error(`Error initializing ${emotion} for painting ${artwork.id}:`, error)
      } else {
        console.log(`✓ Initialized ${emotion} for painting ${artwork.id}`)
      }
    }
  }

  console.log('Done initializing emotion counts!')
}

initEmotionCounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

