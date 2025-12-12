import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeEbayTool } from '@/lib/ebay/tools';
import * as ebayApi from '@/lib/ebay/api';

vi.mock('@/lib/ebay/api');

describe('eBay Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeEbayTool - search_ebay', () => {
    it('should execute search_ebay tool successfully', async () => {
      const mockSearchResult = {
        success: true,
        items: [
          {
            item_id: '123',
            title: 'Test Watch',
            price: 100,
            shipping: 10,
            url: 'https://ebay.com/item/123',
            image_url: 'https://example.com/image.jpg',
            item_condition: 'New',
            aspects: { Brand: 'Rolex' },
            currency: 'USD',
          },
        ],
        count: 1,
        total_found: 1,
      };

      vi.spyOn(ebayApi, 'searchEbay').mockResolvedValue(mockSearchResult);

      const result = await executeEbayTool('search_ebay', {
        query: 'Rolex',
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.query).toBe('Rolex');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].price_usd).toBe(100);
      expect(result.items[0].total_cost_usd).toBe(110);
    });

    it('should handle search errors', async () => {
      const mockSearchResult = {
        success: false,
        items: [],
        count: 0,
        error: 'API Error',
      };

      vi.spyOn(ebayApi, 'searchEbay').mockResolvedValue(mockSearchResult);

      const result = await executeEbayTool('search_ebay', {
        query: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should apply category filter', async () => {
      vi.spyOn(ebayApi, 'searchEbay').mockResolvedValue({
        success: true,
        items: [],
        count: 0,
      });

      await executeEbayTool('search_ebay', {
        query: 'watch',
        category: '260324',
      });

      expect(ebayApi.searchEbay).toHaveBeenCalledWith({
        query: 'watch',
        limit: 20,
        category_ids: '260324',
      });
    });
  });

  describe('executeEbayTool - analyze_watch_listing', () => {
    it('should analyze watch listing', async () => {
      const result = await executeEbayTool('analyze_watch_listing', {
        title: 'Rolex Submariner Date 116610LN',
        price: 8500,
        aspects: { Brand: 'Rolex', Model: 'Submariner' },
      });

      expect(result.success).toBe(true);
      expect(result.title).toBe('Rolex Submariner Date 116610LN');
      expect(result.listing_price_usd).toBe(8500);
      expect(result.metadata.brand).toBe('Rolex');
    });

    it('should handle missing aspects', async () => {
      const result = await executeEbayTool('analyze_watch_listing', {
        title: 'Test Watch',
      });

      expect(result.success).toBe(true);
      expect(result.metadata.brand).toBe('Unknown');
    });
  });

  describe('executeEbayTool - unknown tool', () => {
    it('should throw error for unknown tool', async () => {
      await expect(
        executeEbayTool('unknown_tool', {})
      ).rejects.toThrow('Unknown eBay tool');
    });
  });
});

