import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const watchDbKey = process.env.WATCH_DATABASE_API_KEY || process.env.RAPIDAPI_KEY;
  
  if (!watchDbKey) {
    return NextResponse.json({
      success: false,
      error: 'WATCH_DATABASE_API_KEY or RAPIDAPI_KEY not configured',
    }, { status: 400 });
  }

  try {
    // Test the RapidAPI Watch Database endpoint directly
    const testQuery = 'Rolex Submariner';
    
    const response = await fetch('https://watch-database1.p.rapidapi.com/api/v1/watches/search', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': watchDbKey,
        'X-RapidAPI-Host': 'watch-database1.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: testQuery,
        limit: '1',
        page: '1',
      }),
    });

    const status = response.status;
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = { raw: text.substring(0, 500) };
    }

    return NextResponse.json({
      success: status === 200,
      status,
      contentType,
      isHtml: contentType?.includes('text/html'),
      response: parsedData,
      message: status === 200 
        ? 'RapidAPI is working correctly' 
        : `RapidAPI returned status ${status}${contentType?.includes('text/html') ? ' (HTML error page)' : ''}`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

