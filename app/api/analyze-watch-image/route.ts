import { NextResponse } from 'next/server';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';
import { detectItemType } from '@/lib/item-types/config';

// Schema for extracted watch information
const WatchInfoSchema = z.object({
  brand: z.string().nullable().describe('Watch brand (e.g., "Rolex", "Omega", "Seiko")'),
  model: z.string().nullable().describe('Watch model name (e.g., "Submariner", "Speedmaster", "Datejust")'),
  reference_number: z.string().nullable().describe('Watch reference number (e.g., "126334", "M126334-0027", "116610LN") - look carefully on dial, case, or documentation'),
  size: z.string().nullable().describe('Watch size in mm (e.g., "41mm", "40mm", "36mm")'),
  dial_color: z.string().nullable().describe('Exact dial color (e.g., "Mint Green", "Black", "Blue", "Silver") - be specific'),
  materials: z.string().nullable().describe('Case and bracelet materials (e.g., "Stainless Steel", "Steel and White Gold", "18K Gold")'),
  bezel_type: z.string().nullable().describe('Bezel type (e.g., "Fluted", "Smooth", "Ceramic", "Rotating")'),
  bracelet_type: z.string().nullable().describe('Bracelet type (e.g., "Oyster", "Jubilee", "Leather", "Rubber")'),
  description: z.string().describe('Detailed description of the watch including all visible features, text on dial, and distinguishing characteristics'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level in the extracted information'),
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json({
        success: false,
        error: 'No image file provided',
      }, { status: 400 });
    }
    
    console.log('\n📸 [Watch Image Analysis] Starting analysis...');
    console.log(`   File name: ${imageFile.name}`);
    console.log(`   File size: ${imageFile.size} bytes`);
    console.log(`   File type: ${imageFile.type}`);
    
    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`;
    
    console.log(`   Image converted to base64 (${base64Image.length} chars)`);
    
    // Use OpenRouter with Gemini 2.5 Flash to analyze the image
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENROUTER_API_KEY not configured',
      }, { status: 500 });
    }
    
    console.log('   🤖 Calling Gemini 2.5 Flash Preview 09-2025...');
    const startTime = Date.now();
    
    try {
      const result = await generateObject({
        model: openrouter('google/gemini-2.5-flash-preview-09-2025'),
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
                text: `Analyze this watch image and extract detailed information. Look VERY carefully at:

1. **Brand**: Check the dial, case, and any visible text/logos
2. **Model**: Look for model names on the dial (e.g., "Datejust", "Submariner", "Speedmaster")
3. **Reference Number**: THIS IS CRITICAL - Look VERY carefully for reference numbers. They may appear as:
   - Small numbers on the dial edge (between the dial and crystal)
   - Engraved on the case back
   - Printed on documentation, tags, or boxes in the image
   - Format examples: "126334", "M126334-0027", "116610LN", "126300", "116300"
   - They are often 6 digits (like 126334) or may have prefixes/suffixes (like M126334-0027)
   - Zoom in mentally and look for ANY numbers that could be a reference
   - If you see ANY numbers that look like a reference (6+ digits, possibly with letters), include them
4. **Size**: Look for size indicators or estimate based on proportions (common sizes: 36mm, 40mm, 41mm, 42mm)
5. **Dial Color**: Be SPECIFIC - is it "Mint Green", "Forest Green", "Emerald Green", "Black", "Blue", "Silver", etc.? Not just "green" or "dark". Use the exact color name if visible.
6. **Materials**: Check if it's just steel, or steel and gold (white gold, yellow gold, rose gold), or full gold. Look for color differences between case and bezel. White gold bezels on steel watches are common (called "Rolesor" by Rolex). If the bezel looks different from the case (more polished, different color), note it.
7. **Bezel Type**: Is it fluted (ridged/ridged pattern), smooth, ceramic, rotating, etc.?
8. **Bracelet Type**: Oyster (3-link), Jubilee (5-link), leather, rubber, etc.
9. **Description**: Include ALL visible text on the dial, any special features, date window position, hour markers style, etc.

Be EXTREMELY thorough. Reference numbers are often small but visible if you look carefully. Materials can be identified by color differences (white gold bezel on steel case, etc.). If you cannot determine a specific value after careful examination, use null. Rate your confidence based on image clarity.`,
              },
            ],
          },
        ],
      });
      
      const duration = Date.now() - startTime;
      const watchInfo = result.object;
      console.log(`   ✅ Analysis completed in ${duration}ms`);
      console.log(`   Extracted info:`, watchInfo);
      
      // Format as a detailed text description for the LLM
      const analysisText = `Here's a detailed analysis of the watch:

**Brand Name:** ${watchInfo.brand || 'Not visible in the image provided.'}

**Model Name:** ${watchInfo.model || 'Not visible in the image provided.'}

**Reference Number:** ${watchInfo.reference_number || 'Not visible in the image provided.'}

**Size:** ${watchInfo.size || 'Not specified in the image.'}

**Detailed Description:**

**Dial Color:** ${watchInfo.dial_color || 'Not clearly visible'}

**Materials:** ${watchInfo.materials || 'Not clearly visible'}

**Bezel Type:** ${watchInfo.bezel_type || 'Not clearly visible'}

**Bracelet Type:** ${watchInfo.bracelet_type || 'Not clearly visible'}

**Additional Details:** ${watchInfo.description}

**Confidence Level:** ${watchInfo.confidence}

Overall, ${watchInfo.description}`;
      
      // Auto-detect item type based on analysis
      const detectedType = detectItemType(analysisText, watchInfo);
      
      return NextResponse.json({
        success: true,
        watchInfo: watchInfo,
        analysis: analysisText,
        duration: `${duration}ms`,
        detectedItemType: detectedType, // Auto-detected item type
        message: 'Watch image analyzed successfully',
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
    console.error('❌ [Watch Image Analysis] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process image',
    }, { status: 500 });
  }
}

