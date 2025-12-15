import { streamText, tool, convertToModelMessages } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { getMCPManager } from '@/lib/mcp/client';
import { executeEbayTool, searchEbaySchema, analyzeWatchListingSchema } from '@/lib/ebay/tools';

// Initialize MCP servers on module load
let mcpInitialized = false;

async function initializeMCPServers() {
  if (mcpInitialized) return;
  
  const manager = getMCPManager();
  
  // Initialize Watch Database MCP (skip Next.js DevTools as requested)
  try {
    const watchDbKey = process.env.WATCH_DATABASE_API_KEY || process.env.RAPIDAPI_KEY;
    if (watchDbKey && !manager.isConnected('watch-database')) {
      await manager.connect({
        name: 'watch-database',
        command: 'npx',
        args: [
          '-y',
          'mcp-remote',
          'https://mcp.rapidapi.com',
          '--header',
          'x-api-host: watch-database1.p.rapidapi.com',
          '--header',
          `x-api-key: ${watchDbKey}`,
        ],
      });
      console.log('✅ Connected to Watch Database MCP');
    }
  } catch (error) {
    console.warn('⚠️ Failed to connect to Watch Database MCP:', error);
  }

  // Initialize Stripe MCP server
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey && !manager.isConnected('stripe')) {
      // Use local Stripe MCP server with API key
      await manager.connect({
        name: 'stripe',
        command: 'npx',
        args: ['-y', '@stripe/mcp', '--tools=all'],
        env: {
          STRIPE_SECRET_KEY: stripeSecretKey,
        },
      });
      console.log('✅ Connected to Stripe MCP');
    }
  } catch (error) {
    console.warn('⚠️ Failed to connect to Stripe MCP:', error);
  }

  mcpInitialized = true;
}

export async function POST(req: Request) {
  const requestStartTime = Date.now();
  
  try {
    const { messages } = await req.json();
    
    // Extract user message text from UIMessage (v2 uses parts array)
    const lastMessage = messages?.slice(-1)?.[0];
    const userMessage = lastMessage?.parts?.find((p: any) => p.type === 'text')?.text || 'Unknown';

    console.log('\n📨 [Chat API] New request received');
    console.log(`   User query: "${userMessage}"`);
    console.log(`   📥 Received ${messages?.length || 0} UIMessages`);
    
    // Convert UIMessage[] to ModelMessage[] for streamText
    // convertToModelMessages expects messages without 'id' field
    const messagesWithoutId = (messages || []).map(({ id, ...rest }: any) => rest);
    const modelMessages = convertToModelMessages(messagesWithoutId);
    console.log(`   ✅ Converted to ${modelMessages.length} ModelMessages`);

    await initializeMCPServers();

    const manager = getMCPManager();

    // Get MCP tools (Watch Database only)
    const mcpTools: any[] = [];
    let watchDbToolsCount = 0;

    try {
      if (manager.isConnected('watch-database')) {
        const tools = await manager.listTools('watch-database');
        watchDbToolsCount = tools.length;
        console.log(`   📦 [MCP] Watch Database: ${tools.length} tools available`);
        for (const tool of tools) {
          mcpTools.push({
            type: 'function' as const,
            function: {
              name: `watchdb_${tool.name}`,
              description: tool.description || `Watch Database: ${tool.name}`,
              parameters: tool.inputSchema || {},
            },
          });
        }
      }
    } catch (error) {
      console.warn('   ⚠️  [MCP] Error listing Watch Database tools:', error);
    }

    // Create tool handlers
    const toolHandlers: Record<string, (args: any) => Promise<any>> = {};

    // eBay tools
    toolHandlers['search_ebay'] = async (args) => {
      console.log(`   🔧 [Tool Call] search_ebay with args:`, JSON.stringify(args));
      const startTime = Date.now();
      const validatedArgs = searchEbaySchema.parse(args);
      const result = await executeEbayTool('search_ebay', validatedArgs);
      const duration = Date.now() - startTime;
      console.log(`   ✅ [Tool Call] search_ebay completed in ${duration}ms`);
      return result;
    };

    toolHandlers['analyze_watch_listing'] = async (args) => {
      console.log(`   🔧 [Tool Call] analyze_watch_listing with args:`, JSON.stringify(args));
      const startTime = Date.now();
      const validatedArgs = analyzeWatchListingSchema.parse(args);
      const result = await executeEbayTool('analyze_watch_listing', validatedArgs);
      const duration = Date.now() - startTime;
      console.log(`   ✅ [Tool Call] analyze_watch_listing completed in ${duration}ms`);
      return result;
    };

    // Watch Database MCP tools
    for (const tool of mcpTools.filter(t => t.function.name.startsWith('watchdb_'))) {
      const toolName = tool.function.name;
      const originalName = toolName.replace('watchdb_', '');
      toolHandlers[toolName] = async (args) => {
        console.log(`   🔧 [MCP Tool] ${toolName} (${originalName}) with args:`, JSON.stringify(args));
        const startTime = Date.now();
        const result = await manager.callTool('watch-database', originalName, args);
        const duration = Date.now() - startTime;
        if (result.success) {
          console.log(`   ✅ [MCP Tool] ${toolName} completed in ${duration}ms`);
        } else {
          console.error(`   ❌ [MCP Tool] ${toolName} failed after ${duration}ms:`, result.error);
        }
        return result.success ? result.content : { error: result.error };
      };
    }

    // Create tool definitions for AI SDK v5
    const toolsObject: Record<string, any> = {};
    
    // eBay tools
    toolsObject['search_ebay'] = tool({
      description: 'ALWAYS use this tool when the user asks to search eBay, find items on eBay, or look for watches/cards on eBay. This tool searches eBay using the eBay Browse API and returns real listings with prices, URLs, and details. REQUIRED for any eBay search request.',
      inputSchema: searchEbaySchema,
      execute: toolHandlers['search_ebay'],
    });

    toolsObject['analyze_watch_listing'] = tool({
      description: 'Analyze an eBay watch listing to extract metadata (brand, model, reference number) and check for arbitrage opportunities. Uses Watch Database API to enrich metadata. Provide the eBay listing title and optionally the price.',
      inputSchema: analyzeWatchListingSchema,
      execute: toolHandlers['analyze_watch_listing'],
    });

    // MCP tools (Watch Database) - skip for now to avoid schema issues
    // TODO: Convert JSON schema to Zod schema for MCP tools
    // For now, only use eBay tools which have proper Zod schemas

    const hasTools = Object.keys(toolsObject).length > 0;
    console.log(`   🔧 Created ${Object.keys(toolsObject).length} tools:`, Object.keys(toolsObject).join(', '));

    // Determine if query needs tools
    const userQuery = userMessage.toLowerCase();
    const likelyNeedsTools = userQuery.includes('ebay') || 
                             userQuery.includes('search') || 
                             userQuery.includes('find') || 
                             userQuery.includes('browse') ||
                             userQuery.includes('show me') ||
                             userQuery.includes('look for') ||
                             userQuery.includes('watch') ||
                             userQuery.includes('card');
    
    console.log(`   🔍 [Debug] Query analysis:`, {
      userQuery: userMessage.substring(0, 50),
      likelyNeedsTools,
      hasTools,
      toolNames: Object.keys(toolsObject),
    });

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    console.log(`   🤖 [OpenRouter] Calling Claude model...`);
    const aiStartTime = Date.now();

    // Use streamText - mirror the working test endpoint pattern
    const result = await streamText({
      model: openrouter('anthropic/claude-3-5-sonnet'),
      system: `You are a helpful assistant for watch and trading card arbitrage and negotiation. 
When users ask to search eBay, find items on eBay, look for watches/cards, or use phrases like "Search eBay for X", "Browse X", "Find X", or "Show me X", you MUST use the search_ebay tool.
When users ask to analyze a watch listing, you MUST use the analyze_watch_listing tool.
Always use the available tools instead of making up information. Be direct and use tools when appropriate.

IMPORTANT: 
- If a user says "Search eBay for [item]" or "Browse [item]", immediately use the search_ebay tool with that item as the query.
- When users provide detailed search queries (including specific features like dial color, bezel type, reference numbers, materials), use those EXACT queries as provided. Do not simplify or shorten them. Detailed queries help find more accurate matches. For example, if a user says "search for Rolex Datejust 126334 mint green fluted bezel", use that entire query, not just "Rolex Datejust".
- Always set analyze_arbitrage to true when searching for watches or trading cards to provide valuation analysis.

NEGOTIATION ASSISTANCE:
- When users ask about negotiation prices, fair offers, or "what should I offer", provide detailed negotiation advice based on:
  * Current listing price vs market value
  * Typical negotiation ranges (10-15% below listing for aggressive, 5-10% for fair)
  * Maximum price recommendations (usually 2-5% above market value)
  * Negotiation strategy based on whether item is undervalued, overvalued, or fair value
- For undervalued items: Suggest starting at listing price or slightly below, as it's already a good deal
- For overvalued items: Suggest aggressive offers (15-20% below listing) with clear justification
- For fair value items: Suggest moderate offers (5-10% below listing) as starting point
- Always consider shipping costs and total all-in price when making recommendations
- Provide a negotiation range (aggressive offer, fair offer, max price) to give users flexibility`,
      messages: modelMessages,
      // Only include tools if query likely needs them
      ...(likelyNeedsTools && hasTools ? { tools: toolsObject } : {}),
      // Note: maxTokens might need to be set on the model instead in v5
      // maxTokens: 2000,
    });

    const aiDuration = Date.now() - aiStartTime;
    const totalDuration = Date.now() - requestStartTime;
    console.log(`   ✅ [OpenRouter] Response generated in ${aiDuration}ms`);
    console.log(`   ✅ [Chat API] Total request time: ${totalDuration}ms\n`);

    // AI SDK v5: Use toUIMessageStreamResponse() for tool support
    // This is the correct method for streaming with tools in v5
    // The client should use default protocol (not 'text') to handle UI message streams
    if (typeof result.toUIMessageStreamResponse === 'function') {
      console.log(`   📤 [Response] Using toUIMessageStreamResponse() (supports tools)`);
      return result.toUIMessageStreamResponse();
    } else if (typeof result.toTextStreamResponse === 'function') {
      // Fallback to text stream if UI message stream not available (no tools)
      console.log(`   📤 [Response] Using toTextStreamResponse() (no tools)`);
      return result.toTextStreamResponse();
    } else {
      throw new Error('No valid stream response method found');
    }

  } catch (error: any) {
    const totalDuration = Date.now() - requestStartTime;
    console.error(`   ❌ [Chat API] Error after ${totalDuration}ms:`, error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
