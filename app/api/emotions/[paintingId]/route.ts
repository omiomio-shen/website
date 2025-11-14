import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Get emotion counts for a painting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paintingId: string }> }
) {
  try {
    const { paintingId: paintingIdParam } = await params
    const paintingId = parseInt(paintingIdParam)
    
    if (isNaN(paintingId)) {
      return NextResponse.json(
        { error: 'Invalid painting ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('emotion_counts')
      .select('emotion, count')
      .eq('painting_id', paintingId)

    if (error) {
      console.error('Error fetching emotion counts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch emotion counts' },
        { status: 500 }
      )
    }

    // Convert array to object for easier use
    const counts: Record<string, number> = {}
    data?.forEach((item) => {
      counts[item.emotion] = item.count || 0
    })

    // Disable caching to ensure fresh data in production
    return NextResponse.json({ counts }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update emotion counts for a painting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paintingId: string }> }
) {
  try {
    const { paintingId: paintingIdParam } = await params
    const paintingId = parseInt(paintingIdParam)
    
    if (isNaN(paintingId)) {
      return NextResponse.json(
        { error: 'Invalid painting ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { emotion, delta, ipAddress } = body

    if (!emotion || typeof delta !== 'number' || !ipAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current count
    const { data: existing, error: fetchError } = await supabaseServer
      .from('emotion_counts')
      .select('count')
      .eq('painting_id', paintingId)
      .eq('emotion', emotion)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching existing count:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch existing count' },
        { status: 500 }
      )
    }

    const currentCount = existing?.count || 0
    const newCount = Math.max(0, currentCount + delta)

    // Upsert the count
    const { error: upsertError } = await supabaseServer
      .from('emotion_counts')
      .upsert(
        {
          painting_id: paintingId,
          emotion: emotion,
          count: newCount,
        },
        {
          onConflict: 'painting_id,emotion',
        }
      )

    if (upsertError) {
      console.error('Error updating emotion count:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update emotion count' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, newCount })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

