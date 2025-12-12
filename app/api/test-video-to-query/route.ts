import { NextResponse } from 'next/server';

// Test endpoint to demonstrate video -> query flow
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url') || 'https://youtube.com/shorts/pUMTyzmRuUc?si=Z-4Ba_cKX3s6dMXA';

  try {
    // Step 1: Analyze video
    console.log('📹 Step 1: Analyzing video...');
    const formData = new FormData();
    formData.append('url', videoUrl);
    
    const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-watch-video`, {
      method: 'POST',
      body: formData,
    });
    
    const analysisResult = await analysisResponse.json();
    
    if (!analysisResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Video analysis failed',
        details: analysisResult.error,
      }, { status: 500 });
    }

    const watchInfo = analysisResult.watchInfo;
    console.log('✅ Video analyzed:', watchInfo);

    // Step 2: Build search query (same logic as processWatchAnalysis)
    console.log('🔍 Step 2: Building search query...');
    const queryParts: string[] = [];
    
    if (watchInfo.brand && watchInfo.model) {
      queryParts.push(`${watchInfo.brand} ${watchInfo.model}`);
    } else if (watchInfo.brand) {
      queryParts.push(watchInfo.brand);
    }
    
    if (watchInfo.reference_number && 
        watchInfo.reference_number !== 'Not visible in the video.') {
      queryParts.push(watchInfo.reference_number);
    }
    
    if (watchInfo.dial_color && watchInfo.dial_color !== 'Not clearly visible') {
      queryParts.push(watchInfo.dial_color);
    }
    
    // Simplified bezel type handling
    if (watchInfo.bezel_type && watchInfo.bezel_type !== 'Not clearly visible') {
      let bezelType = watchInfo.bezel_type;
      if (bezelType.toLowerCase().includes('fluted')) {
        queryParts.push('fluted');
      } else if (bezelType.toLowerCase().includes('ceramic')) {
        if (bezelType.toLowerCase().includes('blue') && bezelType.toLowerCase().includes('black')) {
          queryParts.push('blue black');
        } else if (bezelType.toLowerCase().includes('red') && bezelType.toLowerCase().includes('blue')) {
          queryParts.push('pepsi');
        } else if (bezelType.toLowerCase().includes('green') && bezelType.toLowerCase().includes('black')) {
          queryParts.push('green black');
        } else {
          queryParts.push('ceramic');
        }
      } else if (bezelType.toLowerCase().includes('smooth')) {
        queryParts.push('smooth');
      } else if (bezelType.length < 30) {
        queryParts.push(bezelType);
      }
    }
    
    if (watchInfo.size && watchInfo.size !== 'Not specified in the video.') {
      queryParts.push(watchInfo.size);
    }
    
    const searchQuery = queryParts.join(' ').trim() || watchInfo.description || 'watch';
    
    console.log('✅ Search query built:', searchQuery);

    return NextResponse.json({
      success: true,
      videoUrl,
      watchInfo,
      searchQuery,
      queryParts,
      message: 'Video analysis and query building completed successfully',
      nextStep: `This query "${searchQuery}" would be used to search eBay with category "260324" and analyze_arbitrage=true`,
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process video to query',
      details: error.stack,
    }, { status: 500 });
  }
}

