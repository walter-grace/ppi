import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getNextJSErrors,
  getNextJSLogs,
  getNextJSPageMetadata,
  getNextJSServerAction,
} from '@/lib/mcp/nextjs-devtools';
import { getMCPManager } from '@/lib/mcp/client';

vi.mock('@/lib/mcp/client');

describe('Next.js DevTools', () => {
  const mockManager = {
    isConnected: vi.fn(),
    connect: vi.fn(),
    callTool: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getMCPManager as any).mockReturnValue(mockManager);
  });

  describe('getNextJSErrors', () => {
    it('should fetch errors successfully', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockResolvedValue({
        success: true,
        content: [
          {
            type: 'runtime',
            message: 'Test error',
            file: 'test.ts',
            line: 10,
          },
        ],
      });

      const errors = await getNextJSErrors();

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('runtime');
      expect(errors[0].message).toBe('Test error');
    });

    it('should connect if not connected', async () => {
      mockManager.isConnected.mockReturnValue(false);
      mockManager.connect.mockResolvedValue(undefined);
      mockManager.callTool.mockResolvedValue({
        success: true,
        content: [],
      });

      await getNextJSErrors();

      expect(mockManager.connect).toHaveBeenCalled();
    });

    it('should handle different error response formats', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockResolvedValue({
        success: true,
        content: {
          errors: [
            { type: 'build', message: 'Build error' },
          ],
        },
      });

      const errors = await getNextJSErrors();

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('build');
    });

    it('should return empty array on error', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockRejectedValue(new Error('Connection failed'));

      const errors = await getNextJSErrors();

      expect(errors).toEqual([]);
    });
  });

  describe('getNextJSLogs', () => {
    it('should fetch logs successfully', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockResolvedValue({
        success: true,
        text: 'Log line 1\nLog line 2',
      });

      const logs = await getNextJSLogs();

      expect(logs).toBe('Log line 1\nLog line 2');
    });

    it('should return empty string on error', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockRejectedValue(new Error('Failed'));

      const logs = await getNextJSLogs();

      expect(logs).toBe('');
    });
  });

  describe('getNextJSPageMetadata', () => {
    it('should fetch page metadata successfully', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockResolvedValue({
        success: true,
        content: {
          route: '/test',
          component: 'TestComponent',
          rendering: 'ssr',
        },
      });

      const metadata = await getNextJSPageMetadata();

      expect(metadata?.route).toBe('/test');
      expect(metadata?.component).toBe('TestComponent');
      expect(metadata?.rendering).toBe('ssr');
    });

    it('should pass page path parameter', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockResolvedValue({
        success: true,
        content: {},
      });

      await getNextJSPageMetadata('/custom-page');

      expect(mockManager.callTool).toHaveBeenCalledWith(
        'next-devtools',
        'get_page_metadata',
        { path: '/custom-page' }
      );
    });

    it('should return null on error', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockRejectedValue(new Error('Failed'));

      const metadata = await getNextJSPageMetadata();

      expect(metadata).toBeNull();
    });
  });

  describe('getNextJSServerAction', () => {
    it('should fetch server action successfully', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockResolvedValue({
        success: true,
        content: {
          id: 'action-123',
          file: 'app/actions.ts',
          function: 'testAction',
        },
      });

      const action = await getNextJSServerAction('action-123');

      expect(action?.id).toBe('action-123');
      expect(action?.file).toBe('app/actions.ts');
      expect(action?.function).toBe('testAction');
    });

    it('should return null on error', async () => {
      mockManager.isConnected.mockReturnValue(true);
      mockManager.callTool.mockRejectedValue(new Error('Failed'));

      const action = await getNextJSServerAction('action-123');

      expect(action).toBeNull();
    });
  });
});

