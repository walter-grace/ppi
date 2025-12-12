# Testing Guide

This directory contains comprehensive tests for the Next.js MCP Chatbot application.

## Test Structure

```
tests/
├── setup.ts                    # Test setup and mocks
├── lib/
│   ├── utils.test.ts           # Utility function tests
│   ├── streaming/
│   │   └── stream-parser.test.ts
│   ├── ebay/
│   │   ├── api.test.ts
│   │   └── tools.test.ts
│   └── mcp/
│       ├── client.test.ts
│       └── nextjs-devtools.test.ts
├── hooks/
│   └── use-mcp-stream.test.tsx
├── components/
│   ├── ui/
│   │   └── button.test.tsx
│   └── chat/
│       └── chat-input.test.tsx
└── app/
    └── api/
        └── chat/
            └── route.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Coverage

Tests cover:

- **Utilities**: Class name merging, utility functions
- **Streaming**: Stream parsing, event extraction
- **eBay API**: Search, item details, error handling
- **eBay Tools**: Tool execution, parameter handling
- **MCP Client**: Connection, tool calls, error handling
- **Next.js DevTools**: Error fetching, logs, metadata
- **React Hooks**: MCP stream tracking
- **UI Components**: Button, ChatInput interactions
- **API Routes**: Chat endpoint, MCP integration

## Writing New Tests

1. Create test file next to source file: `source.ts` → `source.test.ts`
2. Import testing utilities from `vitest`
3. Use `describe` blocks to group related tests
4. Use `it` or `test` for individual test cases
5. Mock external dependencies with `vi.mock()`

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/my-module';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

## Mocking

- **MCP SDK**: Mocked in `tests/setup.ts`
- **Next.js Router**: Mocked in `tests/setup.ts`
- **Fetch API**: Mocked per test file
- **Environment Variables**: Set in `tests/setup.ts`

## Continuous Integration

Tests should pass before merging:
- All unit tests pass
- Coverage above 80%
- No linting errors

