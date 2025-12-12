# Testing and UI Approach

## Current Status

We are following a **test-first approach** to ensure the API response format matches what the UI expects.

## 1. API Testing

### Unit Tests (`tests/app/api/chat/route.test.ts`)
- ✅ Tests API route with mocked dependencies
- ✅ Verifies response structure
- ✅ Tests error handling
- ✅ Tests MCP server initialization

### Integration Tests (`tests/app/api/chat/integration.test.ts`)
- 🔄 Tests actual API response format
- 🔄 Verifies streaming response structure
- 🔄 Checks for tool calls in responses
- **Note**: Requires dev server running on `localhost:3000`

### Running Tests

```bash
# Run all tests
npm test

# Run only API tests
npm test -- app/api/chat

# Run integration tests (requires dev server)
npm test -- app/api/chat/integration
```

## 2. API Response Format

The API returns a **streaming response** using Vercel AI SDK's `toDataStreamResponse()`:

```typescript
// Response format from API
result.toDataStreamResponse()

// The useChat hook from @ai-sdk/react automatically parses this into:
{
  messages: Message[],
  isLoading: boolean,
  error: Error | null
}

// Each Message has:
{
  id: string,
  role: 'user' | 'assistant',
  content: string,
  toolInvocations?: ToolInvocation[]
}
```

## 3. UI Components

### Main Components

1. **`app/page.tsx`** - Main chat interface
   - Uses `useChat` hook from `@ai-sdk/react`
   - Handles message state
   - Displays welcome screen or chat messages

2. **`components/chat/chat-messages.tsx`** - Message display
   - Renders user and assistant messages
   - Displays tool invocations and results
   - Shows loading states

3. **`components/chat/message-content.tsx`** - Message content
   - Renders markdown
   - Handles structured data (eBay results, etc.)

4. **`components/chat/debug-panel.tsx`** - Debug tool (dev only)
   - Shows message count and structure
   - Displays tool invocations
   - Helps diagnose UI issues

### Data Flow

```
API Response (Stream)
    ↓
useChat Hook (parses stream)
    ↓
messages state updated
    ↓
ChatMessages component renders
    ↓
MessageContent displays content
    ↓
ToolCallDisplay shows tool results
```

## 4. Debugging

### Debug Panel
- Click "🔍 Debug" button (bottom right, dev mode only)
- Shows:
  - Message count and structure
  - Tool invocations
  - Error messages
  - Raw message data

### Console Logging
- `[Home] Messages updated:` - When messages change
- `[ChatMessages] Rendering X messages` - When messages render
- `[ChatMessages] Message N:` - Individual message details
- `[Chat API]` - Server-side API logs

## 5. Testing the Full Flow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12)

3. **Send a message** via UI or sample prompt

4. **Check console logs:**
   - Should see `[Home] Messages updated:`
   - Should see `[ChatMessages] Rendering X messages`
   - Should see API logs in terminal

5. **Check Debug Panel:**
   - Click "🔍 Debug" button
   - Verify messages are being received
   - Check tool invocations if tools were called

## 6. Common Issues

### Messages Not Appearing
- Check browser console for errors
- Verify API is returning 200 status
- Check Debug Panel for message count
- Verify `useChat` hook is receiving stream

### Tool Results Not Showing
- Check `message.toolInvocations` array
- Verify tool result structure matches UI expectations
- Check `ToolCallDisplay` component logs

### Streaming Not Working
- Verify API returns `toDataStreamResponse()`
- Check network tab for streaming response
- Verify `useChat` hook configuration

## 7. Next Steps

1. ✅ Created integration tests
2. ✅ Added debug panel
3. ✅ Added console logging
4. 🔄 Test with actual API calls
5. 🔄 Verify UI displays all response types
6. 🔄 Test tool invocations display
7. 🔄 Test error handling in UI

