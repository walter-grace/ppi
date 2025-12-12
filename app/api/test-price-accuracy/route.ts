import { NextResponse } from 'next/server';
import { getWatchMarketPrice } from '@/lib/arbitrage/analyze';

/**
 * Test endpoint to verify price estimation accuracy
 * Tests a few known watches and compares against real market prices
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const testWatch = searchParams.get('watch') || 'default';

  // Test cases with known watches
  const testCases: Record<string, { brand: string; model: string; title: string; expectedRange?: { min: number; max: number } }> = {
    default: {
      brand: 'Rolex',
      model: 'GMT-Master II',
      title: 'Rolex GMT-Master II 126710BLNR Batgirl Jubilee Bracelet',
      expectedRange: { min: 16000, max: 20000 } // Approximate market range
    },
    batgirl: {
      brand: 'Rolex',
      model: 'GMT-Master II',
      title: 'Rolex GMT-Master II 126710BLNR Batgirl',
      expectedRange: { min: 16000, max: 20000 }
    },
    submariner: {
      brand: 'Rolex',
      model: 'Submariner',
      title: 'Rolex Submariner 126610LN Black Dial',
      expectedRange: { min: 10000, max: 14000 }
    },
    datejust: {
      brand: 'Rolex',
      model: 'Datejust',
      title: 'Rolex Datejust 126334 Mint Green Dial',
      expectedRange: { min: 8000, max: 12000 }
    }
  };

  const testCase = testCases[testWatch] || testCases.default;

  console.log(`\n🧪 [Price Accuracy Test] Testing: ${testCase.brand} ${testCase.model}`);
  console.log(`   Title: ${testCase.title}`);
  if (testCase.expectedRange) {
    console.log(`   Expected Range: $${testCase.expectedRange.min.toLocaleString()} - $${testCase.expectedRange.max.toLocaleString()}`);
  }

  try {
    const startTime = Date.now();
    const result = await getWatchMarketPrice(
      testCase.brand,
      testCase.model,
      testCase.title
    );
    const duration = Date.now() - startTime;

    // Analyze accuracy
    let accuracyAnalysis = {
      inRange: false,
      deviation: null as number | null,
      accuracy: 'unknown' as 'high' | 'medium' | 'low' | 'unknown',
      notes: [] as string[]
    };

    if (result.market_price && testCase.expectedRange) {
      const price = result.market_price;
      const { min, max } = testCase.expectedRange;
      
      accuracyAnalysis.inRange = price >= min && price <= max;
      
      if (price < min) {
        accuracyAnalysis.deviation = ((min - price) / min) * 100;
        accuracyAnalysis.notes.push(`Price is ${accuracyAnalysis.deviation.toFixed(1)}% below expected minimum`);
      } else if (price > max) {
        accuracyAnalysis.deviation = ((price - max) / max) * 100;
        accuracyAnalysis.notes.push(`Price is ${accuracyAnalysis.deviation.toFixed(1)}% above expected maximum`);
      } else {
        accuracyAnalysis.notes.push('Price is within expected range');
      }

      // Determine accuracy level
      if (accuracyAnalysis.inRange) {
        accuracyAnalysis.accuracy = 'high';
      } else if (accuracyAnalysis.deviation && accuracyAnalysis.deviation < 20) {
        accuracyAnalysis.accuracy = 'medium';
      } else {
        accuracyAnalysis.accuracy = 'low';
      }
    }

    // Now search the web to verify
    console.log(`\n🔍 [Web Verification] Searching for real market prices...`);
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    let webVerification = null;

    if (openrouterKey) {
      try {
        const verifyResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini-search-preview',
            messages: [{
              role: 'user',
              content: `Search the web for the current market price of this watch and provide verification:

Watch: ${testCase.brand} ${testCase.model} ${testCase.title}

Our system estimated: $${result.market_price?.toLocaleString() || 'N/A'}

Please search WatchCharts, Chrono24, and other watch marketplaces to verify if this price is accurate. Return a JSON object with:
{
  "verified_price": 18000.00,
  "price_range": {"min": 17000, "max": 19000},
  "sources": ["WatchCharts", "Chrono24"],
  "is_accurate": true,
  "notes": "Price is within normal market range"
}`
            }],
          }),
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const verifyText = verifyData.choices[0].message.content;
          
          try {
            // Try to extract JSON
            const jsonMatch = verifyText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              webVerification = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            webVerification = { raw_response: verifyText.substring(0, 500) };
          }
        }
      } catch (error) {
        console.error('Web verification error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      testCase: {
        brand: testCase.brand,
        model: testCase.model,
        title: testCase.title,
        expectedRange: testCase.expectedRange
      },
      result: {
        market_price: result.market_price,
        retail_price: result.retail_price,
        source: result.source,
        watchcharts_url: result.watchcharts_url,
        duration: `${duration}ms`
      },
      accuracyAnalysis,
      webVerification,
      summary: {
        priceFound: !!result.market_price,
        inExpectedRange: accuracyAnalysis.inRange,
        accuracy: accuracyAnalysis.accuracy,
        hasWebVerification: !!webVerification
      }
    });

  } catch (error: any) {
    console.error('[Price Accuracy Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      testCase: {
        brand: testCase.brand,
        model: testCase.model,
        title: testCase.title
      }
    }, { status: 500 });
  }
}

