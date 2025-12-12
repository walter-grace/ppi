import { NextResponse } from 'next/server';
import { z } from 'zod';
import { detectItemType } from '@/lib/item-types/config';

// Schema for extracted trading card information
const CardInfoSchema = z.object({
  card_name: z.string().nullable().describe('Full card name (e.g., "Blue-Eyes White Dragon", "Charizard", "Michael Jordan Rookie")'),
  set_name: z.string().nullable().describe('Card set name (e.g., "Legend of Blue Eyes White Dragon", "Base Set", "1986 Fleer")'),
  card_number: z.string().nullable().describe('Card number in the set (e.g., "001", "4", "57")'),
  year: z.string().nullable().describe('Year the card was printed (e.g., "1999", "2002", "1986")'),
  grade: z.string().nullable().describe('PSA grade if visible (e.g., "PSA 10", "PSA 9", "BGS 9.5")'),
  cert_number: z.string().nullable().describe('PSA/BGS certification number if visible (e.g., "12345678")'),
  game: z.string().nullable().describe('Trading card game (e.g., "Yu-Gi-Oh!", "Pokémon", "Sports", "Magic: The Gathering")'),
  edition: z.string().nullable().describe('Edition type (e.g., "1st Edition", "Unlimited", "Limited Edition")'),
  rarity: z.string().nullable().describe('Card rarity (e.g., "Ultra Rare", "Secret Rare", "Holo", "Common")'),
  condition: z.string().nullable().describe('Card condition if not graded (e.g., "Near Mint", "Mint", "Lightly Played")'),
  description: z.string().describe('Detailed description of the card including all visible text, artwork details, and distinguishing characteristics'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level in the extracted information'),
});

export async function POST(req: Request) {
  const formData = await req.formData();
  let videoUrl: string | null = null;

  try {
    videoUrl = formData.get('url') as string | null;

    if (!videoUrl) {
      return NextResponse.json({
        success: false,
        error: 'No video URL provided',
      }, { status: 400 });
    }

    console.log('\n🃏 [Card Video Analysis] Starting analysis...');
    
    // For YouTube/Instagram URLs, use Gemini's native video_url support
    if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('instagram.com'))) {
      console.log('   ✅ Using Gemini native video_url support (no download needed)');
      
      const openrouterKey = process.env.OPENROUTER_API_KEY;
      if (!openrouterKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      console.log('   🤖 Analyzing video directly with Gemini 2.5 Flash (native video support)...');
      
      // Use raw OpenRouter API format for video_url
      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'PSA Card Analysis',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-preview-09-2025',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'video_url',
                  video_url: {
                    url: videoUrl,
                  },
                },
                {
                  type: 'text',
                  text: `Analyze this trading card video and extract detailed information for ALL cards shown. The video may contain one or multiple cards.

IMPORTANT: If the video shows multiple different cards, return an ARRAY of card objects. If it shows only one card, return a single object.

For EACH card, extract:

1. **Card Name**: The full name of the card (e.g., "Blue-Eyes White Dragon", "Charizard", "Michael Jordan")
2. **Set Name**: The name of the card set or series (e.g., "Legend of Blue Eyes White Dragon", "Base Set", "1986 Fleer")
3. **Card Number**: The number of the card within the set (often shown as "#001", "#4", etc.)
4. **Year**: The year the card was printed (often shown on the card or packaging)
5. **Grade**: If the card is graded, look for PSA/BGS grade labels (e.g., "PSA 10", "BGS 9.5", "PSA 9")
6. **Certification Number**: If graded, look for the certification number (usually 8 digits, e.g., "12345678")
7. **Game**: The trading card game (e.g., "Yu-Gi-Oh!", "Pokémon", "Sports", "Magic: The Gathering", "Baseball", "Basketball")
8. **Edition**: Look for edition markers like "1st Edition", "Unlimited", "Limited Edition", "First Edition"
9. **Rarity**: Card rarity symbols or text (e.g., "Ultra Rare", "Secret Rare", "Holo", "Common", "Rare")
10. **Condition**: If not graded, assess condition (e.g., "Near Mint", "Mint", "Lightly Played")

IMPORTANT DETAILS TO LOOK FOR:
- **PSA/BGS Labels**: Look for grading company labels (PSA, BGS, CGC, SGC) and the grade number
- **Certification Numbers**: Usually 8-digit numbers on grading labels (e.g., "12345678")
- **1st Edition Stamps**: Look for "1st Edition" or "First Edition" stamps/marks on the card
- **Set Symbols**: Look for set symbols, logos, or identifiers
- **Card Numbers**: Often shown as "#001" or similar format
- **Year Information**: May be on the card itself, packaging, or documentation in the video
- **Game/Type**: Identify if it's a TCG (Yu-Gi-Oh!, Pokémon, Magic) or sports card (Baseball, Basketball, Football)

Be EXTREMELY thorough. Certification numbers and grades are critical for accurate pricing. Edition type (1st Edition vs Unlimited) significantly affects value. If you cannot determine a specific value after careful examination, use null. Rate your confidence based on video clarity and completeness of visible information.

Return as JSON: If multiple cards, return an array of objects. If single card, return a single object. Each object should have: card_name, set_name, card_number, year, grade, cert_number, game, edition, rarity, condition, description, and confidence (high/medium/low).`,
                },
              ],
            },
          ],
          response_format: {
            type: 'json_object',
          },
        }),
      });

      if (!openrouterResponse.ok) {
        const errorText = await openrouterResponse.text();
        throw new Error(`OpenRouter API error: ${openrouterResponse.status} - ${errorText}`);
      }

      const openrouterData = await openrouterResponse.json();
      const responseText = openrouterData.choices?.[0]?.message?.content || '';
      
      // Parse the JSON response
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        // If not JSON, try to extract JSON from text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse JSON from response');
        }
      }

      // Handle array response (multiple cards) or single object
      const allCards = Array.isArray(parsedData) ? parsedData : [parsedData];
      console.log(`   ℹ️  Video contains ${allCards.length} card(s)`);

      // Map all cards to our schema format
      const mappedCards = allCards.map((cardData: any, index: number) => ({
        card_name: cardData.card_name || null,
        set_name: cardData.set_name || null,
        card_number: cardData.card_number || null,
        year: cardData.year || null,
        grade: cardData.grade || null,
        cert_number: cardData.cert_number || null,
        game: cardData.game || null,
        edition: cardData.edition || null,
        rarity: cardData.rarity || null,
        condition: cardData.condition || null,
        description: cardData.description || 'No description provided',
        confidence: (cardData.confidence === 'high' || cardData.confidence === 'medium' || cardData.confidence === 'low')                               
          ? cardData.confidence 
          : (typeof cardData.confidence === 'number' && cardData.confidence >= 0.8 ? 'high' :                                                           
             typeof cardData.confidence === 'number' && cardData.confidence >= 0.5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      }));

      // Use the first card as primary (for backward compatibility)
      const primaryCard = mappedCards[0];
      
      // Format as detailed text description
      let analysisText = '';
      if (allCards.length > 1) {
        analysisText = `The video contains ${allCards.length} different cards:\n\n`;
        mappedCards.forEach((card, idx) => {
          analysisText += `**Card ${idx + 1}:**\n`;
          analysisText += `- **Card Name:** ${card.card_name || 'Unknown'}\n`;
          analysisText += `- **Set:** ${card.set_name || 'Unknown'}\n`;
          analysisText += `- **Grade:** ${card.grade || 'Not graded'}\n`;
          analysisText += `- **Cert Number:** ${card.cert_number || 'Unknown'}\n`;
          analysisText += `- **Edition:** ${card.edition || 'Unknown'}\n`;
          analysisText += `- **Description:** ${card.description}\n\n`;
        });
        analysisText += `\n**Primary Card (for search):** ${primaryCard.card_name} ${primaryCard.set_name || ''} ${primaryCard.grade || ''}`;
      } else {
        analysisText = `Here's a detailed analysis of the card from the video:

**Card Name:** ${primaryCard.card_name || 'Not visible in the video.'}

**Set Name:** ${primaryCard.set_name || 'Not visible in the video.'}

**Card Number:** ${primaryCard.card_number || 'Not visible in the video.'}

**Year:** ${primaryCard.year || 'Not visible in the video.'}

**Grade:** ${primaryCard.grade || 'Not graded or not visible'}

**Certification Number:** ${primaryCard.cert_number || 'Not visible in the video.'}

**Game/Type:** ${primaryCard.game || 'Not clearly visible'}

**Edition:** ${primaryCard.edition || 'Not clearly visible'}

**Rarity:** ${primaryCard.rarity || 'Not clearly visible'}

**Condition:** ${primaryCard.condition || 'Not clearly visible'}

**Additional Details:** ${primaryCard.description}

**Confidence Level:** ${primaryCard.confidence}

Overall, ${primaryCard.description}`;
      }

      // Auto-detect item type based on analysis
      const detectedType = detectItemType(analysisText, primaryCard);
      
      return NextResponse.json({
        success: true,
        cardInfo: primaryCard, // Primary card for backward compatibility
        allCards: mappedCards, // All cards found
        cardCount: allCards.length,
        analysis: analysisText,
        framesAnalyzed: 0, // Direct video analysis, no frames extracted
        detectedItemType: detectedType, // Auto-detected item type
        message: allCards.length > 1 
          ? `Video analyzed successfully - found ${allCards.length} cards` 
          : 'Card video analyzed successfully (direct video analysis)',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Only YouTube and Instagram video URLs are currently supported',
    }, { status: 400 });
  } catch (error: any) {
    console.error('❌ [Card Video Analysis] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process video',
      details: error.stack,
    }, { status: 500 });
  }
}

