import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

// Models to test (excluding Llama Guard 4 as it's for content moderation)
// Note: Some model IDs may need verification on OpenRouter
const VISION_MODELS = [
  {
    id: 'mistralai/ministral-3-3b-2512',
    name: 'Mistral Ministral 3 3B',
    costInput: 0.10,
    costOutput: 0.10,
    alternatives: ['mistralai/ministral-3-3b', 'mistralai/ministral-3b'],
  },
  {
    id: 'mistralai/ministral-3-8b-2512',
    name: 'Mistral Ministral 3 8B',
    costInput: 0.15,
    costOutput: 0.15,
    alternatives: ['mistralai/ministral-3-8b', 'mistralai/ministral-8b'],
  },
  {
    id: 'microsoft/phi-4-multimodal-instruct',
    name: 'Microsoft Phi 4 Multimodal',
    costInput: 0.05,
    costOutput: 0.10,
    alternatives: [],
  },
  {
    id: 'qwen/qwen-3-vl-30b-a3b-instruct',
    name: 'Qwen3 VL 30B',
    costInput: 0.14,
    costOutput: 1.00,
    alternatives: ['qwen/qwen-3-vl-30b', 'qwen/qwen3-vl-30b-instruct'],
  },
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Meta Llama 4 Maverick',
    costInput: 0.15,
    costOutput: 0.60,
    alternatives: [],
  },
  {
    id: 'openai/gpt-4o-2024-05-13',
    name: 'OpenAI GPT-4o',
    costInput: 5.00,
    costOutput: 15.00,
    alternatives: ['openai/gpt-4o', 'openai/gpt-4o-2024-08-06'],
  },
  {
    id: 'amazon/nova-premier-1.0',
    name: 'Amazon Nova Premier',
    costInput: 2.50,
    costOutput: 12.50,
    alternatives: ['amazon/nova-premier', 'amazon/nova-premier-1'],
  },
  {
    id: 'mistralai/ministral-3-14b-2512',
    name: 'Mistral Ministral 3 14B',
    costInput: 0.20,
    costOutput: 0.20,
    alternatives: ['mistralai/ministral-3-14b', 'mistralai/ministral-14b'],
  },
];

// Expected details for accuracy scoring
const EXPECTED_DETAILS = {
  brand: 'Rolex',
  model: 'Datejust',
  size: '41',
  dialColor: 'Mint Green',
  reference: ['126334', 'M126334-0027'],
  materials: ['Steel', 'White Gold'],
  bezel: 'Fluted',
  bracelet: 'Oyster',
};

function scoreAccuracy(text: string): {
  score: number;
  maxScore: number;
  details: Record<string, boolean>;
} {
  const lowerText = text.toLowerCase();
  const details: Record<string, boolean> = {};
  let score = 0;
  let maxScore = 0;

  // Brand (2 points)
  maxScore += 2;
  details.brand = lowerText.includes('rolex');
  if (details.brand) score += 2;

  // Model (2 points)
  maxScore += 2;
  details.model = lowerText.includes('datejust');
  if (details.model) score += 2;

  // Size (1 point)
  maxScore += 1;
  details.size = lowerText.includes('41') || lowerText.includes('41mm');
  if (details.size) score += 1;

  // Dial Color (2 points)
  maxScore += 2;
  details.dialColor = lowerText.includes('mint green') || lowerText.includes('mint');
  if (details.dialColor) score += 2;

  // Reference Number (2 points)
  maxScore += 2;
  details.reference = EXPECTED_DETAILS.reference.some(ref => 
    lowerText.includes(ref.toLowerCase())
  );
  if (details.reference) score += 2;

  // Materials (1 point)
  maxScore += 1;
  details.materials = (lowerText.includes('steel') || lowerText.includes('stainless')) &&
    (lowerText.includes('white gold') || lowerText.includes('whitegold'));
  if (details.materials) score += 1;

  // Bezel (1 point)
  maxScore += 1;
  details.bezel = lowerText.includes('fluted');
  if (details.bezel) score += 1;

  // Bracelet (1 point)
  maxScore += 1;
  details.bracelet = lowerText.includes('oyster');
  if (details.bracelet) score += 1;

  return { score, maxScore, details };
}

async function testModel(
  model: typeof VISION_MODELS[0],
  dataUrl: string,
  imageSize: number
): Promise<{
  model: string;
  name: string;
  success: boolean;
  duration: number;
  durationMs: string;
  response?: string;
  error?: string;
  attemptedIds?: string[];
  accuracy?: {
    score: number;
    maxScore: number;
    percentage: number;
    details: Record<string, boolean>;
  };
  estimatedCost?: {
    input: number;
    output: number;
    total: number;
  };
}> {
  const startTime = Date.now();
  
  // Try the primary ID first, then alternatives if it fails
  const modelIdsToTry = [model.id, ...(model.alternatives || [])];
  let lastError: any = null;
  
  for (const modelId of modelIdsToTry) {
    try {
      console.log(`\n   🧪 Testing: ${model.name} (${modelId})`);
      
      const result = await generateText({
        model: openrouter(modelId),
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
              text: `Analyze this watch image and describe what you see. Include:
- Brand name (e.g., Rolex, Omega, Seiko, etc.)
- Model name (e.g., Submariner, Speedmaster, Datejust, etc.)
- Reference number (if visible - look for numbers like "126334", "M126334-0027", etc.)
- Size (e.g., 41mm, 40mm, etc.)
- Dial color
- Materials (case and bracelet)
- Bezel type (fluted, smooth, etc.)
- Bracelet type (Oyster, Jubilee, etc.)
- Any other distinguishing features

Be specific and detailed. If you can see text on the dial, case, or documentation, include it.`,
            },
          ],
        },
      ],
    });
    
    const duration = Date.now() - startTime;
    const responseText = result.text;
    
    // Estimate token costs (rough approximation: 1 token ≈ 4 chars)
    const inputTokens = Math.ceil((imageSize + 200) / 4); // Image + prompt
    const outputTokens = Math.ceil(responseText.length / 4);
    const inputCost = (inputTokens / 1_000_000) * model.costInput;
    const outputCost = (outputTokens / 1_000_000) * model.costOutput;
    const totalCost = inputCost + outputCost;
    
    const accuracy = scoreAccuracy(responseText);
    
    console.log(`   ✅ Completed in ${duration}ms | Accuracy: ${((accuracy.score / accuracy.maxScore) * 100).toFixed(1)}%`);
    
      return {
        model: modelId,
        name: model.name,
        success: true,
        duration,
        durationMs: `${duration}ms`,
        response: responseText,
        accuracy: {
          ...accuracy,
          percentage: (accuracy.score / accuracy.maxScore) * 100,
        },
        estimatedCost: {
          input: inputCost,
          output: outputCost,
          total: totalCost,
        },
      };
    } catch (error: any) {
      lastError = error;
      // If this isn't the last alternative, continue to next
      if (modelId !== modelIdsToTry[modelIdsToTry.length - 1]) {
        console.log(`   ⚠️  ${modelId} failed, trying alternative...`);
        continue;
      }
    }
  }
  
  // All attempts failed
  const duration = Date.now() - startTime;
  console.log(`   ❌ All attempts failed in ${duration}ms: ${lastError?.message || 'Unknown error'}`);
  
  return {
    model: model.id,
    name: model.name,
    success: false,
    duration,
    durationMs: `${duration}ms`,
    error: lastError?.message || 'All model ID attempts failed',
    attemptedIds: modelIdsToTry,
  };
}

export async function GET(req: Request) {
  const overallStartTime = Date.now();
  
  try {
    console.log('\n🚀 [Vision Models Benchmark] Starting comprehensive test...');
    
    // Read the test image
    const imagePath = join(
      process.cwd(),
      'app',
      'images',
      'rolex-datejust-oyster-41-mm-oystersteel-mint-green-dial-fluted-bezel-oysterbracelet-reference-126334-404805_1280x.webp'
    );
    
    console.log(`   📸 Image path: ${imagePath}`);
    
    const imageBuffer = await readFile(imagePath);
    const imageSize = imageBuffer.length;
    console.log(`   📦 Image size: ${(imageSize / 1024).toFixed(2)} KB`);
    
    // Convert to base64
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Image}`;
    
    // Check API key
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENROUTER_API_KEY not configured',
        message: 'Please set OPENROUTER_API_KEY in your .env.local file.',
      }, { status: 500 });
    }
    
    console.log(`\n   🧪 Testing ${VISION_MODELS.length} vision models...`);
    console.log(`   Expected watch: ${EXPECTED_DETAILS.brand} ${EXPECTED_DETAILS.model} ${EXPECTED_DETAILS.size}mm ${EXPECTED_DETAILS.dialColor} Dial`);
    console.log(`   Expected reference: ${EXPECTED_DETAILS.reference.join(' or ')}\n`);
    
    // Test all models sequentially
    const results = [];
    for (const model of VISION_MODELS) {
      const result = await testModel(model, dataUrl, imageSize);
      results.push(result);
      
      // Small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const overallDuration = Date.now() - overallStartTime;
    
    // Sort results by accuracy (successful ones first), then by speed
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    successfulResults.sort((a, b) => {
      if (a.accuracy && b.accuracy) {
        // Sort by accuracy first
        if (Math.abs(a.accuracy.percentage - b.accuracy.percentage) > 1) {
          return b.accuracy.percentage - a.accuracy.percentage;
        }
      }
      // Then by speed
      return a.duration - b.duration;
    });
    
    // Find best overall (accuracy + speed balance)
    const bestOverall = successfulResults.length > 0 ? successfulResults[0] : null;
    const fastest = successfulResults.length > 0 
      ? successfulResults.reduce((prev, curr) => prev.duration < curr.duration ? prev : curr)
      : null;
    const mostAccurate = successfulResults.length > 0
      ? successfulResults.reduce((prev, curr) => 
          (prev.accuracy?.percentage || 0) > (curr.accuracy?.percentage || 0) ? prev : curr
        )
      : null;
    const cheapest = successfulResults.length > 0
      ? successfulResults.reduce((prev, curr) => 
          (prev.estimatedCost?.total || Infinity) < (curr.estimatedCost?.total || Infinity) ? prev : curr
        )
      : null;
    
    console.log(`\n✅ [Benchmark] Completed in ${overallDuration}ms`);
    console.log(`   Successful: ${successfulResults.length}/${VISION_MODELS.length}`);
    if (bestOverall) {
      console.log(`   Best Overall: ${bestOverall.name} (${bestOverall.accuracy?.percentage.toFixed(1)}% accuracy, ${bestOverall.durationMs})`);
    }
    if (fastest) {
      console.log(`   Fastest: ${fastest.name} (${fastest.durationMs})`);
    }
    if (mostAccurate) {
      console.log(`   Most Accurate: ${mostAccurate.name} (${mostAccurate.accuracy?.percentage.toFixed(1)}%)`);
    }
    if (cheapest) {
      console.log(`   Cheapest: ${cheapest.name} ($${cheapest.estimatedCost?.total.toFixed(6)})`);
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        totalModels: VISION_MODELS.length,
        successful: successfulResults.length,
        failed: failedResults.length,
        totalDuration: `${overallDuration}ms`,
        expectedWatch: `${EXPECTED_DETAILS.brand} ${EXPECTED_DETAILS.model} ${EXPECTED_DETAILS.size}mm ${EXPECTED_DETAILS.dialColor} Dial`,
        expectedReference: EXPECTED_DETAILS.reference.join(' or '),
      },
      bestOverall: bestOverall ? {
        model: bestOverall.model,
        name: bestOverall.name,
        accuracy: bestOverall.accuracy?.percentage,
        duration: bestOverall.durationMs,
        cost: bestOverall.estimatedCost?.total,
      } : null,
      fastest: fastest ? {
        model: fastest.model,
        name: fastest.name,
        duration: fastest.durationMs,
        accuracy: fastest.accuracy?.percentage,
      } : null,
      mostAccurate: mostAccurate ? {
        model: mostAccurate.model,
        name: mostAccurate.name,
        accuracy: mostAccurate.accuracy?.percentage,
        duration: mostAccurate.durationMs,
      } : null,
      cheapest: cheapest ? {
        model: cheapest.model,
        name: cheapest.name,
        cost: cheapest.estimatedCost?.total,
        accuracy: cheapest.accuracy?.percentage,
        duration: cheapest.durationMs,
      } : null,
      results: [...successfulResults, ...failedResults],
    });
  } catch (error: any) {
    const overallDuration = Date.now() - overallStartTime;
    console.error(`\n❌ [Vision Models Benchmark] Failed after ${overallDuration}ms:`, error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to run benchmark',
      duration: `${overallDuration}ms`,
    }, { status: 500 });
  }
}

