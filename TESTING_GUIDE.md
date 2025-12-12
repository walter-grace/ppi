# Testing Guide for Stream Parsing Fix

## What We Fixed

✅ **Updated `@ai-sdk/react` from 1.2.12 → 2.0.109**
- Version 1.x had issues parsing `toUIMessageStreamResponse()` streams
- Version 2.x has proper support for UI message stream format

## How to Test

### 1. Restart the Dev Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Test in Browser

1. **Open the app:**
   - Navigate to `http://localhost:3000`

2. **Open Browser DevTools:**
   - Press F12 or Right-click → Inspect
   - Go to Console tab

3. **Test with a simple query:**
   - Type: "Hello"
   - Should work without errors

4. **Test with eBay search (uses tools):**
   - Click: "Search eBay for Rolex Submariner watches"
   - Or type it manually
   - **Expected behavior:**
     - ✅ No "Invalid code data" error
     - ✅ Stream parses correctly
     - ✅ Messages appear in chat
     - ✅ Tool results display properly

### 3. Check Console Logs

**Success indicators:**
- ✅ No red error messages
- ✅ `[useChat] Response received` with status 200
- ✅ `[useChat] Message finished` appears
- ✅ `[ChatMessages] Rendering X messages` shows increasing count

**Failure indicators:**
- ❌ "Failed to parse stream string. Invalid code data"
- ❌ Red error messages in console
- ❌ Messages not appearing in UI

### 4. Verify Tool Results

When testing eBay search, you should see:
- ✅ Assistant message explaining the search
- ✅ Tool call indicator (🔧 search_ebay)
- ✅ Tool results showing eBay listings
- ✅ Formatted results with images, prices, etc.

## Test Scripts

### Run Stream Format Test
```bash
node scripts/test-stream-format.js
```

This verifies:
- ✅ Stream format is correct
- ✅ All events are properly formatted
- ✅ No code: lines that cause errors

### Run Browser Parsing Test
```bash
node scripts/test-browser-parsing.js
```

This simulates what `useChat` does to parse the stream.

## Troubleshooting

### If errors persist:

1. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Check package versions:**
   ```bash
   npm list @ai-sdk/react ai
   ```
   Should show:
   - `@ai-sdk/react@2.0.109`
   - `ai@5.0.108`

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

4. **Check network tab:**
   - Open DevTools → Network tab
   - Find `/api/chat` request
   - Check Response headers:
     - `Content-Type: text/event-stream` ✓
   - Preview should show stream data

## Expected Results

After the update, you should see:
- ✅ Streams parse correctly
- ✅ Messages display in chat
- ✅ Tool calls and results work
- ✅ No parsing errors in console
- ✅ Real-time streaming works smoothly

