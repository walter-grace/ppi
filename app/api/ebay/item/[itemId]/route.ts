import { NextResponse } from 'next/server';
import { getEbayItemDetails } from '@/lib/ebay/api';

/**
 * Get full eBay item details including multiple images
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    
    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Clean item ID (remove v1| prefix if present)
    const cleanItemId = itemId.replace(/^v1\|/, '').split('|')[0];
    
    console.log(`📸 [eBay Item API] Fetching details for item: ${cleanItemId}`);
    
    const itemDetails = await getEbayItemDetails(cleanItemId);
    
    // Extract all images from the response
    const images: string[] = [];
    
    // Main image
    if (itemDetails.image?.imageUrl) {
      // Upgrade to high quality
      const highQualityUrl = itemDetails.image.imageUrl.replace(/s-l\d+/, 's-l1600');
      images.push(highQualityUrl);
    }
    
    // Additional images
    if (itemDetails.additionalImages && Array.isArray(itemDetails.additionalImages)) {
      itemDetails.additionalImages.forEach((img: any) => {
        if (img.imageUrl) {
          const highQualityUrl = img.imageUrl.replace(/s-l\d+/, 's-l1600');
          if (!images.includes(highQualityUrl)) {
            images.push(highQualityUrl);
          }
        }
      });
    }
    
    // Also check for images array
    if (itemDetails.images && Array.isArray(itemDetails.images)) {
      itemDetails.images.forEach((img: any) => {
        if (typeof img === 'string') {
          const highQualityUrl = img.replace(/s-l\d+/, 's-l1600');
          if (!images.includes(highQualityUrl)) {
            images.push(highQualityUrl);
          }
        } else if (img.imageUrl) {
          const highQualityUrl = img.imageUrl.replace(/s-l\d+/, 's-l1600');
          if (!images.includes(highQualityUrl)) {
            images.push(highQualityUrl);
          }
        }
      });
    }
    
    console.log(`✅ [eBay Item API] Found ${images.length} images for item ${cleanItemId}`);
    
    return NextResponse.json({
      success: true,
      item_id: cleanItemId,
      images,
      title: itemDetails.title,
      description: itemDetails.shortDescription || itemDetails.description,
    });
  } catch (error: any) {
    console.error(`❌ [eBay Item API] Error:`, error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch item details' 
      },
      { status: 500 }
    );
  }
}

