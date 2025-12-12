# UX Brainstorm: Watch vs Card Selection

## Current State
- Image/Video upload buttons exist in ChatInput
- Currently hardcoded to analyze watches
- Need to add card analysis capability

## Option 1: Toggle/Tabs (Recommended ⭐)
**Visual:** Two toggle buttons or tabs above the input area

```
┌─────────────────────────────────────┐
│  [Watch] [Card]  ← Toggle buttons   │
│                                     │
│  [Text input area...]               │
│  [📷] [🎥] [🔗]  [Send]             │
└─────────────────────────────────────┘
```

**Pros:**
- Always visible, clear intent
- Quick to switch between types
- Clean, modern UI
- No extra clicks after file selection

**Cons:**
- Takes up a bit of space
- Need to remember to set it before upload

**Implementation:**
- Add state: `const [itemType, setItemType] = useState<'watch' | 'card'>('watch')`
- Show toggle buttons above textarea
- Route to correct endpoint based on type

---

## Option 2: Dropdown After Selection
**Visual:** After selecting file, show a dropdown to choose type

```
┌─────────────────────────────────────┐
│  [Text input area...]               │
│  [📷] [🎥] [🔗]  [Send]             │
│                                     │
│  [Image preview]                    │
│  Analyze as: [Watch ▼]  [Analyze]  │
└─────────────────────────────────────┘
```

**Pros:**
- Less cluttered main UI
- Contextual - only shows when needed
- Can default to most common type

**Cons:**
- Extra step after file selection
- Might be forgotten
- Less discoverable

**Implementation:**
- Show dropdown when file is selected
- Default to 'watch' but allow change
- Update button text: "Analyze Watch" vs "Analyze Card"

---

## Option 3: Tag Chips/Badges (Modern ⭐)
**Visual:** Clickable badge chips that highlight when selected

```
┌─────────────────────────────────────┐
│  🕐 Watch  🃏 Card  ← Clickable tags │
│                                     │
│  [Text input area...]               │
│  [📷] [🎥] [🔗]  [Send]             │
└─────────────────────────────────────┘
```

**Pros:**
- Very modern, visual design
- Can add icons (watch icon, card icon)
- Clear visual feedback
- Feels like tagging

**Cons:**
- Might be less obvious than buttons
- Need good icons

**Implementation:**
- Use Badge component with onClick
- Add icons from lucide-react (Clock, CreditCard, etc.)
- Highlight selected badge

---

## Option 4: Separate Upload Buttons
**Visual:** Two distinct buttons for each type

```
┌─────────────────────────────────────┐
│  [Text input area...]               │
│  [📷 Watch] [🃏 Card] [🎥 Video]    │
│  [Send]                             │
└─────────────────────────────────────┘
```

**Pros:**
- Very explicit
- No confusion about what will happen
- Can have different icons/colors

**Cons:**
- More buttons = more clutter
- Duplicates functionality
- Takes more space

**Implementation:**
- Separate buttons for watch/card image upload
- Keep video button generic (or split it too)

---

## Option 5: Auto-Detect with Override
**Visual:** Try to detect, show confirmation if ambiguous

```
┌─────────────────────────────────────┐
│  [Text input area...]               │
│  [📷] [🎥] [🔗]  [Send]             │
│                                     │
│  [Image preview]                    │
│  Detected: Watch (change?)           │
│  [Analyze as Watch] [Change to Card]│
└─────────────────────────────────────┘
```

**Pros:**
- Smart, reduces user effort
- Can learn from user corrections
- Feels intelligent

**Cons:**
- Requires AI detection (extra API call)
- Might be slow
- Could be wrong

**Implementation:**
- Quick AI check on upload
- Show detected type with option to change
- Cache results for similar images

---

## Option 6: Context Menu / Long Press
**Visual:** Right-click or long-press to choose type

**Pros:**
- Keeps UI clean
- Power user friendly

**Cons:**
- Not discoverable
- Mobile unfriendly
- Hidden functionality

**Not Recommended** - Too hidden

---

## Recommendation: Hybrid Approach

**Combine Option 1 (Toggle) + Option 2 (Dropdown)**

1. **Default state:** Show toggle buttons (Watch/Card) - always visible
2. **After file selection:** Show dropdown that matches current toggle
3. **Allow override:** User can change in dropdown even if toggle is set

This gives:
- ✅ Clear default (toggle)
- ✅ Easy override (dropdown)
- ✅ Best of both worlds

---

## Visual Mockup of Recommended Design

```
┌─────────────────────────────────────────────┐
│  Item Type: [🕐 Watch] [🃏 Card]            │
│  ─────────────────────────────────────────  │
│  [Text input area...]                        │
│  [📷] [🎥] [🔗]                              │
│                                              │
│  [Image preview thumbnail]                   │
│  Analyze as: [Watch ▼]  [Analyze Watch]    │
└─────────────────────────────────────────────┘
```

**Key Features:**
- Toggle buttons at top (persistent)
- Dropdown appears when file selected (matches toggle)
- Button text changes: "Analyze Watch" vs "Analyze Card"
- Icons make it visual and clear

---

## Implementation Priority

1. **Phase 1:** Simple toggle buttons (Option 1)
   - Fastest to implement
   - Clear UX
   - Can enhance later

2. **Phase 2:** Add dropdown override (Option 2)
   - More flexibility
   - Better for power users

3. **Phase 3:** Add icons and polish (Option 3 style)
   - Visual improvements
   - Better branding

---

## Code Structure

```typescript
// State
const [itemType, setItemType] = useState<'watch' | 'card'>('watch');

// Handlers
const handleImageUpload = async (file: File) => {
  const endpoint = itemType === 'watch' 
    ? '/api/analyze-watch-image' 
    : '/api/analyze-card-image';
  // ... rest of logic
};

// UI
<ToggleGroup value={itemType} onValueChange={setItemType}>
  <Toggle value="watch">🕐 Watch</Toggle>
  <Toggle value="card">🃏 Card</Toggle>
</ToggleGroup>
```

---

## Questions to Consider

1. **Default type?** Watch (current) or Card?
2. **Remember preference?** Save to localStorage?
3. **Icons?** Use lucide-react icons (Clock, CreditCard, etc.)
4. **Mobile?** How does it look on small screens?
5. **Accessibility?** Screen reader labels, keyboard navigation

