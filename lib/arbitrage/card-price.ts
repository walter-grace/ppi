/**
 * Card Market Price Estimation
 * 
 * Estimates market prices for trading cards using GPT-4o-mini with web search
 * (similar to watch price estimation)
 */

export interface CardPriceResult {
  market_price: number | null;
  retail_price: number | null;
  source: string;
  psa_url?: string | null;
  rawData?: any;
}

/**
 * Get card market price using GPT-4o-mini with web search
 */
export async function getCardMarketPrice(
  cardName: string,
  setName: string | null,
  grade: string | null,
  certNumber: string | null,
  year: string | null,
  edition: string | null,
  title: string
): Promise<CardPriceResult> {
  console.log(`\n🃏 [Card Price] Estimating price for: ${cardName} ${setName || ''} ${grade || ''}`);
  
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    console.log('⚠️  [Card Price] OPENROUTER_API_KEY not configured');
    return {
      market_price: null,
      retail_price: null,
      source: 'API key not configured',
      psa_url: null,
    };
  }

  // Build search query
  const searchParts: string[] = [];
  if (cardName) searchParts.push(cardName);
  if (setName) searchParts.push(setName);
  if (grade) searchParts.push(grade);
  if (year) searchParts.push(year);
  if (edition && edition.toLowerCase().includes('1st')) {
    searchParts.push('1st Edition');
  }
  
  const searchQuery = searchParts.length > 0 
    ? searchParts.join(' ') 
    : title;

  console.log(`🔍 [Card Price] Search query: "${searchQuery}"`);

  try {
    // Use GPT-4o-mini with web search (same as watches)
    console.log('🤖 [Card Price] Using GPT-4o-mini with web search to estimate card price');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PSA Card Price Estimation',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini-search-preview',
        messages: [
          {
            role: 'user',
            content: `Search the web for the current market price of this trading card: "${searchQuery}"

Look for:
1. PSA Price Guide prices (if graded)
2. Recent eBay sold listings
3. PriceCharting.com prices
4. Other market data sources

Return a JSON object with:
- market_price: The current market value in USD (number, or null if not found)
- retail_price: The retail/ungraded card price if available (number, or null)
- currency: "USD"
- source: Where you found the price (e.g., "PSA Price Guide", "eBay sold listings", "PriceCharting")
- confidence: "high", "medium", or "low"
- psa_url: If you find a PSA Price Guide URL, include it (or null)

Focus on finding actual sold prices from recent listings, not asking prices. If the card is PSA graded, prioritize PSA Price Guide data.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GPT-4o-mini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const contentText = data.choices?.[0]?.message?.content || '';
    
    console.log(`📄 [Card Price] GPT-4o-mini response (first 500 chars): ${contentText.substring(0, 500)}`);

    // Try to parse JSON from response
    let content: any;
    try {
      // Look for JSON in the response
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the whole response
        content = JSON.parse(contentText);
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract prices from text
      console.log('⚠️  [Card Price] Could not parse JSON, trying to extract from text...');
      
      // Look for price patterns in text
      const priceMatch = contentText.match(/\$[\d,]+\.?\d*/);
      if (priceMatch) {
        const priceStr = priceMatch[0].replace(/[$,]/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          content = {
            market_price: price,
            retail_price: null,
            currency: 'USD',
            source: 'Extracted from text',
            confidence: 'low',
            psa_url: null,
          };
        }
      }
    }

    if (!content) {
      throw new Error('Could not extract price data from response');
    }

    // Validate and extract PSA URL
    let psaUrl: string | null = null;
    if (content.psa_url) {
      try {
        const url = new URL(content.psa_url);
        // Accept PSA-related URLs
        if (url.hostname.includes('psacard.com') || url.hostname.includes('psa.com')) {
          psaUrl = content.psa_url;
        }
      } catch (e) {
        console.log(`⚠️  [Card Price] Invalid PSA URL: ${content.psa_url}`);
      }
    }

    const result: CardPriceResult = {
      market_price: content.market_price ? parseFloat(content.market_price) : null,
      retail_price: content.retail_price ? parseFloat(content.retail_price) : null,
      source: `AI web search (GPT-4o-mini-search-preview)${content.confidence ? ` - ${content.confidence} confidence` : ''}`,
      psa_url: psaUrl,
    };
    
    console.log(`✅ [Card Price] GPT-4o-mini estimated price:`, result);
    if (result.psa_url) {
      console.log(`🔗 [Card Price] PSA URL: ${result.psa_url}`);
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ [Card Price] Error estimating card price:', error);
    return {
      market_price: null,
      retail_price: null,
      source: `Error: ${error.message || 'Unknown error'}`,
      psa_url: null,
    };
  }
}

