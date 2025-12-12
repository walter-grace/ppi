# Quick Start Guide - Next.js MCP Chatbot

## Quick Setup (5 minutes)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file:**
   ```bash
   cp .env.example .env.local
   ```

3. **Add your API keys to `.env.local`:**
   ```env
   OPENROUTER_API_KEY=your_key_here
   WATCH_DATABASE_API_KEY=your_key_here
   EBAY_CLIENT_ID=your_id_here
   EBAY_CLIENT_SECRET=your_secret_here
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

## First Test

Try asking:
- "Search eBay for Rolex Submariner watches"
- "What watch brands are available?"
- "Show me errors in my Next.js app"

## Troubleshooting

**MCP servers not connecting?**
- Make sure Node.js 18+ is installed
- Check that API keys are in `.env.local` (not `.env`)
- Restart the dev server after adding environment variables

**Getting errors?**
- Check the browser console
- Check the terminal for server errors
- Verify all environment variables are set correctly

## Next Steps

- Read `README_NEXTJS.md` for full documentation
- Customize the UI in `components/`
- Add more MCP servers in `.mcp.json`

