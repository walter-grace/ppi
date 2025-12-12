# PSA Card Arbitrage Web App

A specialized web application for finding arbitrage opportunities in PSA-graded trading cards by combining eBay listings with PSA certification data.

## Features

### 🔍 eBay Search
- Search eBay for PSA-graded trading cards
- Filter by game (Yu-Gi-Oh! or Pokemon)
- Optional year filter
- Automatic cert number extraction from listings

### 📋 PSA Data Integration
- **No rate limit!** - Check PSA data for every card found
- Automatic PSA certification lookup
- Display card details: grade, year, brand, player, population, etc.
- Verify PSA authenticity

### 💰 Arbitrage Analysis
- Compare eBay prices with PSA data
- Calculate total cost (price + shipping)
- Identify verified PSA cards
- Track PSA-checked vs non-checked cards

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   Make sure your `.env.local` file contains:
   ```
   EBAY_OAUTH=your_ebay_token_here
   PSA_TOKEN=your_psa_token_here
   ```

3. **Run the app:**
   ```bash
   python psa_card_arbitrage.py
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5002`

## Usage

### Basic Search
1. Enter a search query (e.g., "yugioh PSA 10 1st edition")
2. Select game type (Yu-Gi-Oh! or Pokemon)
3. Set max results (default: 20)
4. Optionally enter a year filter
5. Check "Check PSA Data" to verify certifications
6. Click "Search eBay & Check PSA"

### What You'll See
- **Stats Cards**: Total cards found, PSA data checked, PSA verified count
- **Card Grid**: Each card shows:
  - Card image
  - Title and price
  - Seller information
  - PSA certification data (if available)
  - Link to eBay listing

### PSA Data Display
When PSA data is found, you'll see:
- ✅ PSA Verified badge
- Grade (e.g., "PSA 10")
- Year, Brand, Player/Subject
- Card Number
- Population data
- Certification number

## API Endpoints

### `/api/search` (POST)
Search eBay and check PSA data.

**Request:**
```json
{
  "query": "yugioh PSA 10 1st edition",
  "game": "yugioh",
  "max_results": 20,
  "year": "2002",
  "check_psa": true
}
```

**Response:**
```json
{
  "items": [...],
  "count": 20,
  "psa_checked": 15,
  "query": "yugioh PSA 10 1st edition"
}
```

### `/api/check-psa` (POST)
Check PSA data for a specific cert number.

**Request:**
```json
{
  "cert_number": "12345678"
}
```

## Cert Number Extraction

The app automatically extracts PSA cert numbers from:
1. eBay item aspects (Certification Number, Cert Number, PSA Cert)
2. Item title using regex patterns:
   - "PSA 12345678"
   - "Cert #12345678"
   - "Certification #12345678"

## PSA API

- **Endpoint**: `https://api.psacard.com/publicapi/cert/GetByCertNumber/{cert_number}`
- **Authentication**: Bearer token (PSA_TOKEN)
- **Rate Limit**: None! (as mentioned by user)
- **Returns**: Card details including grade, year, brand, player, population, etc.

## Notes

- The app runs on port **5002** (different from other apps)
- PSA API doesn't return estimated values in the Public API
- Cert numbers are extracted automatically but may not always be found
- All PSA checks are performed in real-time during search

## Next Steps

Potential enhancements:
- Add estimated value scraping from PSA cert pages
- Calculate arbitrage opportunities with estimated values
- Export results to CSV
- Filter by PSA grade
- Sort by arbitrage potential

