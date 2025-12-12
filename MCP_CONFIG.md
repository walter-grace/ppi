# MCP Server Configuration for Watch Database API

This document explains how to configure the MCP (Model Context Protocol) server in Cursor IDE to enable AI assistance with the Watch Database API.

## What is MCP?

MCP (Model Context Protocol) allows AI assistants in Cursor to interact with external APIs and tools. By configuring the Watch Database API as an MCP server, you can use AI assistance to query watch data directly from within Cursor.

## Setup Instructions

### 1. Open Cursor Settings

1. Open Cursor IDE
2. Go to **Settings** (or press `Ctrl+,` / `Cmd+,`)
3. Navigate to **Features** → **Model Context Protocol** (or search for "MCP")

### 2. Add MCP Server Configuration

Add the following JSON configuration to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "RapidAPI Hub - Watch Database": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.rapidapi.com",
        "--header",
        "x-api-host: watch-database1.p.rapidapi.com",
        "--header",
        "x-api-key: 5a7c97415bmsh6e460ae309db745p1a9ac3jsnc27ca9fad319"
      ]
    }
  }
}
```

### 3. Restart Cursor

After adding the configuration, restart Cursor IDE to activate the MCP server.

### 4. Verify Setup

Once configured, you can ask Cursor's AI assistant to:
- Search for watches by name
- Look up watch details by reference number
- Get watch makes (brands) and models
- Query watch database information

Example prompts:
- "Search for Rolex Submariner watches in the database"
- "What watch makes are available?"
- "Get details for watch reference 116610LN"

## API Key

The API key used in this configuration is: `5a7c97415bmsh6e460ae309db745p1a9ac3jsnc27ca9fad319`

**Note**: This same API key should also be added to your `.env.local` file as `RAPIDAPI_KEY` or `WATCH_DATABASE_API_KEY` for use in the Python application.

## Python Application Integration

The Python application (`lib/watch_database_api.py`) makes direct HTTP calls to the same Watch Database API endpoints. This allows the application to:

1. Use the API programmatically in Python code
2. Cache responses to reduce API calls
3. Handle rate limiting and errors gracefully
4. Work independently of the MCP server

Both the MCP server (for AI assistance) and the Python client (for application logic) use the same API endpoints and authentication.

## Troubleshooting

### MCP Server Not Working

1. Ensure Node.js and npm are installed (required for `npx`)
2. Check that the API key is correct
3. Verify the API host is `watch-database1.p.rapidapi.com`
4. Restart Cursor after configuration changes

### API Rate Limits

The BASIC tier has limited requests per month. Monitor usage via:
- RapidAPI dashboard: https://rapidapi.com/
- Python usage tracker: `lib/rapidapi_usage_tracker.py`

## Additional Resources

- [RapidAPI Watch Database Documentation](https://rapidapi.com/makingdatameaningful-com-makingdatameaningful-com-default/api/watch-database1)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Cursor MCP Guide](https://cursor.sh/docs/mcp)

