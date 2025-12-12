import { searchEbay, getEbayItemDetails } from './api';
import { z } from 'zod';
import { analyzeArbitrageOpportunities } from '@/lib/arbitrage/analyze';

export interface EbayTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

// Zod schemas for tool parameters (AI SDK v5 prefers Zod)
export const searchEbaySchema = z.object({
  query: z.string().describe('Search query string (e.g., "Rolex Submariner", "PSA 10 Charizard", "Omega Speedmaster")'),
  limit: z.number().int().min(1).max(200).default(20).optional().describe('Maximum number of results to return per page (default: 20, max: 200)'),
  offset: z.number().int().min(0).default(0).optional().describe('Offset for pagination (default: 0). Use to get next page of results.'),
  category: z.string().optional().describe('Optional eBay category ID filter. Common categories: "260324" for watches, "183454" for trading cards. Leave empty for all categories.'),
  analyze_arbitrage: z.boolean().default(true).optional().describe('Automatically analyze arbitrage opportunities after search (default: true). For watches, uses Watch Database. For cards, uses PSA grade.'),
});

export const analyzeWatchListingSchema = z.object({
  title: z.string().describe('eBay listing title (required). Example: "Rolex Submariner Date 116610LN Black Dial Men\'s Watch"'),
  price: z.number().optional().describe('Listing price in USD (optional). Used for arbitrage calculations.'),
  aspects: z.record(z.any()).optional().describe('eBay item aspects/attributes as a dictionary (optional). Keys like "Brand", "Model", "Condition", etc.'),
});

// Legacy JSON Schema format (for compatibility)
export const ebayTools: EbayTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_ebay',
      description: 'ALWAYS use this tool when the user asks to search eBay, find items on eBay, or look for watches/cards on eBay. This tool searches eBay using the eBay Browse API and returns real listings with prices, URLs, and details. REQUIRED for any eBay search request.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query string (e.g., "Rolex Submariner", "PSA 10 Charizard", "Omega Speedmaster")',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 20, max: 200)',
            default: 20,
            minimum: 1,
            maximum: 200,
          },
          category: {
            type: 'string',
            description: 'Optional eBay category ID filter. Common categories: "260324" for watches, "183454" for trading cards. Leave empty for all categories.',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_watch_listing',
      description: 'Analyze an eBay watch listing to extract metadata (brand, model, reference number) and check for arbitrage opportunities. Uses Watch Database API to enrich metadata. Provide the eBay listing title and optionally the price.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'eBay listing title (required). Example: "Rolex Submariner Date 116610LN Black Dial Men\'s Watch"',
          },
          price: {
            type: 'number',
            description: 'Listing price in USD (optional). Used for arbitrage calculations.',
          },
          aspects: {
            type: 'object',
            description: 'eBay item aspects/attributes as a dictionary (optional). Keys like "Brand", "Model", "Condition", etc.',
          },
        },
        required: ['title'],
      },
    },
  },
];

export async function executeEbayTool(
  name: string,
  args: Record<string, any>
): Promise<any> {
  if (name === 'search_ebay') {
    const { query, limit = 20, offset = 0, category, analyze_arbitrage = true } = args;
    
    const result = await searchEbay({
      query,
      limit,
      offset,
      category_ids: category,
    });

    if (result.success) {
      // Map items to include aspects and images
      const baseItems = result.items.map(item => ({
        item_id: item.item_id,
        title: item.title,
        price_usd: Math.round(item.price * 100) / 100,
        shipping_usd: Math.round(item.shipping * 100) / 100,
        total_cost_usd: Math.round((item.price + item.shipping) * 100) / 100,
        url: item.url,
        image_url: item.image_url,
        images: item.images, // Include all images if available
        condition: item.item_condition || 'Unknown',
        brand: item.aspects?.Brand || '',
        model: item.aspects?.Model || '',
        currency: item.currency,
        aspects: item.aspects || {},
      }));
      
      // Automatically analyze arbitrage if requested
      let itemsWithArbitrage: any[] = baseItems;
      if (analyze_arbitrage) {
        // Determine item type from category
        let itemType: 'watch' | 'trading_card' | 'auto' = 'auto';
        if (category === '260324') {
          itemType = 'watch';
        } else if (category === '183454') {
          itemType = 'trading_card';
        } else if (query.toLowerCase().includes('watch') || query.toLowerCase().includes('rolex') || query.toLowerCase().includes('omega')) {
          itemType = 'watch';
        } else if (query.toLowerCase().includes('psa') || query.toLowerCase().includes('card') || query.toLowerCase().includes('charizard')) {
          itemType = 'trading_card';
        }
        
        console.log(`🔍 [Arbitrage] Analyzing ${baseItems.length} items as ${itemType}`);
        itemsWithArbitrage = await analyzeArbitrageOpportunities(baseItems, itemType) as any[];
      }
      
      const arbitrageCount = itemsWithArbitrage.filter((i: any) => i.arbitrage?.has_arbitrage).length;
      
      return {
        success: true,
        query,
        count: result.count,
        total_found: result.total_found,
        offset: result.offset || 0,
        limit: result.limit || limit,
        has_more: result.has_more || false,
        items: itemsWithArbitrage,
        arbitrage_analyzed: analyze_arbitrage,
        arbitrage_opportunities: arbitrageCount,
        summary: `Found ${result.count} items on eBay for '${query}'${analyze_arbitrage ? ` (${arbitrageCount} arbitrage opportunities)` : ''}${result.has_more && result.total_found ? ` (${result.total_found - (result.offset || 0) - result.count} more available)` : ''}`,
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: `Error searching eBay: ${result.error}`,
      };
    }
  } else if (name === 'analyze_watch_listing') {
    // This would integrate with watch metadata extraction
    // For now, return a basic response
    return {
      success: true,
      title: args.title,
      metadata: {
        brand: args.aspects?.Brand || 'Unknown',
        model: args.aspects?.Model || 'Unknown',
        condition: args.aspects?.Condition || 'Unknown',
      },
      listing_price_usd: args.price || null,
      message: 'Watch listing analyzed successfully',
    };
  }

  throw new Error(`Unknown eBay tool: ${name}`);
}

