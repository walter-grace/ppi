/**
 * eBay item data structure
 * 
 * This represents the data we extract from eBay's Browse API response.
 * See EBAY_API_DATA.md for complete documentation of all available fields.
 */
export interface EbayItem {
  item_id: string;              // eBay item ID
  title: string;                 // Listing title
  url: string;                    // Direct link to eBay listing
  price: number;                 // Item price in USD
  shipping: number;              // Shipping cost in USD
  currency: string;              // Currency code (usually "USD")
  aspects: Record<string, string>; // Additional attributes (Brand, Model, Year, Condition, etc.)
  item_condition?: string;       // Item condition (e.g., "Pre-owned", "Graded")
  image_url?: string;            // Primary high-quality image URL (upgraded to s-l1600) - for backward compatibility
  images?: string[];             // Array of all available image URLs (if multiple images available)
  seller_username?: string;      // Seller username
}

export interface EbaySearchParams {
  query: string;
  limit?: number;
  offset?: number; // For pagination
  category_ids?: string;
  filters?: string;
}

export interface EbaySearchResponse {
  success: boolean;
  items: EbayItem[];
  count: number;
  total_found?: number;
  offset?: number; // Current offset
  limit?: number; // Items per page
  has_more?: boolean; // Whether there are more results
  error?: string;
}

/**
 * Get eBay OAuth token
 */
async function getEbayToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const existingToken = process.env.EBAY_OAUTH;

  // If we have client credentials, generate a fresh token (like Python code)
  if (clientId && clientSecret) {
    const tokenUrl = 'https://api.ebay.com/identity/v1/oauth2/token';
    const credentials = `${clientId}:${clientSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    // Try different scope formats (like Python code does)
    const scopeOptions = [
      'https://api.ebay.com/oauth/api_scope/buy.browse', // Full scope URL
      'buy.browse', // Short format
      'https://api.ebay.com/oauth/api_scope', // Base scope
    ];

    for (const scope of scopeOptions) {
      try {
        console.log(`🔑 [eBay API] Generating token with scope: ${scope}...`);
        const startTime = Date.now();
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${encodedCredentials}`,
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: scope,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const duration = Date.now() - startTime;
          const expiresIn = data.expires_in || 7200;
          console.log(`✅ [eBay API] Token generated in ${duration}ms (expires in ${expiresIn}s)`);
          return data.access_token;
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error_description || '';
          if (errorMsg.toLowerCase().includes('scope')) {
            console.log(`⚠️  [eBay API] Scope '${scope}' rejected, trying next...`);
            continue; // Try next scope
          } else {
            console.error(`❌ [eBay API] Token generation failed: ${errorMsg}`);
            break;
          }
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`❌ [eBay API] Token generation failed (${response.status}): ${errorText.substring(0, 200)}`);
          break;
        }
      } catch (error: any) {
        console.error(`❌ [eBay API] Error with scope ${scope}:`, error.message);
        continue; // Try next scope
      }
    }
  }

  // Fall back to existing token
  if (existingToken) {
    console.log('🔑 [eBay API] Using existing EBAY_OAUTH token');
    return existingToken;
  }

  throw new Error('EBAY_OAUTH not found and unable to generate token. Please set EBAY_OAUTH or EBAY_CLIENT_ID/SECRET');
}

/**
 * Upgrade eBay image URL to higher quality
 * eBay image URLs have size parameters: s-l225 (thumbnail), s-l500, s-l1200, s-l1600 (highest)
 */
function upgradeEbayImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  
  // Replace size parameters to get higher quality
  // s-l225 -> s-l1600 (highest quality)
  const upgraded = url
    .replace(/s-l\d+/g, 's-l1600')  // Replace any size with s-l1600
    .replace(/s-m\d+/g, 's-l1600')  // Replace medium sizes
    .replace(/s-\d+x\d+/g, 's-l1600'); // Replace dimension-based sizes
  
  return upgraded;
}

/**
 * Search eBay for items
 */
export async function searchEbay(params: EbaySearchParams): Promise<EbaySearchResponse> {
  const { query, limit = 20, offset = 0, category_ids, filters } = params;

  console.log(`🔍 [eBay API] Searching for: "${query}" (limit: ${limit}, offset: ${offset}${category_ids ? `, category: ${category_ids}` : ''})`);
  const startTime = Date.now();

  try {
    const token = await getEbayToken();
    const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
    
    url.searchParams.set('q', query);
    const itemsPerPage = Math.min(limit, 200);
    url.searchParams.set('limit', String(itemsPerPage));
    
    // Add offset for pagination
    if (offset > 0) {
      url.searchParams.set('offset', String(offset));
    }
    
    if (category_ids) {
      url.searchParams.set('category_ids', category_ids);
    }
    
    if (filters) {
      url.searchParams.set('filter', filters);
    } else {
      url.searchParams.set('filter', 'buyingOptions:{FIXED_PRICE}');
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      },
    });

    if (response.status === 401) {
      throw new Error('eBay API Authentication Error (401). Please check your credentials.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eBay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const items: EbayItem[] = [];
    const duration = Date.now() - startTime;

    for (const summary of data.itemSummaries || []) {
      const priceObj = summary.price || {};
      const price = parseFloat(priceObj.value || '0');
      const currency = priceObj.currency || 'USD';

      if (currency !== 'USD') {
        continue;
      }

      const shippingCost = summary.shippingOptions?.[0]?.shippingCost?.value 
        ? parseFloat(summary.shippingOptions[0].shippingCost.value)
        : 0;

      const aspects: Record<string, string> = {};
      if (summary.localizedAspects) {
        for (const aspect of summary.localizedAspects) {
          aspects[aspect.name] = aspect.value;
        }
      }

      // Extract images - search API may return multiple images
      const images: string[] = [];
      
      // Main image
      if (summary.image?.imageUrl) {
        const highQualityUrl = upgradeEbayImageUrl(summary.image.imageUrl);
        if (highQualityUrl) {
          images.push(highQualityUrl);
        }
      }
      
      // Additional images from search response (if available)
      if (summary.additionalImages && Array.isArray(summary.additionalImages)) {
        summary.additionalImages.forEach((img: any) => {
          const imgUrl = typeof img === 'string' ? img : img.imageUrl;
          if (imgUrl) {
            const highQualityUrl = upgradeEbayImageUrl(imgUrl);
            if (highQualityUrl && !images.includes(highQualityUrl)) {
              images.push(highQualityUrl);
            }
          }
        });
      }
      
      // Also check for images array (alternative format)
      if (summary.images && Array.isArray(summary.images)) {
        summary.images.forEach((img: any) => {
          const imgUrl = typeof img === 'string' ? img : img.imageUrl;
          if (imgUrl) {
            const highQualityUrl = upgradeEbayImageUrl(imgUrl);
            if (highQualityUrl && !images.includes(highQualityUrl)) {
              images.push(highQualityUrl);
            }
          }
        });
      }

      items.push({
        item_id: summary.itemId || '',
        title: summary.title || '',
        url: summary.itemWebUrl || '',
        price,
        shipping: shippingCost,
        currency,
        aspects,
        item_condition: summary.condition || summary.conditionId || undefined,
        // Primary image (for backward compatibility)
        image_url: images[0] || undefined,
        // All images array
        images: images.length > 0 ? images : undefined,
        seller_username: summary.seller?.username || undefined,
      });
    }

    const totalFound = data.total || 0;
    const currentOffset = offset || 0;
    const hasMore = currentOffset + items.length < totalFound;

    const result = {
      success: true,
      items,
      count: items.length,
      total_found: totalFound,
      offset: currentOffset,
      limit: itemsPerPage,
      has_more: hasMore,
    };
    
    // Log sample of data we're getting back
    if (items.length > 0) {
      const sample = items[0];
      console.log(`✅ [eBay API] Found ${items.length} items in ${duration}ms`);
      console.log(`   📊 Sample item data:`, {
        item_id: sample.item_id,
        title: sample.title.substring(0, 50) + '...',
        price: `$${sample.price}`,
        shipping: `$${sample.shipping}`,
        total: `$${sample.price + sample.shipping}`,
        condition: sample.item_condition,
        image_url: sample.image_url ? '✅ (upgraded to s-l1600)' : '❌',
        aspects_count: Object.keys(sample.aspects).length,
        aspects: Object.keys(sample.aspects).slice(0, 5),
      });
    } else {
      console.log(`✅ [eBay API] Found ${items.length} items in ${duration}ms`);
    }
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [eBay API] Search failed after ${duration}ms:`, error.message);
    return {
      success: false,
      items: [],
      count: 0,
      error: error.message || String(error),
    };
  }
}

/**
 * Get full item details from eBay
 */
export async function getEbayItemDetails(itemId: string): Promise<any> {
  try {
    const token = await getEbayToken();
    const url = `https://api.ebay.com/buy/browse/v1/item/${itemId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      },
    });

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(`Failed to get eBay item details: ${error.message}`);
  }
}

