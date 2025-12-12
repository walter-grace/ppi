import { NextResponse } from 'next/server';
import { getNextJSErrors } from '@/lib/mcp/nextjs-devtools';
import { getMCPManager } from '@/lib/mcp/client';

export async function GET() {
  try {
    // Ensure MCP server is connected
    const manager = getMCPManager();
    if (!manager.isConnected('next-devtools')) {
      // Try to connect
      try {
        const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
        await manager.connect({
          name: 'next-devtools',
          command,
          args: ['-y', 'next-devtools-mcp@latest'],
        });
      } catch (error) {
        // Silently fail - Next.js DevTools MCP is optional
      }
    }
    
    const errors = await getNextJSErrors();
    // Return empty array if no errors (don't log errors - it's expected if MCP isn't available)
    return NextResponse.json({ errors: errors || [] });
  } catch (error: any) {
    // Silently return empty array - Next.js DevTools MCP is optional
    return NextResponse.json({ errors: [] });
  }
}

