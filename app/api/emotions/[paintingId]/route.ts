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
  // Log BEFORE try-catch to ensure it runs
  console.log('========== EMOTION COUNTS API CALLED ==========')
  console.log('[DEBUG] Function started at:', new Date().toISOString())
  
  try {
    const { paintingId: paintingIdParam } = await params
    const paintingId = parseInt(paintingIdParam)
    
    console.log('[DEBUG] Painting ID:', paintingId)
    console.log('[DEBUG] Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    })
    
    if (isNaN(paintingId)) {
      return NextResponse.json(
        { error: 'Invalid painting ID' },
        { status: 400 }
      )
    }

    // Always fetch fresh data from Supabase (no caching)
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
    console.log('[DEBUG] Executing query...')
    
    const { data, error } = await supabase
      .from('emotion_counts')
      .select('emotion, count')
      .eq('painting_id', paintingId)

    console.log('[DEBUG] Query completed')
    console.log('[DEBUG] Error:', error)
    console.log('[DEBUG] Data rows returned:', data?.length || 0)
    console.log('[DEBUG] Raw data:', JSON.stringify(data, null, 2))

    if (error) {
      console.error('[ERROR] Error fetching emotion counts:', error)
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

    console.log('[DEBUG] Final counts object:', counts)
    console.log('[DEBUG] Counts object keys:', Object.keys(counts))

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
    console.error('[CATCH BLOCK] Unexpected error caught:', error)
    console.error('[CATCH BLOCK] Error type:', typeof error)
    console.error('[CATCH BLOCK] Error message:', error instanceof Error ? error.message : 'Not an Error object')
    console.error('[CATCH BLOCK] Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        debug: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        deploymentId: 'v2-debug-active'
      },
      { status: 500 }
    )
  } finally {
    console.log('========== END EMOTION COUNTS API ==========\n')
  }
}

// Update emotion counts for a painting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paintingId: string }> }
) {
  console.log('========== EMOTION COUNTS POST API CALLED ==========')
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
    
    const { emotion, delta, ipAddress } = body

    console.log('[DEBUG] Emotion:', emotion)
    console.log('[DEBUG] Delta:', delta)
    console.log('[DEBUG] IP Address:', ipAddress)

    if (!emotion || typeof delta !== 'number' || !ipAddress) {
      console.log('[ERROR] Missing required fields:', { emotion, delta: typeof delta, ipAddress })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[DEBUG] Creating Supabase client...')
    // Get current count
    const supabase = getSupabaseServer()
    console.log('[DEBUG] Fetching existing count...')
    
    const { data: existing, error: fetchError } = await supabase
      .from('emotion_counts')
      .select('count')
      .eq('painting_id', paintingId)
      .eq('emotion', emotion)
      .single()

    console.log('[DEBUG] Fetch result:', { existing, fetchError })

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[ERROR] Error fetching existing count:', fetchError)
      console.error('[ERROR] Fetch error details:', JSON.stringify(fetchError, null, 2))
      return NextResponse.json(
        { error: 'Failed to fetch existing count' },
        { status: 500 }
      )
    }

    const currentCount = existing?.count || 0
    const newCount = Math.max(0, currentCount + delta)

    console.log('[DEBUG] Count calculation:', { currentCount, delta, newCount })
    console.log('[DEBUG] Upserting emotion count to database...')

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
      console.error('[ERROR] Error updating emotion count:', upsertError)
      console.error('[ERROR] Upsert error details:', JSON.stringify(upsertError, null, 2))
      return NextResponse.json(
        { error: 'Failed to update emotion count' },
        { status: 500 }
      )
    }

    console.log('[SUCCESS] Emotion count updated successfully!')
    console.log('========== END EMOTION COUNTS POST API ==========\n')
    return NextResponse.json({ success: true, newCount })
  } catch (error) {
    console.error('[CATCH BLOCK] Unexpected error caught:', error)
    console.error('[CATCH BLOCK] Error message:', error instanceof Error ? error.message : 'Not an Error object')
    console.error('[CATCH BLOCK] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.log('========== END EMOTION COUNTS POST API ==========\n')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

