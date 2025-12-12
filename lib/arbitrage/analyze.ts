/**
 * Arbitrage Analysis Module
 * 
 * Analyzes eBay search results to find undervalued items:
 * - For watches: Uses Watch Database MCP to get market prices
 * - For trading cards: Uses PSA grade from aspects to estimate market value
 */

import { getMCPManager } from '@/lib/mcp/client';
import { getCardMarketPrice } from './card-price';
import { detectItemType, getItemTypeConfig, type ItemType as ConfigItemType } from '@/lib/item-types/config';

export type ValuationStatus = 'undervalued' | 'fair_value' | 'overvalued' | 'unknown';

export interface ArbitrageOpportunity {
  item_id: string;
  has_arbitrage: boolean;
  valuation_status: ValuationStatus;
  spread_usd?: number;
  spread_pct?: number;
  market_price_usd?: number;
  retail_price_usd?: number;
  all_in_cost_usd: number;
  potential_profit_usd?: number;
  potential_loss_usd?: number;
  risk_level: 'low' | 'medium' | 'high';
  confidence: 'high' | 'medium' | 'low';
  price_source?: string;
  watchcharts_url?: string; // URL to WatchCharts page for this watch
  // Thresholds for categorization (in percentage)
  undervalued_threshold?: number; // Default: -10% (10% below market)
  overvalued_threshold?: number;  // Default: +10% (10% above market)
}

export interface EbayItemWithArbitrage {
  item_id: string;
  title: string;
  price_usd: number;
  shipping_usd: number;
  total_cost_usd: number;
  url: string;
  image_url?: string;
  condition?: string;
  brand?: string;
  model?: string;
  currency: string;
  aspects?: Record<string, string>;
  arbitrage?: ArbitrageOpportunity;
}

/**
 * Extract PSA grade from card aspects or title
 */
function extractPSAGrade(item: any): number | null {
  // Check aspects first
  if (item.aspects?.Grade) {
    const grade = parseInt(item.aspects.Grade);
    if (!isNaN(grade) && grade >= 1 && grade <= 10) {
      return grade;
    }
  }
  
  // Check title for "PSA 10", "PSA 9", etc.
  const title = item.title || '';
  const psaMatch = title.match(/PSA\s*(\d+)/i);
  if (psaMatch) {
    const grade = parseInt(psaMatch[1]);
    if (!isNaN(grade) && grade >= 1 && grade <= 10) {
      return grade;
    }
  }
  
  return null;
}

/**
 * Estimate card market price based on PSA grade
 * This is a simplified estimation - in production, you'd use PSA Price Guide API
 */
async function estimateCardMarketPrice(
  title: string,
  psaGrade: number,
  aspects: Record<string, string>
): Promise<{ market_price: number | null; source: string }> {
  // For now, use a simple heuristic based on grade
  // In production, integrate with PSA Price Guide API or PriceCharting
  
  // Extract card name from title (remove PSA grade, etc.)
  let cardName = title
    .replace(/PSA\s*\d+/gi, '')
    .replace(/GRADED/gi, '')
    .trim();
  
  // Use AI to estimate price if we have OpenRouter key
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [{
            role: 'user',
            content: `Estimate the current market price for a PSA ${psaGrade} ${cardName} trading card. Consider recent eBay sold listings. Return ONLY a JSON object: {"market_price": 500.00, "currency": "USD"}. If you cannot estimate, return {"market_price": null}.`
          }],
          max_tokens: 200,
          response_format: { type: 'json_object' }
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        if (content.market_price) {
          return {
            market_price: content.market_price,
            source: 'AI estimation (Claude)'
          };
        }
      }
    } catch (error) {
      console.error('Error estimating card price with AI:', error);
    }
  }
  
  // Fallback: rough estimate based on grade multiplier
  // PSA 10 is typically 5-10x raw card value, PSA 9 is 2-3x, etc.
  // This is very rough and should be replaced with real data
  return {
    market_price: null,
    source: 'Unable to estimate'
  };
}

/**
 * Get watch market price using Watch Database MCP
 */
export async function getWatchMarketPrice(
  brand: string,
  model: string,
  title: string
): Promise<{ market_price: number | null; retail_price: number | null; source: string; watchcharts_url?: string | null; rawData?: any }> {
  const manager = getMCPManager();
  
  // Try Watch Database first if connected, but always fallback to GPT-4o-mini
  if (manager.isConnected('watch-database')) {
    // First, let's see what tools are available
    let availableTools: string[] = [];
    let searchAttempts: any[] = [];
    
    try {
      const tools = await manager.listTools('watch-database');
      availableTools = tools.map(t => t.name);
      console.log(`📋 [Watch DB] Available tools (${tools.length}):`, availableTools);
      console.log(`📋 [Watch DB] Tool details:`, JSON.stringify(tools.map(t => ({
        name: t.name,
        description: t.description?.substring(0, 100),
        inputSchema: t.inputSchema
      })), null, 2));
    } catch (error) {
      console.error('❌ [Watch DB] Error listing tools:', error);
    }
    
    try {
    // Try multiple search strategies
    let watchData = null;
    const searchTitle = title || `${brand} ${model}`.trim();
    
    console.log(`\n🔍 [Watch DB] === Starting search for watch ===`);
    console.log(`   Title: "${title}"`);
    console.log(`   Brand: "${brand}" (${brand ? 'has value' : 'EMPTY'})`);
    console.log(`   Model: "${model}" (${model ? 'has value' : 'EMPTY'})`);
    console.log(`   Search query: "${searchTitle}"`);
    
    // Strategy 1: Search by name/title (most flexible)
    if (searchTitle && searchTitle.trim()) {
      try {
        // Try different tool names that might exist (matching actual API tool names)
        // Based on terminal logs, the actual tool is "Search_Watches_by_name"
        const searchToolNames = ['Search_Watches_by_name', 'search_watches', 'search', 'search_by_name'];
        let searchResult: any = null;
        let usedTool = '';
        
        for (const toolName of searchToolNames) {
          if (!availableTools.includes(toolName)) {
            console.log(`   ⚠️  Tool "${toolName}" not in available tools, skipping`);
            continue;
          }
          
          console.log(`\n🔍 [Watch DB] Strategy 1: Trying tool "${toolName}" with query="${searchTitle}"`);
          
          // Try different parameter combinations based on the tool schema
          // From the API schema, Search_Watches_by_name requires: searchTerm (string), limit (string), page (string)
          const paramAttempts = [
            { searchTerm: searchTitle, limit: "1", page: "1" }, // Correct format for Search_Watches_by_name
            { searchTerm: searchTitle, limit: 1, page: 1 },     // Try numbers
            { name: searchTitle, limit: 1 },                    // Fallback format
            { query: searchTitle, limit: 1 },                  // Another fallback
          ];
          
          for (const params of paramAttempts) {
            try {
              console.log(`   📤 Trying params:`, params);
              searchResult = await manager.callTool('watch-database', toolName, params);
              usedTool = toolName;
              console.log(`   ✅ Success with params:`, params);
              break;
            } catch (err: any) {
              console.log(`   ⚠️  Failed with params ${JSON.stringify(params)}:`, err.message?.substring(0, 100));
            }
          }
          
          if (searchResult) break;
        }
        
        if (searchResult) {
          searchAttempts.push({
            strategy: 'search_by_name',
            tool: usedTool,
            query: searchTitle,
            success: searchResult.success,
            hasContent: !!searchResult.content,
            error: searchResult.error
          });
          
          console.log(`\n📊 [Watch DB] Strategy 1 result (tool: ${usedTool}):`);
          console.log(`   Success: ${searchResult.success}`);
          console.log(`   Has content: ${!!searchResult.content}`);
          console.log(`   Content type: ${typeof searchResult.content}`);
          console.log(`   Is array: ${Array.isArray(searchResult.content)}`);
          if (searchResult.content && typeof searchResult.content === 'object') {
            console.log(`   Content keys:`, Object.keys(searchResult.content));
          }
          console.log(`   Full response:`, JSON.stringify(searchResult.content, null, 2));
          
          if (searchResult.success && searchResult.content) {
            const watches = Array.isArray(searchResult.content) 
              ? searchResult.content 
              : searchResult.content.watches || searchResult.content.data || searchResult.content.results || searchResult.content.items || [];
            
            console.log(`\n📦 [Watch DB] Extracted ${watches.length} watches from response`);
            if (watches.length > 0) {
              console.log(`   First watch:`, JSON.stringify(watches[0], null, 2));
              watchData = watches[0];
            }
          }
        }
      } catch (error: any) {
        console.error('❌ [Watch DB] Error in Strategy 1:', error);
        searchAttempts.push({
          strategy: 'search_by_name',
          error: error.message
        });
      }
    }
    
    // Strategy 2: Search by brand and model (if we have both)
    if (!watchData && brand && model && brand.trim() && model.trim()) {
      try {
        console.log(`\n🔍 [Watch DB] Strategy 2: Searching by brand="${brand}" model="${model}"`);
        const searchResult = await manager.callTool('watch-database', 'search_watches', {
          brand,
          model,
          limit: 1
        });
        
        searchAttempts.push({
          strategy: 'brand+model',
          query: { brand, model },
          success: searchResult.success,
          hasContent: !!searchResult.content,
          error: searchResult.error
        });
        
        console.log(`📊 [Watch DB] Strategy 2 result:`, JSON.stringify({
          success: searchResult.success,
          hasContent: !!searchResult.content,
          contentType: typeof searchResult.content,
          isArray: Array.isArray(searchResult.content),
          keys: searchResult.content && typeof searchResult.content === 'object' ? Object.keys(searchResult.content) : [],
          fullResponse: searchResult.content
        }, null, 2));
        
        if (searchResult.success && searchResult.content) {
          const watches = Array.isArray(searchResult.content) 
            ? searchResult.content 
            : searchResult.content.watches || searchResult.content.data || searchResult.content.results || [];
          
          console.log(`📦 [Watch DB] Found ${watches.length} watches, first watch data:`, JSON.stringify(watches[0] || {}, null, 2));
          
          if (watches.length > 0) {
            watchData = watches[0];
          }
        }
      } catch (error: any) {
        console.error('❌ [Watch DB] Error in Strategy 2:', error);
        searchAttempts.push({
          strategy: 'brand+model',
          error: error.message
        });
      }
    }
    
    // Log all search attempts summary
    console.log(`\n📋 [Watch DB] Search attempts summary:`, JSON.stringify(searchAttempts, null, 2));
    
    // If we found watch data, try to get price information
    if (watchData) {
      console.log(`💰 [Watch DB] Watch data fields:`, Object.keys(watchData));
      console.log(`💰 [Watch DB] Full watch data:`, JSON.stringify(watchData, null, 2));
      
      // Watch Database might have price fields - check various possible field names
      const marketPrice = watchData.market_price || watchData.avg_price || watchData.price || 
                         watchData.current_price || watchData.average_price || watchData.marketValue;
      const retailPrice = watchData.retail_price || watchData.msrp || watchData.retailPrice || 
                         watchData.list_price || watchData.suggested_retail_price;
      
      console.log(`💰 [Watch DB] Extracted prices:`, {
        marketPrice,
        retailPrice,
        marketPriceType: typeof marketPrice,
        retailPriceType: typeof retailPrice
      });
      
      if (marketPrice || retailPrice) {
        const result = {
          market_price: marketPrice ? parseFloat(String(marketPrice)) : null,
          retail_price: retailPrice ? parseFloat(String(retailPrice)) : null,
          source: 'Watch Database MCP',
          rawData: watchData, // Include raw data for verification
        };
        console.log(`✅ [Watch DB] Returning prices:`, result);
        return result;
      } else {
        console.log(`⚠️  [Watch DB] No price fields found in watch data`);
      }
    } else {
      console.log(`\n⚠️  [Watch DB] === No watch data found ===`);
      console.log(`   Tried ${searchAttempts.length} search strategies`);
      console.log(`   Search attempts:`, JSON.stringify(searchAttempts, null, 2));
      console.log(`   Available tools:`, availableTools);
      console.log(`   Input: brand="${brand}", model="${model}", title="${title}"`);
    }
    } catch (error: any) {
      console.error('❌ [Watch DB] Error in watch search:', error);
    }
  } else {
    console.log(`⚠️  [Watch DB] Watch Database MCP not connected, skipping Watch DB search`);
  }
  
  // Fallback: Use GPT-4o-mini with web search to estimate (primary method when Watch DB fails or not connected)
  // Extract reference number from title (needed for search query and URL construction)
  const referenceMatch = title.match(/\b\d{6}[A-Z]*\b/);
  const reference = referenceMatch ? referenceMatch[0] : undefined;
  
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    try {
      console.log(`🤖 [AI] Using GPT-4o-mini with web search to estimate watch price`);
        
        // Build simplified search query - just brand + model + reference for faster results
        // GPT-4o-mini will search and find prices from WatchCharts/Chrono24 automatically
        const searchQuery = reference 
          ? `${brand} ${model} ${reference} price`
          : `${brand} ${model} price`;
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'X-Title': 'PSA MCP Chatbot',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini-search-preview', // Use search preview model for web search
            messages: [{
              role: 'user',
              content: `You are an expert watch market analyst. Use web search to find the current market price for this watch from WatchCharts, Chrono24, and other reliable watch marketplaces.

Watch Details:
- Brand: ${brand || 'Unknown'}
- Model: ${model || 'Unknown'}
- Reference: ${reference || 'Not specified'}
- Full Title: ${title}

IMPORTANT: Search the web for: "${searchQuery}"

After searching, extract the actual market price from the search results:
1. WatchCharts.com - look for market price, price index, or current value (this is the most reliable source)
2. Chrono24.com - look for current listings and sold prices
3. eBay sold listings - average sold prices

Look for specific dollar amounts ($X,XXX) in the search results. If you find multiple prices, calculate the average.

Focus on finding the current market value (what the watch actually sells for), not the retail/MSRP price.

Return ONLY a JSON object with this exact format:
{
  "market_price": 12500.00,
  "retail_price": 15000.00,
  "currency": "USD",
  "source": "WatchCharts/Chrono24 web search",
  "confidence": "high",
  "watchcharts_url": "https://watchcharts.com/watch/rolex/gmt-master-ii/126710blnr"
}

CRITICAL: For "watchcharts_url":
- ONLY include a URL if you actually see a WatchCharts.com link in the web search results
- Do NOT make up or guess URLs - only use URLs that appear in the search results
- If you don't see a WatchCharts URL in the search results, set "watchcharts_url" to null
- The URL must be a real, clickable link from the search results, not a constructed URL

Use the actual prices you find from web search. If you cannot find prices through web search, return:
{
  "market_price": null,
  "retail_price": null,
  "currency": null,
  "source": null,
  "confidence": "low",
  "watchcharts_url": null
}

Return ONLY the JSON, nothing else.`
            }],
            // Note: response_format is not supported with web_search, so we'll parse JSON from text
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          let contentText = data.choices[0].message.content;
          
          console.log(`📄 [AI] GPT-4o-mini response (first 500 chars):`, contentText.substring(0, 500));
          
          // Try to extract JSON from response (web search models return text, not pure JSON)
          try {
            // First try direct parse (in case it's pure JSON)
            const content = JSON.parse(contentText);
            let watchchartsUrl = content.watchcharts_url || null;
            
            // Validate WatchCharts URL - must be from watchcharts.com and look valid
            // Valid WatchCharts URL patterns:
            // - /watches/brand/[brand]/[model] (e.g., /watches/brand/rolex/gmt-master)
            // - /watch_model/[id] or /watch_model/[id]-[name]/overview
            // - /watches?search=... (search URLs)
            // Reject: /watch/[brand]/[model]/[reference] (singular watch, likely constructed)
            if (watchchartsUrl) {
              try {
                const url = new URL(watchchartsUrl);
                // Only accept watchcharts.com URLs
                if (!url.hostname.includes('watchcharts.com')) {
                  console.log(`⚠️  [AI] Invalid WatchCharts URL (wrong domain): ${watchchartsUrl}`);
                  watchchartsUrl = null;
                } else {
                  const path = url.pathname.toLowerCase();
                  // Accept valid patterns
                  const validPatterns = [
                    /^\/watches\/brand\/[^\/]+\/[^\/]+/,  // /watches/brand/rolex/gmt-master
                    /^\/watch_model\/\d+/,                // /watch_model/1525
                    /^\/watch_model\/\d+-[^\/]+/,         // /watch_model/1525-rolex-gmt-master-ii-batgirl-126710blnr
                    /^\/watches\?/,                       // /watches?search=...
                  ];
                  
                  // Reject patterns that look constructed (singular /watch/ with 3+ segments)
                  const invalidPattern = /^\/watch\/[^\/]+\/[^\/]+\/[^\/]+$/; // /watch/brand/model/reference
                  
                  const isValid = validPatterns.some(pattern => pattern.test(path));
                  const isInvalid = invalidPattern.test(path);
                  
                  if (isInvalid) {
                    console.log(`⚠️  [AI] WatchCharts URL appears to be constructed/fake: ${watchchartsUrl}`);
                    watchchartsUrl = null;
                  } else if (!isValid && path.length < 10) {
                    // Too short to be a real URL (unless it's a valid pattern)
                    console.log(`⚠️  [AI] Invalid WatchCharts URL (too short): ${watchchartsUrl}`);
                    watchchartsUrl = null;
                  } else if (!isValid && !path.includes('watch') && !path.includes('search')) {
                    // Doesn't match any known pattern and doesn't contain watch/search keywords
                    console.log(`⚠️  [AI] WatchCharts URL doesn't match known patterns: ${watchchartsUrl}`);
                    // Don't reject it - might be a valid URL we don't know about
                  }
                }
              } catch (e) {
                console.log(`⚠️  [AI] Invalid WatchCharts URL (parse error): ${watchchartsUrl}`);
                watchchartsUrl = null;
              }
            }
            
            // If no valid WatchCharts URL from AI, construct a search URL ourselves
            // WatchCharts URL format: https://watchcharts.com/watches?search=Brand+Model
            if (!watchchartsUrl && reference) {
              // Construct a WatchCharts search URL using the reference number
              // Prefer: Brand + Reference (e.g., "Rolex 126710BLNR")
              const searchQuery = `${brand} ${reference}`.trim().replace(/\s+/g, '+');
              watchchartsUrl = `https://watchcharts.com/watches?search=${searchQuery}`;
              console.log(`🔗 [AI] Constructed WatchCharts search URL: ${watchchartsUrl}`);
            } else if (!watchchartsUrl && (brand || model)) {
              // Fallback: use brand and model for search (e.g., "Rolex GMT-Master II")
              const searchQuery = `${brand} ${model}`.trim().replace(/\s+/g, '+');
              watchchartsUrl = `https://watchcharts.com/watches?search=${searchQuery}`;
              console.log(`🔗 [AI] Constructed WatchCharts search URL (fallback): ${watchchartsUrl}`);
            }
            
            const result = {
              market_price: content.market_price ? parseFloat(content.market_price) : null,
              retail_price: content.retail_price ? parseFloat(content.retail_price) : null,
              source: `AI web search (GPT-4o-mini-search-preview)${content.confidence ? ` - ${content.confidence} confidence` : ''}`,
              watchcharts_url: watchchartsUrl
            };
            console.log(`✅ [AI] GPT-4o-mini estimated price:`, result);
            if (result.watchcharts_url) {
              console.log(`🔗 [AI] WatchCharts URL: ${result.watchcharts_url}`);
            }
            return result;
          } catch (parseError) {
            // Try to extract JSON from text (look for {...} pattern)
            const jsonMatch = contentText.match(/\{[\s\S]*"market_price"[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const content = JSON.parse(jsonMatch[0]);
                let watchchartsUrl = content.watchcharts_url || null;
                
                // Validate WatchCharts URL - must be from watchcharts.com and look valid
                // Valid WatchCharts URL patterns:
                // - /watches/brand/[brand]/[model] (e.g., /watches/brand/rolex/gmt-master)
                // - /watch_model/[id] or /watch_model/[id]-[name]/overview
                // - /watches?search=... (search URLs)
                // Reject: /watch/[brand]/[model]/[reference] (singular watch, likely constructed)
                if (watchchartsUrl) {
                  try {
                    const url = new URL(watchchartsUrl);
                    // Only accept watchcharts.com URLs
                    if (!url.hostname.includes('watchcharts.com')) {
                      console.log(`⚠️  [AI] Invalid WatchCharts URL (wrong domain): ${watchchartsUrl}`);
                      watchchartsUrl = null;
                    } else {
                      const path = url.pathname.toLowerCase();
                      // Accept valid patterns
                      const validPatterns = [
                        /^\/watches\/brand\/[^\/]+\/[^\/]+/,  // /watches/brand/rolex/gmt-master
                        /^\/watch_model\/\d+/,                // /watch_model/1525
                        /^\/watch_model\/\d+-[^\/]+/,         // /watch_model/1525-rolex-gmt-master-ii-batgirl-126710blnr
                        /^\/watches\?/,                       // /watches?search=...
                      ];
                      
                      // Reject patterns that look constructed (singular /watch/ with 3+ segments)
                      const invalidPattern = /^\/watch\/[^\/]+\/[^\/]+\/[^\/]+$/; // /watch/brand/model/reference
                      
                      const isValid = validPatterns.some(pattern => pattern.test(path));
                      const isInvalid = invalidPattern.test(path);
                      
                      if (isInvalid) {
                        console.log(`⚠️  [AI] WatchCharts URL appears to be constructed/fake: ${watchchartsUrl}`);
                        watchchartsUrl = null;
                      } else if (!isValid && path.length < 10) {
                        // Too short to be a real URL (unless it's a valid pattern)
                        console.log(`⚠️  [AI] Invalid WatchCharts URL (too short): ${watchchartsUrl}`);
                        watchchartsUrl = null;
                      } else if (!isValid && !path.includes('watch') && !path.includes('search')) {
                        // Doesn't match any known pattern and doesn't contain watch/search keywords
                        console.log(`⚠️  [AI] WatchCharts URL doesn't match known patterns: ${watchchartsUrl}`);
                        // Don't reject it - might be a valid URL we don't know about
                      }
                    }
                  } catch (e) {
                    console.log(`⚠️  [AI] Invalid WatchCharts URL (parse error): ${watchchartsUrl}`);
                    watchchartsUrl = null;
                  }
                }
                
                // If no valid WatchCharts URL from AI, construct a search URL ourselves
                if (!watchchartsUrl && reference) {
                  // Construct a WatchCharts search URL using the reference number
              const searchQuery = `${brand} ${reference}`.trim().replace(/\s+/g, '+');
              watchchartsUrl = `https://watchcharts.com/watches?search=${searchQuery}`;
                  console.log(`🔗 [AI] Constructed WatchCharts search URL: ${watchchartsUrl}`);
                } else if (!watchchartsUrl && (brand || model)) {
                  // Fallback: use brand and model for search
              const searchQuery = `${brand} ${model}`.trim().replace(/\s+/g, '+');
              watchchartsUrl = `https://watchcharts.com/watches?search=${searchQuery}`;
                  console.log(`🔗 [AI] Constructed WatchCharts search URL (fallback): ${watchchartsUrl}`);
                }
                
                const result = {
                  market_price: content.market_price ? parseFloat(content.market_price) : null,
                  retail_price: content.retail_price ? parseFloat(content.retail_price) : null,
                  source: `AI web search (GPT-4o-mini-search-preview)${content.confidence ? ` - ${content.confidence} confidence` : ''}`,
                  watchcharts_url: watchchartsUrl
                };
                console.log(`✅ [AI] GPT-4o-mini estimated price (extracted):`, result);
                if (result.watchcharts_url) {
                  console.log(`🔗 [AI] WatchCharts URL: ${result.watchcharts_url}`);
                }
                return result;
              } catch (e) {
                console.log(`⚠️  [AI] Failed to parse extracted JSON:`, e);
              }
            }
            
            // Last resort: try to extract price numbers from the text
            const priceMatches = contentText.match(/\$([\d,]+(?:\.\d{2})?)/g);
            if (priceMatches && priceMatches.length > 0) {
              const prices = priceMatches.map((m: string) => parseFloat(m.replace(/[$,]/g, ''))).filter((p: number) => p > 100 && p < 100000);
              if (prices.length > 0) {
                const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
                console.log(`✅ [AI] Extracted average price from text: $${avgPrice.toFixed(2)}`);
                return {
                  market_price: avgPrice,
                  retail_price: avgPrice * 1.2, // Estimate retail as 20% higher
                  source: 'AI web search (GPT-4o-mini-search-preview) - extracted from text'
                };
              }
            }
            
            console.log(`⚠️  [AI] Could not extract price from response`);
            throw parseError;
          }
        } else {
          const errorText = await response.text();
          console.error(`❌ [AI] GPT-4o-mini API error: ${response.status} - ${errorText}`);
        }
      } catch (error: any) {
        console.error('❌ [AI] Error estimating watch price with GPT-4o-mini:', error.message);
      }
    }
    
    return {
      market_price: null,
      retail_price: null,
      source: 'Unable to estimate',
      watchcharts_url: null
    };
}

/**
 * Detect if a watch listing is for a part/accessory rather than a full watch
 */
function isWatchPart(item: any): { isPart: boolean; partType?: string; reason?: string } {
  const title = (item.title || '').toLowerCase();
  const price = item.price_usd || item.price || 0;
  
  // Watch part keywords (be careful - some are also in watch names)
  const partKeywords = [
    'watch link', 'watch links', 'oyster link', 'jubilee link', 'president link',
    'watch dial', 'watch dials', 'replacement dial',
    'watch bracelet', 'replacement bracelet', 'watch band',
    'watch bezel', 'replacement bezel', 'bezel insert',
    'watch crown', 'replacement crown', 'crown tube',
    'watch crystal', 'replacement crystal', 'sapphire crystal',
    'watch part', 'watch parts', 'spare part', 'spare parts',
    'watch accessory', 'watch accessories', 'replacement part',
    'watch repair', 'for repair', 'parts only', 'as is',
    'watch movement', 'replacement movement', 'movement only',
    'watch case', 'case back', 'caseback',
    'watch hands', 'hour hand', 'minute hand',
    'watch strap', 'leather strap', 'rubber strap',
    'watch buckle', 'clasp', 'deployant',
  ];
  
  // Check for explicit part keywords
  for (const keyword of partKeywords) {
    if (title.includes(keyword)) {
      return { 
        isPart: true, 
        partType: keyword,
        reason: `Contains part keyword: "${keyword}"`
      };
    }
  }
  
  // Check for suspicious price patterns (very low price might indicate a part)
  // But only if we have a market price to compare against
  // This will be checked later in the analysis
  
  return { isPart: false };
}

/**
 * Analyze arbitrage opportunities for a single item
 */
async function analyzeItemArbitrage(
  item: any,
  itemType: 'watch' | 'trading_card' | 'auto',
  taxRate: number = 0.09,
  minSpreadPct: number = 10.0
): Promise<ArbitrageOpportunity> {
  const price = item.price_usd || item.price || 0;
  const shipping = item.shipping_usd || item.shipping || 0;
  const tax = Math.round(price * taxRate * 100) / 100;
  const allInCost = price + shipping + tax;
  
  let marketPrice: number | null = null;
  let retailPrice: number | null = null;
  let priceSource = '';
  let watchchartsUrl: string | null | undefined = null;
  
  // Auto-detect item type if needed
  let actualItemType: 'watch' | 'trading_card' = itemType === 'auto' 
    ? (detectItemType(item.title || '', item.imageAnalysis || null) === 'watch' ? 'watch' : 'trading_card')
    : (itemType === 'watch' ? 'watch' : 'trading_card');

  // Check if this is a watch part BEFORE doing market price lookup
  const partCheck = isWatchPart(item);
  if (partCheck.isPart && actualItemType === 'watch') {
    console.log(`🔧 [Arbitrage] Detected watch part: ${item.title?.substring(0, 50)}... (${partCheck.reason})`);
    // Return early with "unknown" status - don't analyze parts as full watches
    return {
      item_id: item.item_id,
      has_arbitrage: false,
      valuation_status: 'unknown',
      all_in_cost_usd: allInCost,
      risk_level: 'high',
      confidence: 'low',
      price_source: 'Watch part detected - not a full watch',
    };
  }

  if (actualItemType === 'trading_card') {
    // Use new card price estimation with GPT-4o-mini
    const cardInfo = item.cardInfo || {};
    const priceData = await getCardMarketPrice(
      cardInfo.card_name || item.title || '',
      cardInfo.set_name || null,
      cardInfo.grade || extractPSAGrade(item)?.toString() || null,
      cardInfo.cert_number || null,
      cardInfo.year || null,
      cardInfo.edition || null,
      item.title || ''
    );
    marketPrice = priceData.market_price;
    retailPrice = priceData.retail_price;
    priceSource = priceData.source;
    // Note: psa_url could be added to ArbitrageOpportunity if needed
  } else if (actualItemType === 'watch') {
    const priceData = await getWatchMarketPrice(
      item.brand || '',
      item.model || '',
      item.title
    );
    marketPrice = priceData.market_price;
    retailPrice = priceData.retail_price;
    priceSource = priceData.source;
    watchchartsUrl = priceData.watchcharts_url;
    // Store raw Watch Database data for verification
    if (priceData.rawData) {
      (item as any).watchDbData = priceData.rawData;
    }
  }
  
  // Calculate arbitrage and valuation status
  let spread = null;
  let spreadPct = null;
  let has_arbitrage = false;
  let potentialProfit = null;
  let potentialLoss = null;
  let valuation_status: ValuationStatus = 'unknown';
  
  // Thresholds for categorization (percentage difference from market)
  // spreadPct = (marketPrice - allInCost) / marketPrice * 100
  // Positive spreadPct = listing is BELOW market (undervalued/good deal)
  // Negative spreadPct = listing is ABOVE market (overvalued/overpriced)
  const undervaluedThreshold = minSpreadPct;   // e.g., +10% means listing is 10% below market
  const overvaluedThreshold = -minSpreadPct;   // e.g., -10% means listing is 10% above market
  
  if (marketPrice && marketPrice > 0) {
    spread = marketPrice - allInCost;
    spreadPct = (spread / marketPrice) * 100;
    
    // Additional check: If price is suspiciously low (more than 95% below market), 
    // it's likely a part or misidentified item
    const priceRatio = allInCost / marketPrice;
    if (priceRatio < 0.05 && actualItemType === 'watch') {
      // Price is less than 5% of market value - likely a part or scam
      console.log(`⚠️  [Arbitrage] Suspicious price ratio (${(priceRatio * 100).toFixed(1)}% of market) - likely a watch part or misidentified item`);
      return {
        item_id: item.item_id,
        has_arbitrage: false,
        valuation_status: 'unknown',
        all_in_cost_usd: allInCost,
        market_price_usd: marketPrice,
        risk_level: 'high',
        confidence: 'low',
        price_source: `${priceSource} - Price suspiciously low, may be a watch part`,
      };
    }
    
    // Log calculation for debugging
    console.log(`💰 [Arbitrage] Item: ${item.title?.substring(0, 50)}...`);
    console.log(`   Listing: $${allInCost.toFixed(2)} | Market: $${marketPrice.toFixed(2)} | Spread: $${spread.toFixed(2)} (${spreadPct > 0 ? '+' : ''}${spreadPct.toFixed(1)}%)`);
    
    // Determine valuation status
    // spreadPct is POSITIVE when listing is BELOW market (undervalued)
    // spreadPct is NEGATIVE when listing is ABOVE market (overvalued)
    if (spreadPct >= undervaluedThreshold) {
      // Significantly below market value (good deal) - spreadPct is positive
      valuation_status = 'undervalued';
      has_arbitrage = true;
      potentialProfit = spread; // spread is already positive
      console.log(`   ✅ UNDERVALUED: ${spreadPct.toFixed(1)}% below market ($${potentialProfit.toFixed(2)} profit)`);
    } else if (spreadPct <= overvaluedThreshold) {
      // Significantly above market value (overpriced) - spreadPct is negative
      valuation_status = 'overvalued';
      potentialLoss = Math.abs(spread); // spread is negative, so abs gives loss
      console.log(`   ⚠️  OVERVALUED: ${Math.abs(spreadPct).toFixed(1)}% above market ($${potentialLoss.toFixed(2)} overpriced)`);
    } else {
      // Within fair value range (within ±threshold of market)
      valuation_status = 'fair_value';
      console.log(`   ⚖️  FAIR VALUE: ${spreadPct > 0 ? '+' : ''}${spreadPct.toFixed(1)}% from market`);
    }
  } else {
    console.log(`   ❓ NO MARKET DATA for: ${item.title?.substring(0, 50)}...`);
  }
  
  // Determine risk level (simplified - could be enhanced with seller rating, etc.)
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (item.condition?.toLowerCase().includes('new') || item.condition?.toLowerCase().includes('graded')) {
    riskLevel = 'low';
  } else if (item.condition?.toLowerCase().includes('poor') || item.condition?.toLowerCase().includes('damaged')) {
    riskLevel = 'high';
  }
  
  // Determine confidence based on price source
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (priceSource.includes('Watch Database') || priceSource.includes('PSA Price Guide')) {
    confidence = 'high';
  } else if (priceSource.includes('AI estimation')) {
    confidence = 'medium';
  }
  
  return {
    item_id: item.item_id,
    has_arbitrage,
    valuation_status,
    spread_usd: spread || undefined,
    spread_pct: spreadPct || undefined,
    market_price_usd: marketPrice || undefined,
    retail_price_usd: retailPrice || undefined,
    all_in_cost_usd: allInCost,
    potential_profit_usd: potentialProfit || undefined,
    potential_loss_usd: potentialLoss || undefined,
    risk_level: riskLevel,
    confidence,
    price_source: priceSource || undefined,
    watchcharts_url: watchchartsUrl || undefined,
    undervalued_threshold: undervaluedThreshold,
    overvalued_threshold: overvaluedThreshold,
  };
}

/**
 * Analyze arbitrage opportunities for multiple items
 */
export async function analyzeArbitrageOpportunities(
  items: any[],
  itemType: 'watch' | 'trading_card' | 'auto',
  taxRate: number = 0.09,
  minSpreadPct: number = 10.0
): Promise<EbayItemWithArbitrage[]> {
  console.log(`🔍 [Arbitrage] Analyzing ${items.length} items (type: ${itemType})`);
  
  const results: EbayItemWithArbitrage[] = [];
  
  // Process items in parallel (but limit concurrency to avoid rate limits)
  const batchSize = 5;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item) => {
      try {
        const arbitrage = await analyzeItemArbitrage(item, itemType, taxRate, minSpreadPct);
        return {
          ...item,
          arbitrage,
        };
      } catch (error) {
        console.error(`Error analyzing arbitrage for item ${item.item_id}:`, error);
        return {
          ...item,
          arbitrage: {
            item_id: item.item_id,
            has_arbitrage: false,
            valuation_status: 'unknown' as const,
            all_in_cost_usd: (item.price_usd || 0) + (item.shipping_usd || 0),
            risk_level: 'medium' as const,
            confidence: 'low' as const,
          },
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const arbitrageCount = results.filter(r => r.arbitrage?.has_arbitrage).length;
  console.log(`✅ [Arbitrage] Found ${arbitrageCount} arbitrage opportunities out of ${items.length} items`);
  
  return results;
}

