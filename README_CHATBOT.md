# Watch & eBay Arbitrage Chatbot

A conversational AI chatbot powered by OpenRouter that integrates with MCP servers for eBay and Watch Database queries.

## Features

- **eBay Search**: Search for watches, trading cards, and other items on eBay
- **Watch Analysis**: Analyze eBay watch listings to extract metadata and identify arbitrage opportunities
- **Watch Database**: Search the Watch Database for watch information, brands, and models
- **MCP Integration**: Uses Model Context Protocol (MCP) servers for Watch Database access
- **OpenRouter**: Powered by Claude (via OpenRouter) for natural language understanding

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `openai` - For OpenRouter API client
- `mcp` - For MCP server integration
- Other existing dependencies

### 2. Configure Environment Variables

Ensure your `.env.local` file has:

```env
OPENROUTER_API_KEY=your_openrouter_key
WATCH_DATABASE_API_KEY=your_rapidapi_key  # or use RAPIDAPI_KEY
EBAY_OAUTH=your_ebay_token  # or EBAY_CLIENT_ID + EBAY_CLIENT_SECRET
```

### 3. Run the Chatbot

```bash
python chatbot_mcp.py
```

## Usage Examples

### Search eBay

```
You: Search eBay for Rolex Submariner watches
```

### Analyze Watch Listing

```
You: Analyze this watch listing: "Rolex Submariner Date 116610LN Black Dial Men's Watch - $8,500"
```

### Search Watch Database

```
You: Search the watch database for reference 116610LN
You: What watch brands are available?
```

### Combined Queries

```
You: Find Rolex watches on eBay under $10,000 and check if they're good deals
```

## How It Works

1. **MCP Server Connection**: Connects to Watch Database MCP server via RapidAPI
2. **Tool Calling**: Uses OpenRouter's tool calling to execute:
   - eBay searches via direct API calls
   - Watch Database queries via MCP or direct API (fallback)
   - Watch metadata extraction and enrichment
3. **Natural Language**: Claude interprets your queries and decides which tools to use
4. **Response Generation**: Combines tool results into natural language responses

## Architecture

```
User Query
    ↓
OpenRouter (Claude)
    ↓
Tool Selection
    ├──→ eBay API (Direct)
    ├──→ Watch Database MCP Server
    └──→ Watch Metadata Enrichment
    ↓
Combined Response
```

## Troubleshooting

### MCP Server Not Connecting

- Ensure Node.js and npm are installed (required for `npx`)
- Check that `WATCH_DATABASE_API_KEY` or `RAPIDAPI_KEY` is set
- The chatbot will fall back to direct API calls if MCP fails

### OpenRouter Errors

- Verify `OPENROUTER_API_KEY` is correct
- Check your OpenRouter account has credits
- Model used: `anthropic/claude-3-5-sonnet` (can be changed in code)

### eBay API Errors

- Ensure `EBAY_OAUTH` is set or `EBAY_CLIENT_ID` + `EBAY_CLIENT_SECRET`
- Token auto-refreshes if Client ID/Secret are provided

## Customization

### Change Model

Edit `MODEL` in `chatbot_mcp.py`:

```python
MODEL = "anthropic/claude-3-5-sonnet"  # Change to any OpenRouter model
```

### Add More Tools

Extend the `eBayTools` class or add new tool classes following the same pattern.

## Integration with Existing Code

The chatbot uses your existing:
- `lib/ebay_api.py` - For eBay searches
- `lib/watch_database_api.py` - For Watch Database queries
- `lib/watch_api.py` - For watch metadata extraction
- `lib/config.py` - For environment configuration

## Next Steps

- Add more eBay analysis tools (price history, seller analysis)
- Integrate WatchCharts API for price comparisons
- Add PSA card analysis tools
- Create web interface (Flask/Streamlit)

