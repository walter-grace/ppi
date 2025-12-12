# Streamlit Chatbot Application

A web-based interface for the Watch & eBay Arbitrage Chatbot using Streamlit.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Streamlit App

```bash
streamlit run streamlit_chatbot.py
```

The app will open in your browser at `http://localhost:8501`

## Features

- **Interactive Chat Interface**: Clean, modern chat UI
- **Sample Prompts**: Click-to-use prompts in the sidebar
- **Real-time API Integration**: Live eBay and Watch Database searches
- **Status Indicators**: See which APIs are connected
- **Chat History**: Maintains conversation context
- **Clear Chat**: Reset conversation anytime

## Sample Prompts

### eBay Search
- "Search eBay for Rolex Submariner watches under $10,000"
- "Find Omega Speedmaster watches on eBay"
- "Search eBay for PSA 10 Charizard cards"

### Watch Analysis
- "Analyze this watch listing: Rolex Submariner Date 116610LN - $8,500"
- "Is this a good deal? Rolex GMT-Master II 126710BLNR for $12,000"

### Watch Database
- "Search the watch database for reference 116610LN"
- "What watch brands are available in the database?"

### Combined Queries
- "Find Rolex watches on eBay under $10,000 and analyze if they're good deals"
- "Search for Omega Speedmaster on eBay and check the watch database for details"

See `SAMPLE_PROMPTS.md` for a complete list of prompts.

## Configuration

Ensure your `.env.local` file has:

```env
OPENROUTER_API_KEY=your_key
WATCH_DATABASE_API_KEY=your_key  # or RAPIDAPI_KEY
EBAY_OAUTH=your_token  # or EBAY_CLIENT_ID + EBAY_CLIENT_SECRET
```

## Usage Tips

1. **Click Sample Prompts**: Use the sidebar prompts for quick testing
2. **Be Specific**: Include brand, model, or price ranges
3. **Ask Follow-ups**: Build on previous responses
4. **Clear Chat**: Use the clear button to start fresh

## Troubleshooting

### App Won't Start
- Check that Streamlit is installed: `pip install streamlit`
- Verify all API keys are set in `.env.local`

### MCP Server Not Connecting
- Ensure Node.js is installed
- Check Watch Database API key is correct
- App will fall back to direct API calls if MCP fails

### No Responses
- Check OpenRouter API key
- Verify you have OpenRouter credits
- Check browser console for errors

## Architecture

```
Streamlit UI
    ↓
Chatbot (OpenRouter + MCP)
    ├──→ eBay API (Direct)
    ├──→ Watch Database MCP Server
    └──→ Watch Metadata Enrichment
```

## Next Steps

- Add more sample prompts
- Implement chat export
- Add price history charts
- Create watch comparison views

