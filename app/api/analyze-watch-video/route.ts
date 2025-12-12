import { NextResponse } from 'next/server';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';
import { Readable } from 'stream';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
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

// Extract frames from video using ffmpeg (requires ffmpeg to be installed)
async function extractFrames(videoPath: string, outputDir: string, count: number = 5): Promise<string[]> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // Extract frames evenly spaced throughout the video
    const command = `ffmpeg -i "${videoPath}" -vf "select='not(mod(t\\,${count}))',scale=1280:-1" -vsync vfr "${outputDir}/frame_%03d.jpg" -y`;
    await execAsync(command);
    
    // Get list of extracted frames
    const { readdir } = await import('fs/promises');
    const files = await readdir(outputDir);
    const frameFiles = files
      .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
      .sort()
      .slice(0, count)
      .map(f => join(outputDir, f));
    
    return frameFiles;
  } catch (error: any) {
    console.error('Error extracting frames:', error);
    // Fallback: try to extract just one frame from the middle
    try {
      const fallbackCommand = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${outputDir}/frame_001.jpg" -y`;
      await execAsync(fallbackCommand);
      return [join(outputDir, 'frame_001.jpg')];
    } catch (fallbackError) {
      throw new Error(`Failed to extract frames: ${error.message}`);
    }
  }
}

// Download video from URL (YouTube or Instagram)
async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // Check if yt-dlp is available (better than youtube-dl)
    try {
      await execAsync('yt-dlp --version');
      // Use yt-dlp for YouTube and Instagram
      const command = `yt-dlp -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`;
      await execAsync(command);
    } catch {
      // Fallback: try youtube-dl
      try {
        await execAsync('youtube-dl --version');
        const command = `youtube-dl -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`;
        await execAsync(command);
      } catch {
        // If neither is available, try direct download (works for some URLs)
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        await writeFile(outputPath, Buffer.from(buffer));
      }
    }
  } catch (error: any) {
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

// Analyze frame with vision model
async function analyzeFrame(framePath: string): Promise<z.infer<typeof WatchInfoSchema>> {
  const frameBuffer = await readFile(framePath);
  const base64Image = frameBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

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
            text: `Analyze this watch image extracted from a video. Look VERY carefully at:

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

  return result.object;
}

// Merge multiple frame analyses into one comprehensive result
function mergeAnalyses(analyses: z.infer<typeof WatchInfoSchema>[]): z.infer<typeof WatchInfoSchema> {
  // Take the most confident analysis for each field, or combine when multiple are confident
  const merged: z.infer<typeof WatchInfoSchema> = {
    brand: null,
    model: null,
    reference_number: null,
    size: null,
    dial_color: null,
    materials: null,
    bezel_type: null,
    bracelet_type: null,
    description: '',
    confidence: 'low',
  };

  // Find the most common non-null value for each field
  const fields: (keyof typeof merged)[] = ['brand', 'model', 'reference_number', 'size', 'dial_color', 'materials', 'bezel_type', 'bracelet_type'];
  
  for (const field of fields) {
    const values = analyses
      .map(a => a[field])
      .filter(v => v !== null && v !== undefined) as string[];
    
    if (values.length > 0) {
      // Find most common value
      const counts: Record<string, number> = {};
      values.forEach(v => {
        counts[v] = (counts[v] || 0) + 1;
      });
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      merged[field] = mostCommon[0] as any;
    }
  }

  // Combine descriptions
  merged.description = analyses
    .map(a => a.description)
    .filter(d => d && d.length > 0)
    .join(' | ');

  // Use highest confidence
  const confidences = analyses.map(a => a.confidence);
  if (confidences.includes('high')) {
    merged.confidence = 'high';
  } else if (confidences.includes('medium')) {
    merged.confidence = 'medium';
  } else {
    merged.confidence = 'low';
  }

  return merged;
}

export async function POST(req: Request) {
  const tempDir = join(tmpdir(), `watch-video-${Date.now()}`);
  const videoPath = join(tempDir, 'video.mp4');
  const framesDir = join(tempDir, 'frames');
  let videoFile: File | null = null;
  let videoUrl: string | null = null;

  try {
    const formData = await req.formData();
    videoFile = formData.get('video') as File;
    videoUrl = formData.get('url') as string | null;

    if (!videoFile && !videoUrl) {
      return NextResponse.json({
        success: false,
        error: 'No video file or URL provided',
      }, { status: 400 });
    }

    console.log('\n🎥 [Watch Video Analysis] Starting analysis...');
    
    // Create temp directory
    const { mkdir } = await import('fs/promises');
    await mkdir(tempDir, { recursive: true });
    await mkdir(framesDir, { recursive: true });

    // For YouTube/Instagram URLs, use Gemini's native video_url support (much faster!)
    if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('instagram.com'))) {
      console.log('   ✅ Using Gemini native video_url support (no download needed)');
      
      // Cleanup temp directory since we don't need it
      try {
        const { rm } = await import('fs/promises');
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      console.log('   🤖 Analyzing video directly with Gemini 2.5 Flash (native video support)...');
      
      const openrouterKey = process.env.OPENROUTER_API_KEY;
      if (!openrouterKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      // Use raw OpenRouter API format since AI SDK might not support video_url directly
      console.log('   📝 Using raw OpenRouter API format for video_url...');
      
      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'PSA Watch Analysis',
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
                  text: `Analyze this watch video and extract detailed information for ALL watches shown. The video may contain one or multiple watches.

IMPORTANT: If the video shows multiple different watches, return an ARRAY of watch objects. If it shows only one watch, return a single object.

For EACH watch, extract:

1. **Brand**: Check the dial, case, and any visible text/logos
2. **Model**: Look for model names on the dial (e.g., "Datejust", "Submariner", "Speedmaster", "GMT-Master II")
3. **Reference Number**: THIS IS CRITICAL - Look VERY carefully for reference numbers. They may appear as:
   - Small numbers on the dial edge (between the dial and crystal)
   - Engraved on the case back
   - Printed on documentation, tags, or boxes in the video
   - Format examples: "126334", "M126334-0027", "116610LN", "126300", "126710BLNR", "126710BLRO"
   - They are often 6 digits (like 126334) or may have prefixes/suffixes (like M126334-0027 or 126710BLNR)
   - Zoom in mentally and look for ANY numbers that could be a reference
   - If you see ANY numbers that look like a reference (6+ digits, possibly with letters), include them
4. **Size**: Look for size indicators or estimate based on proportions (common sizes: 36mm, 40mm, 41mm, 42mm)
5. **Dial Color**: Be SPECIFIC - is it "Mint Green", "Forest Green", "Emerald Green", "Black", "Blue", "Silver", etc.? Not just "green" or "dark". Use the exact color name if visible.
6. **Materials**: Check if it's just steel, or steel and gold (white gold, yellow gold, rose gold), or full gold. Look for color differences between case and bezel. White gold bezels on steel watches are common (called "Rolesor" by Rolex). If the bezel looks different from the case (more polished, different color), note it.
7. **Bezel Type**: Be SPECIFIC - Is it fluted (ridged pattern), smooth, ceramic (and what colors - e.g., "blue and black ceramic", "red and blue ceramic"), rotating, etc.? Include colors for ceramic bezels.
8. **Bracelet Type**: Oyster (3-link), Jubilee (5-link), leather, rubber, etc.
9. **Description**: Include ALL visible text on the dial, any special features, date window position, hour markers style, nickname (e.g., "Batgirl", "Pepsi", "Sprite"), etc.

Be EXTREMELY thorough. Reference numbers are often small but visible if you look carefully. Materials can be identified by color differences (white gold bezel on steel case, etc.). If you cannot determine a specific value after careful examination, use null. Rate your confidence based on video clarity.

Return as JSON: If multiple watches, return an array of objects. If single watch, return a single object. Each object should have: brand, model, reference_number, size, dial_color, materials, bezel_type, bracelet_type, description, and confidence (high/medium/low).`,
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

      // Handle array response (multiple watches) or single object
      const allWatches = Array.isArray(parsedData) ? parsedData : [parsedData];
      console.log(`   ℹ️  Video contains ${allWatches.length} watch(es)`);

      // Map all watches to our schema format
      const mappedWatches = allWatches.map((watchData: any, index: number) => ({
        brand: watchData.brand || null,
        model: watchData.model || null,
        reference_number: watchData.reference_number || null,
        size: watchData.size || null,
        dial_color: watchData.dial_color || null,
        materials: watchData.materials || null,
        bezel_type: watchData.bezel_type || null,
        bracelet_type: watchData.bracelet_type || null,
        description: watchData.description || 'No description provided',
        confidence: (watchData.confidence === 'high' || watchData.confidence === 'medium' || watchData.confidence === 'low')                            
          ? watchData.confidence
          : (typeof watchData.confidence === 'number' && watchData.confidence >= 0.8 ? 'high' :                                                         
             typeof watchData.confidence === 'number' && watchData.confidence >= 0.5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      }));

      // Use the first watch as primary (for backward compatibility)
      const primaryWatch = mappedWatches[0];
      
      // Cleanup temp files
      try {
        const { rm } = await import('fs/promises');
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp files:', cleanupError);
      }

      // Format as detailed text description
      let analysisText = '';
      if (allWatches.length > 1) {
        analysisText = `The video contains ${allWatches.length} different watches:\n\n`;
        mappedWatches.forEach((watch, idx) => {
          analysisText += `**Watch ${idx + 1}:**\n`;
          analysisText += `- **Brand:** ${watch.brand || 'Unknown'}\n`;
          analysisText += `- **Model:** ${watch.model || 'Unknown'}\n`;
          analysisText += `- **Reference:** ${watch.reference_number || 'Unknown'}\n`;
          analysisText += `- **Dial Color:** ${watch.dial_color || 'Unknown'}\n`;
          analysisText += `- **Bezel:** ${watch.bezel_type || 'Unknown'}\n`;
          analysisText += `- **Bracelet:** ${watch.bracelet_type || 'Unknown'}\n`;
          analysisText += `- **Description:** ${watch.description}\n\n`;
        });
        analysisText += `\n**Primary Watch (for search):** ${primaryWatch.brand} ${primaryWatch.model} ${primaryWatch.reference_number || ''}`;
      } else {
        analysisText = `Here's a detailed analysis of the watch from the video:

**Brand Name:** ${primaryWatch.brand || 'Not visible in the video.'}

**Model Name:** ${primaryWatch.model || 'Not visible in the video.'}

**Reference Number:** ${primaryWatch.reference_number || 'Not visible in the video.'}

**Size:** ${primaryWatch.size || 'Not specified in the video.'}

**Detailed Description:**

**Dial Color:** ${primaryWatch.dial_color || 'Not clearly visible'}

**Materials:** ${primaryWatch.materials || 'Not clearly visible'}

**Bezel Type:** ${primaryWatch.bezel_type || 'Not clearly visible'}

**Bracelet Type:** ${primaryWatch.bracelet_type || 'Not clearly visible'}

**Additional Details:** ${primaryWatch.description}

**Confidence Level:** ${primaryWatch.confidence}

Overall, ${primaryWatch.description}`;
      }

      // Auto-detect item type based on analysis
      const detectedType = detectItemType(analysisText, primaryWatch);
      
      return NextResponse.json({
        success: true,
        watchInfo: primaryWatch, // Primary watch for backward compatibility
        allWatches: mappedWatches, // All watches found
        watchCount: allWatches.length,
        analysis: analysisText,
        framesAnalyzed: 0, // Direct video analysis, no frames extracted
        detectedItemType: detectedType, // Auto-detected item type
        message: allWatches.length > 1 
          ? `Video analyzed successfully - found ${allWatches.length} watches` 
          : 'Watch video analyzed successfully (direct video analysis)',
      });
    }

    // For local files or other URLs, download and extract frames
    if (videoFile) {
      console.log(`   File name: ${videoFile.name}`);
      console.log(`   File size: ${videoFile.size} bytes`);
      console.log(`   File type: ${videoFile.type}`);
      
      // Save uploaded file
      const arrayBuffer = await videoFile.arrayBuffer();
      await writeFile(videoPath, Buffer.from(arrayBuffer));
    } else if (videoUrl) {
      console.log(`   Video URL: ${videoUrl}`);
      // Download video from URL (for non-YouTube/Instagram URLs)
      await downloadVideo(videoUrl, videoPath);
    }

    // Extract frames from video
    console.log('   🎬 Extracting frames from video...');
    const framePaths = await extractFrames(videoPath, framesDir, 5);
    console.log(`   ✅ Extracted ${framePaths.length} frames`);

    // Analyze each frame
    console.log('   🤖 Analyzing frames with Gemini 2.5 Flash...');
    const analyses = await Promise.all(
      framePaths.map(async (framePath, index) => {
        console.log(`   📸 Analyzing frame ${index + 1}/${framePaths.length}...`);
        return await analyzeFrame(framePath);
      })
    );

    // Merge analyses
    const mergedAnalysis = mergeAnalyses(analyses);
    console.log(`   ✅ Analysis completed`);
    console.log(`   Extracted info:`, mergedAnalysis);

    // Format as detailed text description
    const analysisText = `Here's a detailed analysis of the watch from the video:

**Brand Name:** ${mergedAnalysis.brand || 'Not visible in the video.'}

**Model Name:** ${mergedAnalysis.model || 'Not visible in the video.'}

**Reference Number:** ${mergedAnalysis.reference_number || 'Not visible in the video.'}

**Size:** ${mergedAnalysis.size || 'Not specified in the video.'}

**Detailed Description:**

**Dial Color:** ${mergedAnalysis.dial_color || 'Not clearly visible'}

**Materials:** ${mergedAnalysis.materials || 'Not clearly visible'}

**Bezel Type:** ${mergedAnalysis.bezel_type || 'Not clearly visible'}

**Bracelet Type:** ${mergedAnalysis.bracelet_type || 'Not clearly visible'}

**Additional Details:** ${mergedAnalysis.description}

**Confidence Level:** ${mergedAnalysis.confidence}

Overall, ${mergedAnalysis.description}`;

    // Cleanup temp files
    try {
      const { rm } = await import('fs/promises');
      await rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp files:', cleanupError);
    }

    return NextResponse.json({
      success: true,
      watchInfo: mergedAnalysis,
      analysis: analysisText,
      framesAnalyzed: framePaths.length,
      message: 'Watch video analyzed successfully',
    });
  } catch (error: any) {
    console.error('❌ [Watch Video Analysis] Error:', error);
    
    // Cleanup on error
    try {
      const { rm } = await import('fs/promises');
      await rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process video',
      details: error.stack,
    }, { status: 500 });
  }
}

