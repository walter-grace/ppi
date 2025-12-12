import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchEbay, getEbayItemDetails } from '@/lib/ebay/api';

// Mock fetch
global.fetch = vi.fn();

describe('eBay API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock token generation
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'test-token' }),
    });
  });

  describe('searchEbay', () => {
    it('should search eBay successfully', async () => {
      const mockResponse = {
        itemSummaries: [
          {
            itemId: '123',
            title: 'Test Watch',
            price: { value: '100.00', currency: 'USD' },
            shippingOptions: [{ shippingCost: { value: '10.00' } }],
            itemWebUrl: 'https://ebay.com/item/123',
            localizedAspects: [
              { name: 'Brand', value: 'Rolex' },
              { name: 'Model', value: 'Submariner' },
            ],
            condition: 'New',
            image: { imageUrl: 'https://example.com/image.jpg' },
          },
        ],
        total: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchEbay({ query: 'Rolex', limit: 20 });

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].item_id).toBe('123');
      expect(result.items[0].title).toBe('Test Watch');
      expect(result.items[0].price).toBe(100);
      expect(result.items[0].shipping).toBe(10);
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const result = await searchEbay({ query: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });

    it('should filter out non-USD items', async () => {
      const mockResponse = {
        itemSummaries: [
          {
            itemId: '123',
            title: 'USD Item',
            price: { value: '100.00', currency: 'USD' },
            shippingOptions: [],
            itemWebUrl: 'https://ebay.com/item/123',
            localizedAspects: [],
          },
          {
            itemId: '456',
            title: 'EUR Item',
            price: { value: '100.00', currency: 'EUR' },
            shippingOptions: [],
            itemWebUrl: 'https://ebay.com/item/456',
            localizedAspects: [],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchEbay({ query: 'test' });

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].currency).toBe('USD');
    });

    it('should apply category filter', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ itemSummaries: [], total: 0 }),
      });

      await searchEbay({ query: 'watch', category_ids: '260324' });

      const fetchCall = (global.fetch as any).mock.calls[1];
      expect(fetchCall[0]).toContain('category_ids=260324');
    });

    it('should apply default fixed price filter', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ itemSummaries: [], total: 0 }),
      });

      await searchEbay({ query: 'test' });

      const fetchCall = (global.fetch as any).mock.calls[1];
      expect(fetchCall[0]).toContain('buyingOptions');
    });
  });

  describe('getEbayItemDetails', () => {
    it('should get item details successfully', async () => {
      const mockItem = {
        itemId: '123',
        title: 'Test Item',
        price: { value: '100.00' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem,
      });

      const result = await getEbayItemDetails('123');

      expect(result.itemId).toBe('123');
      expect(result.title).toBe('Test Item');
    });

    it('should handle errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(getEbayItemDetails('123')).rejects.toThrow();
    });
  });
});

