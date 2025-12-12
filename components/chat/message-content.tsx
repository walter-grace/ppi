'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  // Handle empty or null content
  if (!content) {
    return <div className="text-muted-foreground italic">No content</div>;
  }

  // Check if content contains structured data markers
  const ebayResultsMatch = content.match(/<!-- EBAY_RESULTS_START -->([\s\S]*?)<!-- EBAY_RESULTS_END -->/);
  
  if (ebayResultsMatch) {
    try {
      const ebayData = JSON.parse(ebayResultsMatch[1].trim());
      const textContent = content.replace(/<!-- EBAY_RESULTS_START -->[\s\S]*?<!-- EBAY_RESULTS_END -->/, '').trim();
      
      return (
        <div className="space-y-4">
          {textContent && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {textContent}
              </ReactMarkdown>
            </div>
          )}
          {ebayData.items && ebayData.items.length > 0 && (
            <EbayResultsDisplay data={ebayData} />
          )}
        </div>
      );
    } catch (error) {
      // If parsing fails, just render as markdown
    }
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function EbayResultsDisplay({ data }: { data: any }) {
  const items = data.items || [];
  
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">
        Found {data.count} item{data.count !== 1 ? 's' : ''} on eBay
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item: any) => (
          <div
            key={item.item_id}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4 space-y-2">
              <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-green-600">
                  ${item.total_cost_usd?.toFixed(2) || item.price_usd?.toFixed(2)}
                </span>
                {item.shipping_usd > 0 && (
                  <span className="text-xs text-muted-foreground">
                    + ${item.shipping_usd.toFixed(2)} shipping
                  </span>
                )}
              </div>
              {item.condition && (
                <div className="text-xs text-muted-foreground">
                  Condition: {item.condition}
                </div>
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline inline-block"
              >
                View on eBay →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

