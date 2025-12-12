# Arbitrage Finder Web App

A user-friendly web application to search and compare prices across eBay, Facebook Marketplace, and Amazon.

## Features

- 🔍 **Search All Platforms**: Search eBay, Facebook Marketplace, and Amazon simultaneously
- 💰 **Price Comparison**: See prices from all three platforms side-by-side
- 📊 **Best Price Highlighting**: Automatically highlights the best price
- 📄 **HTML Reports**: Generate detailed HTML reports with all results
- 🎨 **Beautiful UI**: Modern, responsive web interface

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure your `.env.local` file has:
```
EBAY_OAUTH=your_ebay_token
RAPIDAPI_KEY=your_rapidapi_key
DEFAULT_FB_LOCATION=Los Angeles, CA
```

## Running the App

1. Start the server:
```bash
python app.py
```

2. Open your browser and go to:
```
http://localhost:5000
```

## How to Use

1. **Enter Search Query**: Type what you're looking for (e.g., "Gucci boots", "iPhone 15", "Nike sneakers")

2. **Configure Options**:
   - **Max Results**: How many results to show per platform (default: 20)
   - **Location**: Your location for Facebook Marketplace searches (default: Los Angeles, CA)

3. **Click Search**: The app will search all three platforms simultaneously

4. **View Results**:
   - See a comparison table showing prices from all platforms
   - Best price is highlighted in green
   - Click links to view items on each platform

5. **Generate Report**: Click "Generate HTML Report" to create a detailed report that opens in a new tab

## Example Searches

- "Gucci western boot 7.5"
- "iPhone 15 Pro Max"
- "Nike Air Max"
- "PSA 10 yugioh"
- "Designer handbag"

## API Limits

- **Facebook Marketplace**: 30 requests/month (free tier)
- **Amazon**: Varies by RapidAPI plan
- **eBay**: Standard API rate limits apply

## Troubleshooting

- **No Facebook results**: Check your RapidAPI key and subscription
- **No Amazon results**: Verify RapidAPI key is configured
- **eBay errors**: Regenerate your eBay OAuth token at https://developer.ebay.com/my/keys

## Features in Detail

### Price Comparison Table
- Shows eBay, Facebook, and Amazon prices side-by-side
- Automatically identifies the best price
- Groups similar items together

### Individual Platform Views
- Browse results from each platform separately
- See product images and details
- Direct links to listings

### HTML Report Generation
- Comprehensive report with all results
- Filterable and sortable
- Can be saved and shared

## Technical Details

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **APIs**: eBay Browse API, RapidAPI (Facebook Marketplace, Amazon)

