import { NextResponse } from 'next/server';
import { getMCPManager } from '@/lib/mcp/client';

async function initializeWatchDatabaseMCP() {
  const manager = getMCPManager();
  
  // Check if already connected
  if (manager.isConnected('watch-database')) {
    console.log('✅ [Watch DB Test] Already connected to Watch Database MCP');
    return true;
  }
  
  // Try to connect
  try {
    const watchDbKey = process.env.WATCH_DATABASE_API_KEY || process.env.RAPIDAPI_KEY;
    if (!watchDbKey) {
      console.error('❌ [Watch DB Test] No API key found (WATCH_DATABASE_API_KEY or RAPIDAPI_KEY)');
      return false;
    }
    
    console.log('🔌 [Watch DB Test] Connecting to Watch Database MCP...');
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
    console.log('✅ [Watch DB Test] Connected to Watch Database MCP');
    return true;
  } catch (error: any) {
    console.error('❌ [Watch DB Test] Failed to connect:', error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || 'Rolex Submariner';
    
    console.log('\n🧪 [Watch DB Test] Starting test...');
    console.log(`   Query: "${query}"`);
    
    // Initialize connection
    const connected = await initializeWatchDatabaseMCP();
    if (!connected) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Watch Database MCP',
        message: 'Please check your WATCH_DATABASE_API_KEY or RAPIDAPI_KEY environment variable',
        envCheck: {
          hasWatchDbKey: !!process.env.WATCH_DATABASE_API_KEY,
          hasRapidApiKey: !!process.env.RAPIDAPI_KEY,
        }
      }, { status: 500 });
    }
    
    const manager = getMCPManager();
    
    // Check connection
    const isConnected = manager.isConnected('watch-database');
    console.log(`   Connected: ${isConnected}`);
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Watch Database MCP not connected after initialization',
        message: 'Connection attempt completed but server is not connected'
      }, { status: 500 });
    }
    
    // List available tools
    const tools = await manager.listTools('watch-database');
    console.log(`   Available tools: ${tools.length}`);
    console.log(`   Tool names:`, tools.map(t => t.name));
    
    // Try to call Search_Watches_by_name
    const toolName = 'Search_Watches_by_name';
    const toolExists = tools.some(t => t.name === toolName);
    
    if (!toolExists) {
      return NextResponse.json({
        success: false,
        error: `Tool "${toolName}" not found`,
        availableTools: tools.map(t => t.name),
        message: 'The expected tool is not available'
      }, { status: 404 });
    }
    
    console.log(`\n🔍 [Watch DB Test] Calling tool: ${toolName}`);
    
    // Try multiple parameter formats
    const paramAttempts = [
      { searchTerm: query, limit: "5", page: "1" },
      { searchTerm: query, limit: 5, page: 1 },
      { name: query, limit: "5" },
      { query: query, limit: "5" },
    ];
    
    let result: any = null;
    let usedParams: any = null;
    let duration = 0;
    
    for (const params of paramAttempts) {
      try {
        console.log(`   📤 Trying parameters:`, params);
        const startTime = Date.now();
        result = await manager.callTool('watch-database', toolName, params);
        duration = Date.now() - startTime;
        usedParams = params;
        
        console.log(`   ✅ Tool call completed in ${duration}ms`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Has content: ${!!result.content}`);
        
        // Check if we got an HTML error page
        if (result.content && typeof result.content === 'string' && result.content.includes('<!DOCTYPE html>')) {
          console.log(`   ⚠️  Got HTML error page instead of JSON`);
          continue; // Try next parameter format
        }
        
        // If we got valid content, break
        if (result.success && result.content && typeof result.content !== 'string') {
          break;
        }
      } catch (error: any) {
        console.log(`   ❌ Failed with params ${JSON.stringify(params)}:`, error.message);
        continue;
      }
    }
    
    if (!result) {
      return NextResponse.json({
        success: false,
        query,
        toolName,
        message: 'All parameter attempts failed',
        paramAttempts,
      }, { status: 500 });
    }
    
    // Check if response is an HTML error page
    if (result.content && typeof result.content === 'string' && result.content.includes('<!DOCTYPE html>')) {
      return NextResponse.json({
        success: false,
        query,
        toolName,
        duration: `${duration}ms`,
        usedParams,
        error: 'API returned HTML error page (500 Internal Server Error)',
        message: 'The Watch Database API is returning an error. This could be due to: invalid API key, API service issues, or incorrect parameters.',
        suggestions: [
          'Check if your API key is valid and has not expired',
          'Verify the API key has access to the Watch Database service',
          'Try a simpler query (e.g., just "Rolex")',
          'Check RapidAPI dashboard for service status',
        ],
        rawResponse: result.content.substring(0, 500), // First 500 chars
      }, { status: 500 });
    }
    
    if (result.success && result.content) {
      console.log(`   Content type: ${typeof result.content}`);
      console.log(`   Is array: ${Array.isArray(result.content)}`);
      
      if (typeof result.content === 'object') {
        console.log(`   Content keys:`, Object.keys(result.content));
      }
      
      // Try to extract watches
      let watches: any[] = [];
      if (Array.isArray(result.content)) {
        watches = result.content;
      } else if (result.content && typeof result.content === 'object') {
        watches = result.content.watches || 
                 result.content.data || 
                 result.content.results || 
                 result.content.items || 
                 [];
      }
      
      console.log(`   Extracted ${watches.length} watches`);
      
      if (watches.length > 0) {
        console.log(`   First watch sample:`, JSON.stringify(watches[0], null, 2));
      }
      
      return NextResponse.json({
        success: true,
        query,
        toolName,
        duration: `${duration}ms`,
        usedParams,
        result: {
          success: result.success,
          hasContent: !!result.content,
          contentType: typeof result.content,
          isArray: Array.isArray(result.content),
          contentKeys: result.content && typeof result.content === 'object' ? Object.keys(result.content) : [],
          watchesCount: watches.length,
          watches: watches.slice(0, 3), // Return first 3 for preview
          fullResponse: result.content, // Include full response
        },
        availableTools: tools.map(t => ({
          name: t.name,
          description: t.description?.substring(0, 100),
        })),
      });
    } else {
      return NextResponse.json({
        success: false,
        query,
        toolName,
        duration: `${duration}ms`,
        usedParams,
        result: {
          success: result.success,
          error: result.error,
          content: typeof result.content === 'string' ? result.content.substring(0, 500) : result.content,
        },
        message: 'Tool call completed but no valid content returned',
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('❌ [Watch DB Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      message: 'Failed to test Watch Database MCP',
    }, { status: 500 });
  }
}

