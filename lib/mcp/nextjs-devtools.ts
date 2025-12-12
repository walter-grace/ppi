// This file should only be imported in server-side code (API routes, server components)
// Client components should use API routes instead
import { getMCPManager, type MCPToolResult } from './client';

const NEXTJS_DEVTOOLS_SERVER = 'next-devtools';

export interface NextJSError {
  type: 'build' | 'runtime' | 'type';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

export interface NextJSPageMetadata {
  route: string;
  component: string;
  layout?: string;
  rendering: 'ssr' | 'ssg' | 'isr' | 'csr';
}

export interface NextJSServerAction {
  id: string;
  file: string;
  function: string;
}

/**
 * Get errors from Next.js DevTools MCP
 */
export async function getNextJSErrors(): Promise<NextJSError[]> {
  const manager = getMCPManager();
  
  if (!manager.isConnected(NEXTJS_DEVTOOLS_SERVER)) {
    // Try to connect
    try {
      const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      await manager.connect({
        name: NEXTJS_DEVTOOLS_SERVER,
        command,
        args: ['-y', 'next-devtools-mcp@latest'],
      });
    } catch (error) {
      // Silently fail - Next.js DevTools MCP is optional
      return [];
    }
  }

  try {
    // First, list available tools to find the correct name
    const availableTools = await manager.listTools(NEXTJS_DEVTOOLS_SERVER);
    const toolNames = availableTools.map(t => t.name);
    
    // Check if there's an error-related tool
    const errorToolNames = toolNames.filter(name => 
      name.toLowerCase().includes('error') || 
      name.toLowerCase().includes('get_error') ||
      name.toLowerCase().includes('log')
    );
    
    // Next.js DevTools MCP doesn't have a direct error tool
    // Errors are typically accessed through the Next.js dev server directly
    // For now, return empty array since the tool doesn't exist
    if (errorToolNames.length === 0) {
      // Silently return empty - this is expected behavior
      // Next.js DevTools MCP doesn't expose errors through MCP tools
      return [];
    }
    
    // If we found an error tool, try to use it
    let result = null;
    for (const toolName of errorToolNames) {
      try {
        result = await manager.callTool(NEXTJS_DEVTOOLS_SERVER, toolName, {});
        if (result.success) {
          console.log(`[NextJS DevTools] Successfully called tool: ${toolName}`);
          break;
        }
      } catch (error: any) {
        continue;
      }
    }

    if (!result || !result.success) {
      return [];
    }
    
    if (result.success && result.content) {
      // Parse the errors from the MCP response
      if (Array.isArray(result.content)) {
        return result.content as NextJSError[];
      } else if (result.content.errors) {
        return result.content.errors as NextJSError[];
      } else if (result.content.content) {
        // Handle nested content structure
        const content = result.content.content;
        if (Array.isArray(content)) {
          return content as NextJSError[];
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Next.js errors:', error);
    return [];
  }
}

/**
 * Get development logs from Next.js DevTools MCP
 */
export async function getNextJSLogs(): Promise<string> {
  const manager = getMCPManager();
  
  if (!manager.isConnected(NEXTJS_DEVTOOLS_SERVER)) {
    try {
      const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      await manager.connect({
        name: NEXTJS_DEVTOOLS_SERVER,
        command,
        args: ['-y', 'next-devtools-mcp@latest'],
      });
    } catch (error) {
      return '';
    }
  }

  try {
    const result = await manager.callTool(NEXTJS_DEVTOOLS_SERVER, 'get_logs', {});
    
    if (result.success && result.text) {
      return result.text;
    }
    
    return '';
  } catch (error) {
    console.error('Error fetching Next.js logs:', error);
    return '';
  }
}

/**
 * Get page metadata from Next.js DevTools MCP
 */
export async function getNextJSPageMetadata(
  pagePath?: string
): Promise<NextJSPageMetadata | null> {
  const manager = getMCPManager();
  
  if (!manager.isConnected(NEXTJS_DEVTOOLS_SERVER)) {
    try {
      const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      await manager.connect({
        name: NEXTJS_DEVTOOLS_SERVER,
        command,
        args: ['-y', 'next-devtools-mcp@latest'],
      });
    } catch (error) {
      return null;
    }
  }

  try {
    const result = await manager.callTool(
      NEXTJS_DEVTOOLS_SERVER,
      'get_page_metadata',
      pagePath ? { path: pagePath } : {}
    );
    
    if (result.success && result.content) {
      return result.content as NextJSPageMetadata;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Next.js page metadata:', error);
    return null;
  }
}

/**
 * Get server action by ID from Next.js DevTools MCP
 */
export async function getNextJSServerAction(
  actionId: string
): Promise<NextJSServerAction | null> {
  const manager = getMCPManager();
  
  if (!manager.isConnected(NEXTJS_DEVTOOLS_SERVER)) {
    try {
      const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      await manager.connect({
        name: NEXTJS_DEVTOOLS_SERVER,
        command,
        args: ['-y', 'next-devtools-mcp@latest'],
      });
    } catch (error) {
      return null;
    }
  }

  try {
    const result = await manager.callTool(
      NEXTJS_DEVTOOLS_SERVER,
      'get_server_action_by_id',
      { id: actionId }
    );
    
    if (result.success && result.content) {
      return result.content as NextJSServerAction;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Next.js server action:', error);
    return null;
  }
}

