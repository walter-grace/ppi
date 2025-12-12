/**
 * Item Type Configuration
 * 
 * Maps item types to their price estimation services and MCP servers.
 * This makes it easy to add new collectible types in the future.
 */

export type ItemType = 'watch' | 'card' | 'auto';

export interface ItemTypeConfig {
  /** Display name for the item type */
  name: string;
  /** Icon name (from lucide-react) */
  icon: string;
  /** eBay category ID for this item type */
  ebayCategoryId: string;
  /** Price estimation service to use */
  priceEstimation: {
    /** Primary service (MCP server or API) */
    primary: 'watch_database' | 'psa_api' | 'gpt4o_mini_search' | 'custom';
    /** Fallback service if primary fails */
    fallback?: 'gpt4o_mini_search' | 'watch_database' | null;
    /** Additional configuration for the service */
    config?: Record<string, any>;
  };
  /** MCP servers to use for this item type */
  mcpServers?: string[];
  /** Keywords that help identify this item type */
  keywords: string[];
}

export const ITEM_TYPE_CONFIGS: Record<ItemType, ItemTypeConfig> = {
  watch: {
    name: 'Watch',
    icon: 'Clock',
    ebayCategoryId: '260324',
    priceEstimation: {
      primary: 'watch_database',
      fallback: 'gpt4o_mini_search',
      config: {
        includeWatchCharts: true,
        searchWatchCharts: true,
      },
    },
    mcpServers: ['watch-database'],
    keywords: ['watch', 'rolex', 'omega', 'seiko', 'timepiece', 'wristwatch', 'submariner', 'gmt', 'datejust', 'speedmaster'],
  },
  card: {
    name: 'Card',
    icon: 'CreditCard',
    ebayCategoryId: '183454',
    priceEstimation: {
      primary: 'gpt4o_mini_search', // Use GPT-4o-mini with web search for PSA prices
      fallback: null,
      config: {
        searchSources: ['PSA Price Guide', 'eBay Sold Listings', 'PriceCharting'],
        includePSAGrade: true,
      },
    },
    mcpServers: [], // Can add PSA MCP server here in the future
    keywords: ['card', 'psa', 'pokemon', 'yugioh', 'trading card', 'sports card', 'baseball card', 'basketball card', 'football card', 'magic', 'mtg'],
  },
  auto: {
    name: 'Auto-Detect',
    icon: 'Scan',
    ebayCategoryId: '0', // Will be determined based on detection
    priceEstimation: {
      primary: 'gpt4o_mini_search',
      fallback: null,
    },
    keywords: [],
  },
};

/**
 * Auto-detect item type from text/image analysis
 */
export function detectItemType(text: string, imageAnalysis?: any): ItemType {
  const lowerText = text.toLowerCase();
  
  // Check for watch keywords
  const watchScore = ITEM_TYPE_CONFIGS.watch.keywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  ).length;
  
  // Check for card keywords
  const cardScore = ITEM_TYPE_CONFIGS.card.keywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  ).length;
  
  // Check image analysis results
  if (imageAnalysis) {
    // If image analysis has watch-specific fields
    if (imageAnalysis.brand || imageAnalysis.model || imageAnalysis.reference_number) {
      return 'watch';
    }
    // If image analysis has card-specific fields
    if (imageAnalysis.card_name || imageAnalysis.set_name || imageAnalysis.grade || imageAnalysis.cert_number) {
      return 'card';
    }
  }
  
  // Return the type with higher score, default to 'watch' if tie
  if (cardScore > watchScore) {
    return 'card';
  } else if (watchScore > cardScore) {
    return 'watch';
  }
  
  // Default to watch if no clear match
  return 'watch';
}

/**
 * Get configuration for an item type
 */
export function getItemTypeConfig(itemType: ItemType): ItemTypeConfig {
  return ITEM_TYPE_CONFIGS[itemType] || ITEM_TYPE_CONFIGS.auto;
}

