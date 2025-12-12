import { NextResponse } from 'next/server';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for extracted watch information
const WatchInfoSchema = z.object({
  brand: z.string().nullable().describe('Watch brand (e.g., "Rolex", "Omega", "Seiko")'),
  model: z.string().nullable().describe('Watch model name (e.g., "Submariner", "Speedmaster", "Datejust")'),
  reference_number: z.string().nullable().describe('Watch reference number'),
  size: z.string().nullable().describe('Watch size in mm'),
  dial_color: z.string().nullable().describe('Exact dial color'),
  materials: z.string().nullable().describe('Case and bracelet materials'),
  bezel_type: z.string().nullable().describe('Bezel type'),
  bracelet_type: z.string().nullable().describe('Bracelet type'),
  description: z.string().describe('Detailed description'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level'),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url') || 'https://youtube.com/shorts/pUMTyzmRuUc?si=Z-4Ba_cKX3s6dMXA';

  console.log('\n🧪 [Test Video Analysis] Starting test...');
  console.log(`   Video URL: ${videoUrl}`);

  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENROUTER_API_KEY not configured',
      }, { status: 500 });
    }

    console.log('   🤖 Calling Gemini 2.5 Flash with video_url...');
    const startTime = Date.now();

    // Use raw OpenRouter API since AI SDK doesn't support video_url directly
    console.log('   📝 Using raw OpenRouter API for video_url...');
    
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PSA Watch Analysis Test',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-preview-09-2025',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'video_url',
                video_url: {
                  url: videoUrl,
                },
              },
              {
                type: 'text',
                text: 'Analyze this watch video and extract the brand, model, reference number, size, dial color, materials, bezel type, and bracelet type. Return as JSON with fields: brand, model, reference_number, size, dial_color, materials, bezel_type, bracelet_type, description, confidence.',
              },
            ],
          },
        ],
        response_format: {
          type: 'json_object',
        },
      }),
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      throw new Error(`OpenRouter API error: ${openrouterResponse.status} - ${errorText}`);
    }

    const openrouterData = await openrouterResponse.json();
    const responseText = openrouterData.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      // If not JSON, try to extract JSON from text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }

    const duration = Date.now() - startTime;
    console.log(`   ✅ Analysis completed in ${duration}ms`);
    console.log(`   Extracted info:`, parsedData);

    return NextResponse.json({
      success: true,
      watchInfo: parsedData,
      duration: `${duration}ms`,
      usedFormat: 'raw OpenRouter API',
      message: 'Video analyzed successfully',
    });
  } catch (error: any) {
    console.error('❌ [Test Video Analysis] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to analyze video',
      details: error.stack,
    }, { status: 500 });
  }
}

