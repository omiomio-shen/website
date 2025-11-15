import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// Disable ALL caching for this route - critical for production
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs' // Ensure Node.js runtime, not edge

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

    // Always fetch fresh data from Supabase (no caching)
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
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

    // Temporary debug logging
    console.log(`[DEBUG] Painting ${paintingId} counts:`, counts)
    console.log(`[DEBUG] Raw data rows:`, data?.length || 0)

    // Disable ALL forms of caching - including Vercel Edge Cache
    return NextResponse.json({ counts }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Status': 'DYNAMIC',
        'X-Vercel-Cache': 'MISS',
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
    const supabase = getSupabaseServer()
    const { data: existing, error: fetchError } = await supabase
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
    const { error: upsertError } = await supabase
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

