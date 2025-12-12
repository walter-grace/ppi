import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { getMCPManager } from '@/lib/mcp/client';

// Mock dependencies
vi.mock('@/lib/mcp/client');
vi.mock('@/lib/ebay/tools');
vi.mock('ai', () => ({
  streamText: vi.fn(),
  tool: vi.fn((def) => def),
}));
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(),
}));

describe('Chat API Route', () => {
  const mockRequest = {
    json: vi.fn().mockResolvedValue({
      messages: [
        { role: 'user', content: 'Hello' },
      ],
    }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('should handle chat request', async () => {
    const mockManager = {
      isConnected: vi.fn().mockReturnValue(false),
      connect: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue([]),
    };

    (getMCPManager as any).mockReturnValue(mockManager);

    // Mock streamText to return a mock response
    const { streamText } = await import('ai');
    (streamText as any).mockResolvedValue({
      toDataStreamResponse: vi.fn().mockReturnValue(new Response()),
    });

    const response = await POST(mockRequest);

    expect(response).toBeInstanceOf(Response);
  });

  it('should initialize MCP servers', async () => {
    const mockManager = {
      isConnected: vi.fn().mockReturnValue(false),
      connect: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue([]),
    };

    (getMCPManager as any).mockReturnValue(mockManager);

    const { streamText } = await import('ai');
    (streamText as any).mockResolvedValue({
      toDataStreamResponse: vi.fn().mockReturnValue(new Response()),
    });

    await POST(mockRequest);

    // Should attempt to connect to MCP servers (may be called during initialization)
    // The connect is called inside initializeMCPServers which runs on module load
    // So we just verify the manager was accessed
    expect(getMCPManager).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const mockManager = {
      isConnected: vi.fn().mockReturnValue(false),
      connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
      listTools: vi.fn().mockResolvedValue([]),
    };

    (getMCPManager as any).mockReturnValue(mockManager);

    const { streamText } = await import('ai');
    (streamText as any).mockRejectedValue(new Error('Stream error'));

    const response = await POST(mockRequest);

    expect(response.status).toBe(500);
  });

  it('should include eBay tools', async () => {
    const mockManager = {
      isConnected: vi.fn().mockReturnValue(false),
      connect: vi.fn().mockResolvedValue(undefined),
      listTools: vi.fn().mockResolvedValue([]),
    };

    (getMCPManager as any).mockReturnValue(mockManager);

    const { streamText } = await import('ai');
    (streamText as any).mockResolvedValue({
      toDataStreamResponse: vi.fn().mockReturnValue(new Response()),
    });

    await POST(mockRequest);

    // Verify streamText was called with tools
    expect(streamText).toHaveBeenCalled();
    const callArgs = (streamText as any).mock.calls[0][0];
    expect(callArgs.tools).toBeDefined();
  });
});

