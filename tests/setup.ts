import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.WATCH_DATABASE_API_KEY = 'test-watch-db-key';
process.env.EBAY_CLIENT_ID = 'test-ebay-client-id';
process.env.EBAY_CLIENT_SECRET = 'test-ebay-client-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch globally
global.fetch = vi.fn();

