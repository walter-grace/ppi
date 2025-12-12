# Next.js Frontend Migration Guide

This guide explains how to migrate from Streamlit to a Next.js frontend with streaming support, similar to the [Vercel AI SDK Python Streaming example](https://github.com/vercel-labs/ai-sdk-preview-python-streaming).

## Current Architecture

- **Frontend**: Streamlit (Python)
- **Backend**: Python (FastAPI/Flask) with `chatbot_mcp.py`
- **APIs**: eBay API, Watch Database API, OpenRouter

## Proposed Architecture

- **Frontend**: Next.js with React
- **Backend**: FastAPI (Python) with streaming support
- **APIs**: Same (eBay, Watch Database, OpenRouter)

## Benefits of Next.js Migration

1. **Better Image Display**: Native HTML/CSS/JS for images
2. **Streaming Support**: Real-time response streaming
3. **Better UI/UX**: Modern React components
4. **Performance**: Client-side rendering, better caching
5. **Mobile Responsive**: Better mobile experience

## Migration Steps

### 1. Create FastAPI Backend with Streaming

Create `api/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import asyncio
from chatbot_mcp import MCPChatbot

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chatbot = None

@app.on_event("startup")
async def startup():
    global chatbot
    chatbot = MCPChatbot()
    await chatbot.connect_to_watch_db_server()

@app.post("/api/chat")
async def chat_stream(request: dict):
    query = request.get("messages", [])[-1].get("content", "")
    
    async def generate():
        response = await chatbot.process_query(query)
        # Stream response as JSON
        yield f"data: {json.dumps({'content': response})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 2. Create Next.js Frontend

```bash
npx create-next-app@latest watch-arbitrage-frontend
cd watch-arbitrage-frontend
npm install ai @ai-sdk/openai
```

### 3. Create Chat Component

`app/page.tsx`:

```tsx
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-4">
            <div className="font-bold">{message.role}</div>
            <div>{message.content}</div>
            {/* Parse and display eBay results with images */}
            {message.content.includes('EBAY_RESULTS_START') && (
              <EbayResultsDisplay content={message.content} />
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about watches..."
          className="w-full p-2 border rounded"
        />
      </form>
    </div>
  );
}
```

### 4. Create eBay Results Component

`components/EbayResultsDisplay.tsx`:

```tsx
'use client';

import Image from 'next/image';

export function EbayResultsDisplay({ content }: { content: string }) {
  // Extract JSON from HTML comments
  const startIdx = content.indexOf('<!-- EBAY_RESULTS_START -->');
  const endIdx = content.indexOf('<!-- EBAY_RESULTS_END -->');
  
  if (startIdx === -1 || endIdx === -1) return null;
  
  const jsonStr = content.substring(
    startIdx + '<!-- EBAY_RESULTS_START -->'.length,
    endIdx
  ).trim();
  
  const data = JSON.parse(jsonStr);
  const items = data.items || [];
  
  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {items.map((item: any) => (
        <div key={item.item_id} className="border rounded-lg p-4">
          {item.image_url && (
            <Image
              src={item.image_url}
              alt={item.title}
              width={300}
              height={300}
              className="w-full h-auto rounded"
            />
          )}
          <h3 className="font-bold mt-2">{item.title}</h3>
          <p className="text-green-600 font-bold">${item.price_usd}</p>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View on eBay →
          </a>
        </div>
      ))}
    </div>
  );
}
```

## Quick Start (Alternative: Keep Streamlit, Improve Images)

If you prefer to keep Streamlit, the current fixes should work. The images are now displayed using HTML `<img>` tags directly, which should be more reliable.

## Testing

1. **Streamlit**: `streamlit run streamlit_chatbot.py`
2. **Next.js**: `npm run dev` (after migration)

## Notes

- The current Streamlit version should now display images correctly
- Next.js migration is optional but provides better UX
- Both approaches can coexist - use Streamlit for quick testing, Next.js for production

