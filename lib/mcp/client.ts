// Server-side only - uses Node.js modules
// This file should NOT be imported in client components
// Use API routes instead for client-side access

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  success: boolean;
  content?: any;
  error?: string;
  isError?: boolean;
  text?: string;
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();

  async connect(config: MCPServerConfig): Promise<Client> {
    if (this.clients.has(config.name)) {
      return this.clients.get(config.name)!;
    }

    try {
      // Replace environment variables in args
      const processedArgs = config.args.map(arg => {
        if (arg.startsWith('${') && arg.endsWith('}')) {
          const envVar = arg.slice(2, -1);
          return process.env[envVar] || arg;
        }
        return arg;
      });

      // On Windows, npx might need to be called differently
      // Try to find npx in common locations or use npm.cmd
      let command = config.command;
      let args = processedArgs;
      
      if (process.platform === 'win32' && command === 'npx') {
        // Try to use npx.cmd or find npx in PATH
        try {
          // First try npx.cmd (Windows npm)
          command = 'npx.cmd';
        } catch {
          // Fallback to npm.cmd with exec
          command = 'npm.cmd';
          args = ['exec', '--yes', ...processedArgs];
        }
      }

      // Create transport (don't spawn manually - let StdioClientTransport handle it)
      // Filter out undefined values from process.env for TypeScript
      const env: Record<string, string> = {};
      for (const key in process.env) {
        const value = process.env[key];
        if (value !== undefined) {
          env[key] = value;
        }
      }
      if (config.env) {
        Object.assign(env, config.env);
      }

      const transport = new StdioClientTransport({
        command,
        args,
        env,
      });

      // Create client
      const client = new Client(
        {
          name: 'psa-mcp-chatbot',
          version: '0.1.0',
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);

      this.clients.set(config.name, client);
      this.transports.set(config.name, transport);

      return client;
    } catch (error) {
      console.error(`Failed to connect to MCP server ${config.name}:`, error);
      throw error;
    }
  }

  async listTools(serverName: string): Promise<Tool[]> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server ${serverName} not connected`);
    }

    const response = await client.listTools();
    return response.tools;
  }

  async callTool(
    serverName: string,
    toolName: string,
    arguments_: Record<string, any>
  ): Promise<MCPToolResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      console.error(`   ❌ [MCP] Server ${serverName} not connected`);
      return {
        success: false,
        error: `MCP server ${serverName} not connected`,
      };
    }

    try {
      console.log(`   📡 [MCP] Calling ${serverName}.${toolName}...`);
      const startTime = Date.now();
      const result = await client.callTool({
        name: toolName,
        arguments: arguments_,
      });
      const duration = Date.now() - startTime;
      if (result.content) {
        console.log(`   ✅ [MCP] ${serverName}.${toolName} completed in ${duration}ms`);
      } else {
        console.log(`   ⚠️  [MCP] ${serverName}.${toolName} returned empty result in ${duration}ms`);
      }

      // Parse MCP result content
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const content = result.content[0];
        if (content.type === 'text') {
          const textContent = content.text;
          
          // Check if it's an HTML error page
          if (typeof textContent === 'string' && textContent.includes('<!DOCTYPE html>')) {
            console.error(`   ❌ [MCP] ${serverName}.${toolName} returned HTML error page`);
            // Try to extract error message from HTML
            const errorMatch = textContent.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                             textContent.match(/<h2[^>]*>([^<]+)<\/h2>/i) ||
                             textContent.match(/<title[^>]*>([^<]+)<\/title>/i);
            const errorMsg = errorMatch ? errorMatch[1] : 'API returned HTML error page (likely 500 Internal Server Error)';
            
            return {
              success: false,
              error: errorMsg,
              content: textContent.substring(0, 500), // First 500 chars for debugging
              isError: true,
            };
          }
          
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(textContent);
            return {
              success: true,
              content: parsed,
              text: textContent,
            };
          } catch {
            // Not JSON, return as text
            // But check if it looks like an error message
            if (textContent.toLowerCase().includes('error') || 
                textContent.toLowerCase().includes('failed') ||
                textContent.toLowerCase().includes('500')) {
              return {
                success: false,
                error: textContent.substring(0, 200),
                content: textContent,
                isError: true,
              };
            }
            
            return {
              success: true,
              content: textContent,
              text: textContent,
            };
          }
        } else if (content.type === 'image') {
          return {
            success: true,
            content: { type: 'image', data: content.data },
          };
        }
      }

      return {
        success: true,
        content: result,
      };
    } catch (error: any) {
      // Only log errors for tools that should exist
      // Don't spam console for expected failures (like missing error tools)
      const isExpectedFailure = error.message?.includes('Tool not found') || 
                                 error.message?.includes('-32603');
      if (!isExpectedFailure) {
        console.error(`   ❌ [MCP] ${serverName}.${toolName} failed:`, error.message);
      }
      return {
        success: false,
        error: error.message || String(error),
        isError: true,
      };
    }
  }

  async disconnect(serverName: string): Promise<void> {
    const transport = this.transports.get(serverName);
    if (transport) {
      await transport.close();
      this.transports.delete(serverName);
    }
    this.clients.delete(serverName);
  }

  async disconnectAll(): Promise<void> {
    const serverNames = Array.from(this.clients.keys());
    await Promise.all(serverNames.map(name => this.disconnect(name)));
  }

  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }

  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}

// Singleton instance
let mcpManager: MCPClientManager | null = null;

export function getMCPManager(): MCPClientManager {
  if (!mcpManager) {
    mcpManager = new MCPClientManager();
  }
  return mcpManager;
}

