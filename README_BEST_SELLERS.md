# Best Sellers Arbitrage Scanner

## Overview

This scanner **reverses the workflow** - instead of searching eBay first, it:
1. Gets Amazon best sellers (trending/popular items)
2. Searches eBay for those same items
3. Searches Facebook Marketplace for those same items
4. Compares prices across all platforms
5. Identifies arbitrage opportunities

## Why This Is Powerful

- **Discover trending items**: Find what's popular on Amazon
- **Find arbitrage opportunities**: See if items are cheaper on eBay/Facebook
- **Market intelligence**: Understand price differences across platforms
- **Reverse arbitrage**: Buy on Amazon (if cheaper), sell on eBay/Facebook

## Usage

### List Available Categories

```bash
python scanners/best_sellers_scanner.py --list-categories
```

### Scan a Category

```bash
python scanners/best_sellers_scanner.py shoes --limit 20
```

**Parameters:**
- `category`: Amazon category (e.g., "shoes", "electronics", "fashion")
- `--limit`: Number of best sellers to check (default: 20)
- `--max-ebay`: Max eBay results per product (default: 10)
- `--max-fb`: Max Facebook results per product (default: 5)

### Example Categories

- `shoes` - Footwear
- `electronics` - Electronics
- `fashion` - Fashion items
- `mobile-apps` - Mobile apps
- `books` - Books
- `home-garden` - Home & Garden
- `sports-outdoors` - Sports & Outdoors
- `toys-games` - Toys & Games
- `beauty` - Beauty products
- `jewelry` - Jewelry
- `handbags` - Handbags

## Output

The scanner creates a CSV file: `data/best_sellers_arbitrage_{category}.csv`

**Columns:**
- `amazon_title` - Product title from Amazon
- `amazon_price` - Price on Amazon
- `amazon_url` - Amazon product URL
- `amazon_rank` - Best seller rank
- `platform` - "eBay" or "Facebook"
- `platform_price` - Price on other platform
- `platform_url` - URL on other platform
- `price_difference` - Difference (Amazon - Other Platform)
- `arbitrage_opportunity` - True if Amazon is cheaper

## Arbitrage Logic

- **Positive price_difference**: Amazon is cheaper → Buy on Amazon, sell on eBay/Facebook
- **Negative price_difference**: Other platform is cheaper → Buy there, sell on Amazon
- **Zero or minimal**: No arbitrage opportunity

## Example Output

```
TOP ARBITRAGE OPPORTUNITIES
======================================================================

Found 5 arbitrage opportunities:

1. Women's Running Shoes...
   Amazon: $49.99
   eBay: $79.99
   Profit: $30.00

2. Wireless Headphones...
   Amazon: $29.99
   Facebook: $45.00
   Profit: $15.01
```

## Notes

- **API Limits**: Facebook Marketplace has 30 requests/month on free tier
- **Rate Limiting**: eBay API has rate limits - scanner includes retry logic
- **Matching**: Uses title similarity to match products across platforms
- **Categories**: Some categories may not have best sellers available

## Integration

This scanner uses:
- `lib/amazon_best_sellers.py` - Amazon best sellers API
- `lib/ebay_api.py` - Generic eBay search
- `lib/facebook_marketplace_api.py` - Facebook Marketplace search
- `lib/arbitrage_comparison.py` - Cross-platform price comparison

