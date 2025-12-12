# Arbitrage Scanner

A Python CLI tool for identifying arbitrage opportunities in trading cards (PSA-graded) and luxury items across eBay and Facebook Marketplace.

## Project Structure

```
.
├── scanners/          # Main scanner scripts
│   ├── yugioh_scanner.py      # Yu-Gi-Oh! PSA 10 scanner
│   ├── pokemon_scanner.py     # Pokemon Base Set 1999 scanner
│   └── luxury_scanner.py      # Luxury items scanner
├── lib/               # Shared library code
│   ├── config.py              # Environment variable loading
│   ├── ebay_api.py            # eBay API functions
│   ├── facebook_marketplace_api.py  # Facebook Marketplace API (Apify)
│   ├── arbitrage_comparison.py     # Cross-platform comparison logic
│   └── research_agent.py      # PSA scraping & AI research
├── reports/           # HTML report generators
│   ├── generate_html_report.py        # Trading cards reports
│   └── generate_luxury_html_report.py # Luxury items reports
├── data/              # Output files (CSV, HTML)
├── archive/           # Old/test files
└── requirements.txt   # Python dependencies
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env.local` file:
```
EBAY_OAUTH=your_ebay_token
PSA_TOKEN=your_psa_token
OPENROUTER_API_KEY=your_openrouter_key
RAPIDAPI_KEY=your_rapidapi_key
DEFAULT_FB_LOCATION=Los Angeles, CA
```

3. Get API tokens:
- **eBay**: https://developer.ebay.com/my/keys
- **PSA**: https://www.psacard.com/publicapi/documentation
- **OpenRouter**: https://openrouter.ai/ (optional, for AI features)
- **RapidAPI**: https://rapidapi.com/ (for Facebook Marketplace scraping)
  - Sign up at https://rapidapi.com/
  - Subscribe to the "Facebook Marketplace" API
  - Get your API key from https://rapidapi.com/developer/security
  - The API endpoint is: `facebook-marketplace1.p.rapidapi.com`

## Usage

### Trading Cards

**Yu-Gi-Oh! Scanner:**
```bash
python scanners/yugioh_scanner.py 20 2002
```

**Pokemon Scanner:**
```bash
python scanners/pokemon_scanner.py 20 1999
```

### Luxury Items

```bash
python scanners/luxury_scanner.py "Gucci women western boot 7.5 leather new with box" 100 "Gucci"
```

### Generate Reports

**Trading Cards:**
```bash
python reports/generate_html_report.py data/yugioh_cards.csv
```

**Luxury Items:**
```bash
python reports/generate_luxury_html_report.py data/luxury_items.csv
```

## Output

- CSV files saved to `data/` directory
- HTML reports generated in `data/` directory
- Reports include images, filtering, and sorting

## Features

- ✅ **eBay API integration** - Search and analyze eBay listings
- ✅ **Facebook Marketplace integration** - Cross-reference with Facebook Marketplace via RapidAPI
- ✅ **Cross-platform comparison** - Match items across platforms and find best prices
- ✅ **PSA API integration** - Get PSA estimates for trading cards
- ✅ **AI-powered retail price lookup** - Find retail prices for luxury items
- ✅ **Image extraction** - Extract and display images from listings
- ✅ **Interactive HTML reports** - Filterable, sortable reports with platform filters
- ✅ **Arbitrage opportunity detection** - Calculate spreads and identify opportunities
- ✅ **Advanced filtering** - Filter by size, condition, material, platform, etc.

## Facebook Marketplace Integration

The scanner now searches both eBay and Facebook Marketplace to find cross-platform arbitrage opportunities.

### How It Works

1. **Dual Search**: Searches both eBay and Facebook Marketplace simultaneously
2. **Smart Matching**: Matches items across platforms using:
   - **Trading Cards**: Cert number (exact match) or title similarity + price range
   - **Luxury Items**: Brand + product keywords + size + condition
3. **Price Comparison**: Compares prices across platforms and identifies the best deal
4. **Cross-Platform Reports**: HTML reports show platform filters and cross-platform matches

### Testing the Facebook Marketplace API

Before running full scans, you can test the RapidAPI Facebook Marketplace API:

```bash
python lib/test_rapidapi_fb.py
```

This will test various queries and save sample responses to `data/` for analysis.

### Location Configuration

Set your default location for Facebook Marketplace searches in `.env.local`:

```
DEFAULT_FB_LOCATION=Los Angeles, CA
```

The location will be converted to a city name (e.g., "Los Angeles, CA" → "los angeles") for the RapidAPI `city` parameter.
