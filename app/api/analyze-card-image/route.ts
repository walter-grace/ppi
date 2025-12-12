import { NextResponse } from 'next/server';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
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
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const imageUrl = formData.get('url') as string | null;

    if (!imageFile && !imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'No image file or URL provided',
      }, { status: 400 });
    }

    console.log('\n🃏 [Card Image Analysis] Starting analysis...');
    const startTime = Date.now();

    let imageData: string;

    if (imageUrl) {
      console.log(`   📸 Using image URL: ${imageUrl}`);
      imageData = imageUrl;
    } else {
      console.log(`   📸 Processing uploaded file: ${imageFile.name}`);
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = imageFile.type || 'image/jpeg';
      imageData = `data:${mimeType};base64,${base64Image}`;
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    console.log('   🤖 Analyzing image with Gemini 2.5 Flash...');
    
    const result = await generateObject({
      model: openrouter('google/gemini-2.5-flash-preview-09-2025'),
      schema: CardInfoSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: imageData,
            },
            {
              type: 'text',
              text: `Analyze this trading card image and extract detailed information. Look VERY carefully at:

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
- **Year Information**: May be on the card itself, packaging, or documentation in the image
- **Game/Type**: Identify if it's a TCG (Yu-Gi-Oh!, Pokémon, Magic) or sports card (Baseball, Basketball, Football)

Be EXTREMELY thorough. Certification numbers and grades are critical for accurate pricing. Edition type (1st Edition vs Unlimited) significantly affects value. If you cannot determine a specific value after careful examination, use null. Rate your confidence based on image clarity and completeness of visible information.`,
            },
          ],
        },
      ],
    });
    
    const duration = Date.now() - startTime;
    const cardInfo = result.object;
    console.log(`   ✅ Analysis completed in ${duration}ms`);
    console.log(`   Extracted info:`, cardInfo);
    
    // Format as a detailed text description for the LLM
    const analysisText = `Here's a detailed analysis of the trading card:

**Card Name:** ${cardInfo.card_name || 'Not visible in the image provided.'}

**Set Name:** ${cardInfo.set_name || 'Not visible in the image provided.'}

**Card Number:** ${cardInfo.card_number || 'Not visible in the image provided.'}

**Year:** ${cardInfo.year || 'Not visible in the image provided.'}

**Grade:** ${cardInfo.grade || 'Not graded or not visible'}

**Certification Number:** ${cardInfo.cert_number || 'Not visible in the image provided.'}

**Game/Type:** ${cardInfo.game || 'Not clearly visible'}

**Edition:** ${cardInfo.edition || 'Not clearly visible'}

**Rarity:** ${cardInfo.rarity || 'Not clearly visible'}

**Condition:** ${cardInfo.condition || 'Not clearly visible'}

**Additional Details:** ${cardInfo.description}

**Confidence Level:** ${cardInfo.confidence}

Overall, ${cardInfo.description}`;
    
    // Auto-detect item type based on analysis
    const detectedType = detectItemType(analysisText, cardInfo);
    
    return NextResponse.json({
      success: true,
      cardInfo: cardInfo,
      analysis: analysisText,
      duration: `${duration}ms`,
      detectedItemType: detectedType, // Auto-detected item type
      message: 'Card image analyzed successfully',
    });
  } catch (error: any) {
    console.error('❌ [Card Image Analysis] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process image',
      details: error.stack,
    }, { status: 500 });
  }
}

