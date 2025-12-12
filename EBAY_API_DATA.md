# eBay API Data Structure

## What Data We Get Back from eBay

When we call the `search_ebay` tool, here's the complete data structure returned:

### Response Structure

```typescript
{
  success: boolean;
  query: string;
  count: number;
  total_found: number;
  items: EbayItem[];
}
```

### EbayItem Structure

Each item in the `items` array contains:

```typescript
{
  item_id: string;           // eBay item ID (e.g., "v1|147000348344|0")
  title: string;              // Full listing title
  price_usd: number;          // Item price in USD (e.g., 120.00)
  shipping_usd: number;       // Shipping cost in USD (e.g., 0.00)
  total_cost_usd: number;     // Total cost (price + shipping)
  url: string;                // Direct link to eBay listing
  image_url: string;          // Image URL (upgraded to s-l1600 for high quality)
  condition: string;          // Item condition (e.g., "Pre-owned", "New", "Graded")
  brand: string;              // Brand from aspects (if available)
  model: string;              // Model from aspects (if available)
  currency: string;           // Currency code (usually "USD")
}
```

### Raw eBay API Response (itemSummaries)

The eBay Browse API returns more data that we extract:

```typescript
{
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  shippingOptions: [{
    shippingCost: {
      value: string;
      currency: string;
    };
  }];
  itemWebUrl: string;
  image: {
    imageUrl: string;  // Usually s-l225 (thumbnail), we upgrade to s-l1600
  };
  condition: string;
  conditionId: string;
  localizedAspects: [{
    name: string;      // e.g., "Brand", "Model", "Condition", "Year"
    value: string;
  }];
  seller: {
    username: string;
  };
}
```

### Image Quality

**Current Issue:** eBay's search API returns thumbnail images (usually `s-l225`)

**Solution:** We automatically upgrade image URLs to `s-l1600` (highest quality) by replacing the size parameter in the URL.

**eBay Image Size Parameters:**
- `s-l225` - Thumbnail (default from search API)
- `s-l500` - Medium
- `s-l1200` - Large
- `s-l1600` - Highest quality (what we use)

**Example:**
```
Original:  https://i.ebayimg.com/images/g/6BQAAeSwqF1ow~nP/s-l225.jpg
Upgraded:  https://i.ebayimg.com/images/g/6BQAAeSwqF1ow~nP/s-l1600.jpg
```

### Additional Data Available

The eBay API also provides (but we don't currently extract):
- `seller.username` - Seller username
- `localizedAspects` - Additional item attributes (Brand, Model, Year, etc.)
- `conditionId` - Numeric condition ID
- `itemLocation` - Seller location
- `estimatedAvailabilities` - Stock availability
- `buyingOptions` - Purchase options (Buy It Now, Auction, etc.)

### Future Enhancements

1. **Fetch Full Item Details:** Use `getEbayItemDetails(itemId)` to get:
   - Multiple high-res images
   - Full description
   - Seller feedback
   - Return policy
   - Shipping details

2. **Extract More Aspects:** Parse `localizedAspects` for:
   - Card set name
   - Card number
   - Grading company (PSA, BGS, etc.)
   - Grade number

3. **Image Gallery:** Display multiple images per item

