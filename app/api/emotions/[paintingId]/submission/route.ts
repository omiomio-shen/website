import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

// Check if IP+session has already submitted for this painting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paintingId: string }> }
) {
  console.log('========== SUBMISSION CHECK API CALLED ==========')
  console.log('[DEBUG] Function started at:', new Date().toISOString())
  
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

    // Extract session_id from query parameter
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id') || ''

    console.log('[DEBUG] Painting ID:', paintingId, 'IP:', ipAddress, 'Session ID:', sessionId)
    console.log('[DEBUG] Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    })

    if (isNaN(paintingId)) {
      return NextResponse.json(
        { error: 'Invalid painting ID' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      )
    }

    console.log('[DEBUG] Creating Supabase client...')
    let supabase
    try {
      supabase = getSupabaseServer()
      console.log('[DEBUG] Supabase client created successfully')
    } catch (supabaseError) {
      console.error('[CRITICAL ERROR] Failed to create Supabase client:', supabaseError)
      console.error('[CRITICAL ERROR] Error message:', supabaseError instanceof Error ? supabaseError.message : 'Unknown error')
      throw supabaseError
    }
    const { data, error } = await supabase
      .from('user_submissions')
      .select('selected_emotions')
      .eq('painting_id', paintingId)
      .eq('ip_address', ipAddress)
      .eq('session_id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking submission:', error)
      return NextResponse.json(
        { error: 'Failed to check submission' },
        { status: 500 }
      )
    }

    console.log('[DEBUG] Submission check result:', { hasSubmitted: !!data })
    console.log('========== END SUBMISSION CHECK API ==========\n')
    
    return NextResponse.json({
      hasSubmitted: !!data,
      previousEmotions: data?.selected_emotions || []
    })
  } catch (error) {
    console.error('[CATCH BLOCK] Unexpected error caught:', error)
    console.error('[CATCH BLOCK] Error message:', error instanceof Error ? error.message : 'Not an Error object')
    console.error('[CATCH BLOCK] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.log('========== END SUBMISSION CHECK API ==========\n')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Save user submission (called when session ends)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paintingId: string }> }
) {
  console.log('========== SUBMISSION POST API CALLED ==========')
  console.log('[DEBUG] Function started at:', new Date().toISOString())
  console.log('[DEBUG] Request method:', request.method)
  console.log('[DEBUG] Request headers:', {
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    userAgent: request.headers.get('user-agent'),
  })
  
  try {
    const { paintingId: paintingIdParam } = await params
    const paintingId = parseInt(paintingIdParam)
    
    console.log('[DEBUG] Painting ID:', paintingId)
    
    // Extract IP address, handling various proxy scenarios
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor 
      ? forwardedFor.split(',')[0].trim() // Take first IP if multiple
      : request.headers.get('x-real-ip') || 
        request.ip || 
        'unknown'
    
    console.log('[DEBUG] IP Address:', ipAddress)

    if (isNaN(paintingId)) {
      console.log('[ERROR] Invalid painting ID')
      return NextResponse.json(
        { error: 'Invalid painting ID' },
        { status: 400 }
      )
    }

    console.log('[DEBUG] Attempting to parse request body...')
    let body
    try {
      body = await request.json()
      console.log('[DEBUG] Body parsed successfully:', JSON.stringify(body))
    } catch (parseError) {
      console.error('[CRITICAL ERROR] Failed to parse request body:', parseError)
      console.error('[CRITICAL ERROR] Parse error message:', parseError instanceof Error ? parseError.message : 'Unknown error')
      return NextResponse.json(
        { error: 'Failed to parse request body', debug: parseError instanceof Error ? parseError.message : 'Unknown' },
        { status: 400 }
      )
    }
    
    const { selectedEmotions, sessionId } = body

    console.log('[DEBUG] Selected emotions:', selectedEmotions)
    console.log('[DEBUG] Session ID:', sessionId)

    if (!Array.isArray(selectedEmotions)) {
      console.log('[ERROR] selectedEmotions is not an array:', typeof selectedEmotions)
      return NextResponse.json(
        { error: 'selectedEmotions must be an array' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      console.log('[ERROR] Missing sessionId')
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    console.log('[DEBUG] Creating Supabase client...')
    // Upsert the submission (allows updates within the same session)
    const supabase = getSupabaseServer()
    console.log('[DEBUG] Upserting submission to database...')
    
    const { error } = await supabase
      .from('user_submissions')
      .upsert(
        {
          painting_id: paintingId,
          ip_address: ipAddress,
          session_id: sessionId,
          selected_emotions: selectedEmotions,
        },
        {
          onConflict: 'painting_id,ip_address,session_id',
        }
      )

    if (error) {
      console.error('[ERROR] Error saving submission:', error)
      console.error('[ERROR] Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }

    console.log('[SUCCESS] Submission saved successfully!')
    console.log('========== END SUBMISSION POST API ==========\n')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CATCH BLOCK] Unexpected error caught:', error)
    console.error('[CATCH BLOCK] Error message:', error instanceof Error ? error.message : 'Not an Error object')
    console.error('[CATCH BLOCK] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.log('========== END SUBMISSION POST API ==========\n')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

