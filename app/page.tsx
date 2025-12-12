'use client';

import React from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';
import { SamplePrompts } from '@/components/chat/sample-prompts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MessageSquare, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { EbayResults } from '@/components/mcp-results/ebay-results';
import { ErrorPanel } from '@/components/devtools/error-panel';
import { DebugPanel } from '@/components/chat/debug-panel';

export default function Home() {
  const chatHook = useChat({
    // In v2, use transport with DefaultChatTransport to configure the API endpoint
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (error) => {
      console.error('[useChat] onError callback:', error);
      console.error('[useChat] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: (error as any).cause,
      });
    },
    // Note: onResponse callback removed in v2 - use onData or onFinish instead
    onFinish: ({ message, messages, isAbort, isDisconnect, isError }) => {
      console.log('[useChat] Message finished:', {
        messageId: message.id,
        role: message.role,
        totalMessages: messages.length,
        isAbort,
        isDisconnect,
        isError,
      });
    },
  });

  // In v2, useChat returns: messages, sendMessage, status, error, etc.
  // We need to manage input state ourselves
  const {
    messages = [],
    sendMessage,
    status,
    error,
  } = chatHook;

  // Manage input state locally (v2 doesn't provide input/handleInputChange)
  const [input, setInput] = React.useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || status !== 'ready') return;
    
    const userMessage = input.trim();
    setInput(''); // Clear input
    sendMessage({ role: 'user', parts: [{ type: 'text', text: userMessage }] }); // v2 uses parts array
  };

  const handlePromptSelect = (prompt: string) => {
    console.log('[Home] Prompt selected:', prompt);
    setInput(''); // Clear any existing input
    sendMessage({ role: 'user', parts: [{ type: 'text', text: prompt }] }); // v2 uses parts array
  };

  const handleImageUpload = async (imageFile: File, itemType: 'watch' | 'card' = 'watch') => {
    console.log(`[Home] ${itemType} image uploaded:`, imageFile.name);
    
    try {
      // Analyze the image - try both endpoints to auto-detect
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // Try the selected endpoint first, but also check for auto-detection
      const endpoint = itemType === 'watch' 
        ? '/api/analyze-watch-image' 
        : '/api/analyze-card-image';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      // Use auto-detected type if available, otherwise use selected type
      const detectedType = result.detectedItemType || itemType;
      console.log(`[Home] Detected item type: ${detectedType} (selected: ${itemType})`);
      
      // If auto-detection suggests a different type, we could switch endpoints
      // For now, process with the detected type
      if (detectedType === 'watch' || itemType === 'watch') {
        await processWatchAnalysis(result);
      } else {
        await processCardAnalysis(result);
      }
    } catch (error) {
      console.error(`[Home] Error analyzing ${itemType} image:`, error);
      sendMessage({ 
        role: 'assistant', 
        parts: [{ type: 'text', text: `An unexpected error occurred during ${itemType} image analysis: ${error instanceof Error ? error.message : 'Unknown error'}` }] 
      });
    }
  };

  const handleVideoUpload = async (videoFile: File, itemType: 'watch' | 'card' = 'watch') => {
    console.log(`[Home] ${itemType} video uploaded:`, videoFile.name);
    
    try {
      // Analyze the video
      const formData = new FormData();
      formData.append('video', videoFile);
      
      const endpoint = itemType === 'watch' 
        ? '/api/analyze-watch-video' 
        : '/api/analyze-card-video';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      // Use auto-detected type if available, otherwise use selected type
      const detectedType = result.detectedItemType || itemType;
      console.log(`[Home] Detected item type: ${detectedType} (selected: ${itemType})`);
      
      if (detectedType === 'watch' || itemType === 'watch') {
        await processWatchAnalysis(result);
      } else {
        await processCardAnalysis(result);
      }
    } catch (error) {
      console.error(`[Home] Error analyzing ${itemType} video:`, error);
      sendMessage({ 
        role: 'assistant', 
        parts: [{ type: 'text', text: `An unexpected error occurred during ${itemType} video analysis: ${error instanceof Error ? error.message : 'Unknown error'}` }] 
      });
    }
  };

  const handleVideoUrl = async (url: string, itemType: 'watch' | 'card' = 'watch') => {
    console.log(`[Home] ${itemType} video URL provided:`, url);
    
    try {
      // Analyze the video from URL
      const formData = new FormData();
      formData.append('url', url);
      
      const endpoint = itemType === 'watch' 
        ? '/api/analyze-watch-video' 
        : '/api/analyze-card-video';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      // Use auto-detected type if available, otherwise use selected type
      const detectedType = result.detectedItemType || itemType;
      console.log(`[Home] Detected item type: ${detectedType} (selected: ${itemType})`);
      
      if (detectedType === 'watch' || itemType === 'watch') {
        await processWatchAnalysis(result);
      } else {
        await processCardAnalysis(result);
      }
    } catch (error) {
      console.error(`[Home] Error analyzing ${itemType} video URL:`, error);
      sendMessage({ 
        role: 'assistant', 
        parts: [{ type: 'text', text: `An unexpected error occurred during ${itemType} video URL analysis: ${error instanceof Error ? error.message : 'Unknown error'}` }] 
      });
    }
  };

  const processWatchAnalysis = async (result: any) => {
    if (!result.success) {
      sendMessage({ 
        role: 'assistant', 
        parts: [{ type: 'text', text: `Sorry, I couldn't analyze the watch. Error: ${result.error || 'Unknown error'}` }] 
      });
      return;
    }
      
    if (result.watchInfo) {
      const watchInfo = result.watchInfo;
      console.log('[Home] Watch info extracted:', watchInfo);
      
      // Build a comprehensive, detailed search query from structured info
      const queryParts: string[] = [];
      
      // Start with brand and model (most important)
      // Check if model includes nickname (e.g., "GMT-Master II \"Batgirl\"")
      let modelText = watchInfo.model || '';
      if (modelText.includes('"') || modelText.includes("'")) {
        // Extract nickname if present (e.g., "Batgirl", "Pepsi", "Sprite")
        const nicknameMatch = modelText.match(/["']([^"']+)["']/);
        if (nicknameMatch) {
          queryParts.push(nicknameMatch[1]); // Add nickname first (e.g., "Batgirl")
        }
        // Clean model name (remove quotes and nickname)
        modelText = modelText.replace(/["'].*?["']/g, '').trim();
      }
      
      if (watchInfo.brand && modelText) {
        queryParts.push(`${watchInfo.brand} ${modelText}`);
      } else if (watchInfo.brand) {
        queryParts.push(watchInfo.brand);
      }
      
      // Add reference number (very specific identifier)
      if (watchInfo.reference_number && 
          watchInfo.reference_number !== 'Not visible in the image provided.' &&
          watchInfo.reference_number !== 'Not visible in the video.') {
        queryParts.push(watchInfo.reference_number);
      }
      
      // Add dial color (important distinguishing feature)
      if (watchInfo.dial_color && watchInfo.dial_color !== 'Not clearly visible') {
        queryParts.push(watchInfo.dial_color);
      }
      
      // Add bezel type (helps narrow down specific models)
      // Simplify long bezel descriptions for better search results
      if (watchInfo.bezel_type && watchInfo.bezel_type !== 'Not clearly visible') {
        let bezelType = watchInfo.bezel_type;
        // Simplify common bezel descriptions
        if (bezelType.toLowerCase().includes('fluted')) {
          queryParts.push('fluted');
        } else if (bezelType.toLowerCase().includes('ceramic')) {
          // Extract color from ceramic bezel descriptions - be more specific
          if (bezelType.toLowerCase().includes('blue') && bezelType.toLowerCase().includes('black')) {
            queryParts.push('blue black bezel');
          } else if (bezelType.toLowerCase().includes('red') && bezelType.toLowerCase().includes('blue')) {
            queryParts.push('pepsi bezel');
          } else if (bezelType.toLowerCase().includes('green') && bezelType.toLowerCase().includes('black')) {
            queryParts.push('green black bezel');
          } else if (bezelType.toLowerCase().includes('gray') || bezelType.toLowerCase().includes('grey')) {
            queryParts.push('gray black bezel');
          } else {
            queryParts.push('ceramic bezel');
          }
        } else if (bezelType.toLowerCase().includes('smooth')) {
          queryParts.push('smooth bezel');
        } else if (bezelType.length < 30) {
          // Only add if it's short enough
          queryParts.push(bezelType);
        }
      }
      
      // Add bracelet type (important distinguishing feature, especially Jubilee vs Oyster)
      if (watchInfo.bracelet_type && watchInfo.bracelet_type !== 'Not clearly visible') {
        const braceletLower = watchInfo.bracelet_type.toLowerCase();
        // Always include Jubilee (very specific), President, or non-Oyster bracelets
        if (braceletLower.includes('jubilee') || 
            braceletLower.includes('president') ||
            braceletLower.includes('leather') ||
            braceletLower.includes('rubber') ||
            braceletLower.includes('nato')) {
          queryParts.push(watchInfo.bracelet_type);
        }
        // For Oyster, only include if we don't have many other details
        else if (braceletLower.includes('oyster') && queryParts.length < 3) {
          queryParts.push('Oyster');
        }
      }
      
      // Add size
      if (watchInfo.size && 
          watchInfo.size !== 'Not specified in the image.' &&
          watchInfo.size !== 'Not specified in the video.') {
        queryParts.push(watchInfo.size);
      }
      
      // Add materials if it's a distinguishing feature (e.g., two-tone, gold)
      if (watchInfo.materials && 
          watchInfo.materials !== 'Not clearly visible' && 
          watchInfo.materials !== 'Stainless Steel' && // Skip generic stainless steel
          (watchInfo.materials.toLowerCase().includes('gold') || 
           watchInfo.materials.toLowerCase().includes('titanium') ||
           watchInfo.materials.toLowerCase().includes('platinum'))) {
        // Extract key material terms
        if (watchInfo.materials.toLowerCase().includes('white gold')) {
          queryParts.push('white gold');
        } else if (watchInfo.materials.toLowerCase().includes('yellow gold')) {
          queryParts.push('yellow gold');
        } else if (watchInfo.materials.toLowerCase().includes('rose gold')) {
          queryParts.push('rose gold');
        } else if (watchInfo.materials.toLowerCase().includes('two-tone')) {
          queryParts.push('two-tone');
        }
      }
      
      // Build final query
      let searchQuery = queryParts.join(' ').trim();
      
      // Fallback if query is empty
      if (!searchQuery) {
        searchQuery = watchInfo.description || 'watch';
      }
      
      // Use the structured analysis text
      const analysisText = result.analysis || `Brand: ${watchInfo.brand || 'Unknown'}, Model: ${watchInfo.model || 'Unknown'}, Reference: ${watchInfo.reference_number || 'Unknown'}`;
      
      // Handle multiple watches if present
      let searchInstructions = '';
      if (result.allWatches && result.allWatches.length > 1) {
        searchInstructions = `\n\nNote: The video contains ${result.allWatches.length} different watches. I'm searching for the primary watch (${watchInfo.brand} ${watchInfo.model} ${watchInfo.reference_number || ''}). If you want to search for the other watches, let me know.`;
      }
      
      // Send message with extracted info and suggest search with explicit instructions
      const message = `I uploaded a watch ${result.framesAnalyzed ? 'video' : 'image'}. Here's what the analysis found:\n\n${analysisText}${searchInstructions}\n\nPlease search eBay using the search_ebay tool with this detailed query: "${searchQuery}". Use category "260324" for watches and set analyze_arbitrage to true. The query includes specific details like dial color, bezel type, bracelet type, and reference number to find the most accurate matches.`;
      
      sendMessage({ 
        role: 'user', 
        parts: [{ type: 'text', text: message }] 
      });
    } else if (result.analysis) {
      // Fallback to text analysis if structured data not available
      const analysisText = result.analysis;
      console.log('[Home] Analysis received (text only):', analysisText.substring(0, 100));
      
      const message = `I uploaded a watch ${result.framesAnalyzed ? 'video' : 'image'}. Here's what the analysis found:\n\n${analysisText}\n\nPlease search eBay for similar watches and analyze for arbitrage opportunities.`;
      
      sendMessage({ 
        role: 'user', 
        parts: [{ type: 'text', text: message }] 
      });
    } else {
      // Fallback: just send a generic message
      const message = `I uploaded a watch ${result.framesAnalyzed ? 'video' : 'image'}. Please analyze it and search for similar watches on eBay with arbitrage analysis.`;
      sendMessage({ 
        role: 'user', 
        parts: [{ type: 'text', text: message }] 
      });
    }
  };

  const processCardAnalysis = async (result: any) => {
    if (!result.success) {
      sendMessage({ 
        role: 'assistant', 
        parts: [{ type: 'text', text: `Sorry, I couldn't analyze the card. Error: ${result.error || 'Unknown error'}` }] 
      });
      return;
    }
      
    if (result.cardInfo) {
      const cardInfo = result.cardInfo;
      console.log('[Home] Card info extracted:', cardInfo);
      
      // Build a comprehensive search query from structured card info
      const queryParts: string[] = [];
      
      // Start with card name (most important)
      if (cardInfo.card_name) {
        queryParts.push(cardInfo.card_name);
      }
      
      // Add set name
      if (cardInfo.set_name) {
        queryParts.push(cardInfo.set_name);
      }
      
      // Add grade (critical for pricing)
      if (cardInfo.grade) {
        queryParts.push(cardInfo.grade);
      }
      
      // Add certification number if available (very specific)
      if (cardInfo.cert_number) {
        queryParts.push(`PSA ${cardInfo.cert_number}`);
      }
      
      // Add edition (important for value)
      if (cardInfo.edition && cardInfo.edition.toLowerCase().includes('1st')) {
        queryParts.push('1st Edition');
      }
      
      // Add year if available
      if (cardInfo.year) {
        queryParts.push(cardInfo.year);
      }
      
      // Build final query
      let searchQuery = queryParts.join(' ').trim();
      
      // Fallback if query is empty
      if (!searchQuery) {
        searchQuery = cardInfo.description || 'trading card';
      }
      
      // Use the structured analysis text
      const analysisText = result.analysis || `Card: ${cardInfo.card_name || 'Unknown'}, Set: ${cardInfo.set_name || 'Unknown'}, Grade: ${cardInfo.grade || 'Not graded'}`;
      
      // Handle multiple cards if present
      let searchInstructions = '';
      if (result.allCards && result.allCards.length > 1) {
        searchInstructions = `\n\nNote: The video contains ${result.allCards.length} different cards. I'm searching for the primary card (${cardInfo.card_name} ${cardInfo.set_name || ''} ${cardInfo.grade || ''}). If you want to search for the other cards, let me know.`;
      }
      
      // Send message with extracted info and suggest search
      const message = `I uploaded a card ${result.framesAnalyzed ? 'video' : 'image'}. Here's what the analysis found:\n\n${analysisText}${searchInstructions}\n\nPlease search eBay using the search_ebay tool with this detailed query: "${searchQuery}". Use category "183454" for trading cards and set analyze_arbitrage to true. The query includes specific details like card name, set, grade, and certification number to find the most accurate matches.`;
      
      sendMessage({ 
        role: 'user', 
        parts: [{ type: 'text', text: message }] 
      });
    } else if (result.analysis) {
      // Fallback to text analysis if structured data not available
      const analysisText = result.analysis;
      console.log('[Home] Analysis received (text only):', analysisText.substring(0, 100));
      
      const message = `I uploaded a card ${result.framesAnalyzed ? 'video' : 'image'}. Here's what the analysis found:\n\n${analysisText}\n\nPlease search eBay for similar cards and analyze for arbitrage opportunities.`;
      
      sendMessage({ 
        role: 'user', 
        parts: [{ type: 'text', text: message }] 
      });
    } else {
      // Fallback: just send a generic message
      const message = `I uploaded a card ${result.framesAnalyzed ? 'video' : 'image'}. Please analyze it and search for similar cards on eBay with arbitrage analysis.`;
      sendMessage({ 
        role: 'user', 
        parts: [{ type: 'text', text: message }] 
      });
    }
  };

  const isLoading = status !== 'ready';
  const [isInputCollapsed, setIsInputCollapsed] = React.useState(false);
  
  // Auto-collapse input when loading starts
  React.useEffect(() => {
    if (isLoading && !isInputCollapsed) {
      setIsInputCollapsed(true);
    }
  }, [isLoading]);

  // Debug: log messages and errors
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[Home] Messages updated:', messages.length, messages);
      if (error) {
        console.error('[Home] Chat error:', error);
        console.error('[Home] Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
    }
  }, [messages, error]);

  return (
    <div className="flex h-screen flex-col animate-fade-in">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="h-6 w-6 text-luxury-gold" />
              <div className="absolute inset-0 animate-pulse-gold opacity-50" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold tracking-tight">PSA</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Premium Price Intelligence</p>
            </div>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-luxury-gold/10 border border-luxury-gold/20">
              <TrendingUp className="h-4 w-4 text-luxury-gold" />
              <span className="text-luxury-gold font-medium">Ultimate Luxury Price Assistant</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="container max-w-4xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center min-h-[60vh] animate-slide-up">
                <Card className="w-full max-w-3xl p-8 md:p-12 glass hover-lift">
                  <div className="space-y-6 text-center">
                    <div className="relative mx-auto w-20 h-20 mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold to-luxury-gold-light rounded-full opacity-20 blur-xl" />
                      <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-luxury-gold/20 to-luxury-gold-light/20 rounded-full border-2 border-luxury-gold/30">
                        <Sparkles className="h-10 w-10 text-luxury-gold" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        <span className="text-luxury">Your Ultimate</span>
                        <br />
                        Luxury Price Assistant
                      </h2>
                      <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                        Discover arbitrage opportunities for luxury watches and trading cards with AI-powered market intelligence. 
                        Get instant price analysis, market insights, and deal alerts.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-luxury-gold/10 border border-luxury-gold/20">
                        <Zap className="h-4 w-4 text-luxury-gold" />
                        <span className="text-sm text-luxury-gold font-medium">AI-Powered</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-luxury-platinum/10 border border-luxury-platinum/20">
                        <TrendingUp className="h-4 w-4 text-luxury-platinum" />
                        <span className="text-sm text-luxury-platinum font-medium">Real-Time Analysis</span>
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-border/50">
                      <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-luxury-gold/10 to-luxury-gold-light/10 border border-luxury-gold/20">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-luxury-gold/20">
                            <Sparkles className="h-5 w-5 text-luxury-gold" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-luxury-gold mb-1">Premium Photo & Video Analysis</h3>
                            <p className="text-xs text-muted-foreground">
                              Upload a photo or video of any watch or trading card for instant AI-powered analysis, identification, and market valuation.
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold mb-6 text-foreground">Try these sample prompts:</p>
                      <SamplePrompts onPromptSelect={handlePromptSelect} isLoading={isLoading} />
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <>
                <ChatMessages 
                  messages={messages} 
                  isLoading={isLoading}
                  onPromptSelect={handlePromptSelect}
                  onNegotiate={(item, negotiationQuery) => {
                    // Send negotiation query to chat
                    handlePromptSelect(negotiationQuery);
                  }}
                  onLoadMore={(query, offset, limit) => {
                    // Send a new search query with pagination
                    handlePromptSelect(`Search eBay for "${query}" - show next ${limit} items (offset: ${offset})`);
                  }}
                />
                {error && (
                  <div className="mt-4 p-4 md:p-5 bg-destructive/10 border border-destructive/30 rounded-lg glass animate-slide-up">
                    <p className="text-sm md:text-base text-destructive font-semibold mb-1">Error:</p>
                    <p className="text-sm md:text-base text-destructive/80">{error.message}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className={`border-t border-border/50 glass sticky bottom-0 transition-all duration-300 ${
        isInputCollapsed ? 'py-2 md:py-3' : 'py-4 md:py-6'
      }`}>
        <div className="container max-w-4xl mx-auto px-4 md:px-6">
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              onImageUpload={handleImageUpload}
              onVideoUpload={handleVideoUpload}
              onVideoUrl={handleVideoUrl}
              isCollapsed={isInputCollapsed}
              onToggleCollapse={() => setIsInputCollapsed(!isInputCollapsed)}
            />
        </div>
      </div>

      {/* Error Panel */}
      <ErrorPanel />
      
      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel messages={messages} isLoading={isLoading} error={error} />
      )}
    </div>
  );
}

