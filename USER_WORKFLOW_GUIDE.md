# 🎯 User Workflow Guide - Complete Walkthrough

## 📱 From the User's Perspective

### **Step 1: User Opens the App**

**What the user sees:**
- Clean chat interface with a header "PSA MCP Chatbot"
- Empty chat area
- Text input box at the bottom: "Ask me about watches, eBay listings, or arbitrage opportunities..."
- Sample prompt buttons (optional shortcuts)

**What happens behind the scenes:**
- Next.js app loads on `localhost:3000`
- React components initialize
- `useChat` hook connects to `/api/chat` endpoint
- MCP servers are NOT connected yet (lazy initialization)

---

### **Step 2: User Types a Query**

**Example queries:**
- "Find PSA 10 Charizard cards on eBay"
- "Search eBay for Rolex Submariner watches"
- "Show me undervalued watches under $5000"

**What the user sees:**
- Text appears in the input box as they type
- Send button becomes enabled when text is entered
- Can press Enter or click Send

**What happens behind the scenes:**
- User input is stored in React state (`input` state)
- `handleInputChange` updates the state on each keystroke
- Form validation ensures input is not empty

---

### **Step 3: User Submits Query**

**What the user sees:**
- Input box clears immediately
- Their message appears in the chat as a user message bubble
- Loading indicator appears (spinner or "Thinking..." message)
- Chat area shows "Assistant is typing..."

**What happens behind the scenes:**

1. **Frontend (`app/page.tsx`):**
   ```typescript
   sendMessage({ text: userMessage })
   ```
   - Converts user input to `UIMessage` format (v2 API)
   - Sends POST request to `/api/chat`
   - Starts streaming response

2. **Backend (`app/api/chat/route.ts`):**
   - Receives POST request with `messages` array
   - Extracts user query from last message
   - Logs: `📨 [Chat API] New request received`

---

### **Step 4: Server Initializes MCP & Tools**

**What happens behind the scenes:**

1. **MCP Server Connection:**
   ```typescript
   await initializeMCPServers()
   ```
   - Connects to Watch Database MCP via RapidAPI
   - Establishes STDIO transport
   - Logs: `✅ Connected to Watch Database MCP`

2. **Tool Discovery:**
   - Lists available tools from Watch Database MCP (9 tools)
   - Creates eBay tool definitions (`search_ebay`, `analyze_watch_listing`)
   - Logs: `📦 [MCP] Watch Database: 9 tools available`
   - Logs: `🔧 Created 2 tools: search_ebay, analyze_watch_listing`

3. **Message Conversion:**
   - Converts `UIMessage[]` → `ModelMessage[]` for AI SDK
   - Logs: `✅ Converted to X ModelMessages`

---

### **Step 5: AI Analyzes Query & Decides to Use Tools**

**What happens behind the scenes:**

1. **OpenRouter API Call:**
   ```typescript
   streamText({
     model: openrouter('anthropic/claude-3.5-sonnet'),
     messages: modelMessages,
     tools: toolsObject,
   })
   ```
   - Sends conversation + available tools to Claude via OpenRouter
   - Claude analyzes: "Find PSA 10 Charizard cards on eBay"
   - Claude decides: "I need to use the `search_ebay` tool"

2. **Tool Selection:**
   - Claude sees `search_ebay` tool is available
   - Extracts parameters: `{ query: "PSA 10 Charizard", category: "183454" }`
   - Logs: `🔧 [Tool Call] search_ebay with args: {...}`

**What the user sees:**
- Still seeing loading indicator
- May see tool call indicator in UI (if implemented)

---

### **Step 6: eBay Search Executes**

**What happens behind the scenes:**

1. **eBay API Authentication:**
   ```typescript
   await searchEbay({ query, limit, category_ids })
   ```
   - Generates eBay OAuth token (if needed)
   - Logs: `🔑 [eBay API] Generating token...`
   - Logs: `✅ [eBay API] Token generated in Xms`

2. **eBay Browse API Call:**
   - Searches eBay for "PSA 10 Charizard" in category 183454 (trading cards)
   - Returns up to 20 listings
   - Logs: `🔍 [eBay API] Searching for: "PSA 10 Charizard"...`
   - Logs: `✅ [eBay API] Found 20 items in Xms`

3. **Data Processing:**
   - Extracts: title, price, shipping, images, condition, aspects
   - Upgrades image URLs from `s-l225` to `s-l1600` (high quality)
   - Maps items to standardized format
   - Logs: `📊 Sample item data: {...}`

**What the user sees:**
- Still loading (this takes 1-2 seconds)

---

### **Step 7: Automatic Arbitrage Analysis**

**What happens behind the scenes:**

1. **Item Type Detection:**
   ```typescript
   // Detects from category or query
   if (category === '183454') itemType = 'trading_card'
   if (category === '260324') itemType = 'watch'
   ```

2. **For Trading Cards:**
   ```typescript
   analyzeArbitrageOpportunities(items, 'trading_card')
   ```
   - Extracts PSA grade from title/aspects (e.g., "PSA 10")
   - Estimates market price using AI (Claude)
   - Compares listing price vs market price
   - Categorizes: undervalued / fair_value / overvalued

3. **For Watches:**
   ```typescript
   analyzeArbitrageOpportunities(items, 'watch')
   ```
   - Extracts brand/model from aspects
   - Queries Watch Database MCP for market prices
   - Compares listing price vs market price
   - Categorizes: undervalued / fair_value / overvalued

4. **Valuation Calculation:**
   - Calculates: `spread = market_price - (listing_price + shipping + tax)`
   - Determines status:
     - **Undervalued**: >10% below market (green)
     - **Fair Value**: within ±10% of market (blue)
     - **Overvalued**: >10% above market (red)

**What the user sees:**
- Still loading (arbitrage analysis adds 2-5 seconds)

---

### **Step 8: Results Stream Back to User**

**What happens behind the scenes:**

1. **Streaming Response:**
   ```typescript
   return result.toUIMessageStreamResponse()
   ```
   - AI SDK streams response back to frontend
   - Includes: AI text response + tool results
   - Format: `UIMessage` with `parts` array

2. **Frontend Receives Stream:**
   - `useChat` hook processes stream chunks
   - Updates `messages` state in real-time
   - Renders messages as they arrive

**What the user sees:**
- AI response text appears (streaming)
- Tool results appear below
- eBay results cards render with images

---

### **Step 9: User Sees Results**

**What the user sees:**

1. **Summary Header:**
   ```
   eBay Search Results for "PSA 10 Charizard"
   Showing 20 of 15,432 items found
   🎯 5 undervalued • ⚖️ 12 fair value • ⚠️ 3 overvalued
   ```

2. **Item Cards (Grid Layout):**
   - **Undervalued Items (Green):**
     - Green ring around card
     - Badge: "15.3% Below Market"
     - Green card showing:
       - "Undervalued - Good Deal!"
       - Market: $500.00
       - Potential Profit: $75.00
       - Risk: Low | Confidence: High
   
   - **Fair Value Items (Blue):**
     - Blue ring around card
     - Badge: "Fair Value"
     - Blue card showing:
       - "Fair Value - Market Price"
       - Market: $450.00
       - Spread: -2.1% from market
   
   - **Overvalued Items (Red):**
     - Red ring around card
     - Badge: "12.5% Above Market"
     - Red card showing:
       - "Overvalued - Above Market"
       - Market: $400.00
       - Overpriced by: $50.00

3. **Each Card Shows:**
   - High-quality image (upgraded from thumbnail)
   - Title
   - Price (listing + shipping)
   - Condition badge
   - "Details" button (expandable)
   - "View on eBay" link

4. **Details Section (when expanded):**
   - Item ID, Price breakdown
   - **Valuation Analysis:**
     - Status: 🎯 Undervalued / ⚖️ Fair Value / ⚠️ Overvalued
     - Listing Price vs Market Price
     - Spread percentage
     - Potential profit/loss
     - Risk level & Confidence
     - Price source (Watch Database / AI estimation)

---

### **Step 10: User Interacts with Results**

**User actions:**

1. **Click "Details" button:**
   - Expands to show full valuation breakdown
   - Shows raw data (JSON)

2. **Click "View on eBay" link:**
   - Opens eBay listing in new tab

3. **Click "View Data" button (top right):**
   - Shows raw API response
   - Sample item data
   - All items JSON

4. **Scroll through results:**
   - Grid layout (1-3 columns based on screen size)
   - Lazy-loaded images

---

## 🔄 Complete Flow Diagram

```
User Types Query
    ↓
Frontend: sendMessage({ text })
    ↓
POST /api/chat
    ↓
Backend: Initialize MCP Servers
    ↓
Backend: Convert UIMessage[] → ModelMessage[]
    ↓
Backend: Call OpenRouter (Claude)
    ↓
Claude: Analyzes query → Decides to use search_ebay tool
    ↓
Backend: Execute search_ebay tool
    ↓
eBay API: Search listings
    ↓
Backend: Process results (extract data, upgrade images)
    ↓
Backend: Analyze arbitrage (automatic)
    ├─ Cards: Extract PSA grade → AI price estimate
    └─ Watches: Query Watch Database MCP → Market price
    ↓
Backend: Categorize items (undervalued/fair/overvalued)
    ↓
Backend: Stream response back (toUIMessageStreamResponse)
    ↓
Frontend: Receive stream → Update UI
    ↓
User: Sees results with color-coded valuation badges
```

---

## 🎨 Visual Indicators Summary

### **Color Coding:**
- 🟢 **Green** = Undervalued (Good Deal) - Buy these!
- 🔵 **Blue** = Fair Value (Market Price) - Reasonable
- 🔴 **Red** = Overvalued (Above Market) - Avoid these

### **Badges:**
- **Image Badge:** Shows percentage difference from market
- **Valuation Card:** Full breakdown with profit/loss
- **Summary:** Count of each category at top

### **Information Displayed:**
- Listing price vs Market price
- Potential profit (for undervalued)
- Overpriced amount (for overvalued)
- Risk level (low/medium/high)
- Confidence (high/medium/low)
- Price source (where data came from)

---

## 💡 Key Features from User Perspective

1. **Natural Language Queries:**
   - Just type what you want: "Find PSA 10 Charizard cards"
   - No need to know eBay categories or API details

2. **Automatic Analysis:**
   - No need to click "Analyze" button
   - Valuation happens automatically after search

3. **Visual Clarity:**
   - Color coding makes it obvious what's a good deal
   - Badges show key metrics at a glance

4. **Full Transparency:**
   - "Details" button shows complete breakdown
   - "View Data" shows raw API response
   - Price source is always shown

5. **Real-time Streaming:**
   - Results appear as they're processed
   - No waiting for full response

---

## 🚀 Example User Journey

**User:** "Find me undervalued Rolex watches under $10,000"

1. User types query → Sends
2. AI calls `search_ebay` with query "Rolex" category "260324"
3. eBay returns 20 Rolex listings
4. System analyzes each:
   - Extracts brand/model
   - Queries Watch Database for market prices
   - Calculates spread
   - Categorizes each item
5. Results show:
   - 3 undervalued (green) - highlighted as good deals
   - 12 fair value (blue) - reasonable prices
   - 5 overvalued (red) - avoid these
6. User clicks on green item → Sees "$1,200 potential profit"
7. User clicks "View on eBay" → Buys the watch!

---

## 🔧 Technical Stack (Behind the Scenes)

- **Frontend:** Next.js 16, React, TypeScript, shadcn/ui
- **AI:** OpenRouter + Claude 3.5 Sonnet
- **Streaming:** Vercel AI SDK v5
- **MCP:** Watch Database MCP (via RapidAPI)
- **eBay:** eBay Browse API (OAuth)
- **Arbitrage:** Custom analysis engine

---

This workflow gives users a complete picture: what's a good deal, what's fair, and what to avoid - all automatically calculated and visually displayed!

