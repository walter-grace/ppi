import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for extracted watch information
const WatchInfoSchema = z.object({
  brand: z.string().nullable().describe('Watch brand (e.g., "Rolex", "Omega", "Seiko")'),
  model: z.string().nullable().describe('Watch model name (e.g., "Submariner", "Speedmaster")'),
  reference_number: z.string().nullable().describe('Watch reference number (e.g., "116610LN", "3570.50")'),
  description: z.string().describe('Detailed description of the watch based on the image'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level in the extracted information'),
});

export async function GET(req: Request) {
  try {
    // Read the test image
    const imagePath = join(process.cwd(), 'app', 'images', 'rolex-datejust-oyster-41-mm-oystersteel-mint-green-dial-fluted-bezel-oysterbracelet-reference-126334-404805_1280x.webp');
    
    console.log('\n🧪 [Image Test] Testing watch image analysis...');
    console.log(`   Image path: ${imagePath}`);
    
    const imageBuffer = await readFile(imagePath);
    console.log(`   Image size: ${imageBuffer.length} bytes`);
    
    // Convert to base64
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;
    
    console.log(`   Image converted to base64 (${base64Image.length} chars)`);
    
    // Use OpenRouter with Claude Vision to analyze the image
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENROUTER_API_KEY not configured',
      }, { status: 500 });
    }
    
    console.log('   🤖 Calling Claude Vision model...');
    const startTime = Date.now();
    
    try {
      const result = await generateObject({
        model: openrouter('anthropic/claude-3-5-sonnet'),
        schema: WatchInfoSchema,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image: dataUrl,
              },
              {
                type: 'text',
                text: `Analyze this watch image and extract the following information:
- Brand name (e.g., Rolex, Omega, Seiko, etc.)
- Model name (e.g., Submariner, Speedmaster, etc.)
- Reference number (if visible on the dial, case, or documentation)
- A detailed description of the watch

Be as accurate as possible. If you cannot determine a specific value, use null. Rate your confidence level based on how clearly the information is visible in the image.`,
              },
            ],
          },
        ],
      });
      
      const duration = Date.now() - startTime;
      console.log(`   ✅ Analysis completed in ${duration}ms`);
      console.log(`   Extracted info:`, result.object);
      
      return NextResponse.json({
        success: true,
        watchInfo: result.object,
        duration: `${duration}ms`,
        message: 'Watch image analyzed successfully',
        imagePath,
        imageSize: `${(imageBuffer.length / 1024).toFixed(2)} KB`,
      });
    } catch (error: any) {
      console.error('   ❌ Error analyzing image:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to analyze image',
        details: error.stack,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ [Image Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

