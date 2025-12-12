# Next.js MCP Chatbot

A modern, full-featured Next.js 16+ chatbot application with MCP (Model Context Protocol) integration for watch and trading card arbitrage.

## Features

- **Beautiful UI**: Modern, responsive design with shadcn/ui components
- **Real-time Streaming**: Stream AI responses and MCP tool results in real-time
- **MCP Integration**: 
  - Next.js DevTools MCP (get errors, logs, page metadata)
  - Watch Database MCP (search watches, get brands)
  - eBay API integration
- **Type-Safe**: Full TypeScript coverage
- **Mobile Responsive**: Works beautifully on all devices

## Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Environment variables (see `.env.example`)

## Installation

1. **Install dependencies:**

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Required environment variables:
- `OPENROUTER_API_KEY` - For AI model access (Claude via OpenRouter)
- `WATCH_DATABASE_API_KEY` or `RAPIDAPI_KEY` - For Watch Database MCP
- `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` - For eBay API (or use `EBAY_OAUTH`)

3. **Run the development server:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## MCP Server Configuration

The application automatically connects to MCP servers configured in `.mcp.json`:

- **Next.js DevTools MCP**: Automatically connects when dev server is running
- **Watch Database MCP**: Connects using `WATCH_DATABASE_API_KEY` from environment

## Usage Examples

### Search eBay

```
Search eBay for Rolex Submariner watches
```

### Query Watch Database

```
What watch brands are available?
Search the watch database for reference 116610LN
```

### Next.js DevTools

```
Show me errors in my Next.js app
Get the current page metadata
```

### Combined Queries

```
Find Rolex watches on eBay under $10,000 and check if they're good deals
```

## Project Structure

```
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint with MCP integration
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main chat interface
│   └── globals.css                # Global styles
├── components/
│   ├── chat/                      # Chat UI components
│   ├── mcp-results/               # Specialized MCP result displays
│   ├── devtools/                  # Next.js DevTools components
│   └── ui/                        # shadcn/ui components
├── lib/
│   ├── mcp/                       # MCP client manager
│   ├── ebay/                      # eBay API integration
│   └── streaming/                 # Streaming utilities
└── hooks/                         # Custom React hooks
```

## Architecture

The application uses:

- **Next.js 16+** with App Router
- **Vercel AI SDK** for streaming AI responses
- **MCP SDK** for Model Context Protocol integration
- **OpenRouter** for Claude AI model access
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling

## MCP Servers

### Next.js DevTools MCP

Provides access to:
- `get_errors` - Build, runtime, and type errors
- `get_logs` - Development server logs
- `get_page_metadata` - Page routes and components
- `get_server_action_by_id` - Server action information

### Watch Database MCP

Provides access to:
- Watch search by name or reference
- Watch brands (makes) list
- Watch details and metadata

### eBay API

Direct API integration (not MCP) for:
- eBay item search
- Watch listing analysis

## Development

### Adding New MCP Servers

1. Add server configuration to `.mcp.json`
2. Update `app/api/chat/route.ts` to connect to the new server
3. Create specialized result component in `components/mcp-results/` if needed

### Customizing UI

All UI components use shadcn/ui and can be customized via:
- `app/globals.css` - Theme variables
- `tailwind.config.ts` - Tailwind configuration
- Component files in `components/`

## Troubleshooting

### MCP Server Not Connecting

- Ensure Node.js and npm are installed (required for `npx`)
- Check that API keys are set in `.env.local`
- Verify MCP server configuration in `.mcp.json`
- Check browser console and server logs for errors

### OpenRouter Errors

- Verify `OPENROUTER_API_KEY` is correct
- Check your OpenRouter account has credits
- Model used: `anthropic/claude-3-5-sonnet` (configurable in `app/api/chat/route.ts`)

### eBay API Errors

- Ensure `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` are set
- Or use a pre-generated `EBAY_OAUTH` token
- Token auto-refreshes if Client ID/Secret are provided

## Building for Production

```bash
npm run build
npm start
```

## License

See LICENSE file for details.

