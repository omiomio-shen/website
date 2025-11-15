import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// Check if IP has already submitted for this painting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paintingId: string }> }
) {
  try {
    const { paintingId: paintingIdParam } = await params
    const paintingId = parseInt(paintingIdParam)
    // Extract IP address, handling various proxy scenarios
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor 
      ? forwardedFor.split(',')[0].trim() // Take first IP if multiple
      : request.headers.get('x-real-ip') || 
        request.ip || 
        'unknown'

    if (isNaN(paintingId)) {
      return NextResponse.json(
        { error: 'Invalid painting ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('user_submissions')
      .select('selected_emotions')
      .eq('painting_id', paintingId)
      .eq('ip_address', ipAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking submission:', error)
      return NextResponse.json(
        { error: 'Failed to check submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasSubmitted: !!data,
      previousEmotions: data?.selected_emotions || []
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Save user submission (called when navigating to next painting)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paintingId: string }> }
) {
  try {
    const { paintingId: paintingIdParam } = await params
    const paintingId = parseInt(paintingIdParam)
    // Extract IP address, handling various proxy scenarios
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor 
      ? forwardedFor.split(',')[0].trim() // Take first IP if multiple
      : request.headers.get('x-real-ip') || 
        request.ip || 
        'unknown'

    if (isNaN(paintingId)) {
      return NextResponse.json(
        { error: 'Invalid painting ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { selectedEmotions } = body

    if (!Array.isArray(selectedEmotions)) {
      return NextResponse.json(
        { error: 'selectedEmotions must be an array' },
        { status: 400 }
      )
    }

    // Upsert the submission
    const supabase = getSupabaseServer()
    const { error } = await supabase
      .from('user_submissions')
      .upsert(
        {
          painting_id: paintingId,
          ip_address: ipAddress,
          selected_emotions: selectedEmotions,
        },
        {
          onConflict: 'painting_id,ip_address',
        }
      )

    if (error) {
      console.error('Error saving submission:', error)
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

