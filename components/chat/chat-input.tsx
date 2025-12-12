'use client';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon, Video, Link as LinkIcon, X, Clock, CreditCard, ChevronDown, ChevronUp, Minimize2, Sparkles, Camera } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

type ItemType = 'watch' | 'card';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onImageUpload?: (imageFile: File, itemType: ItemType) => Promise<void>;
  onVideoUpload?: (videoFile: File, itemType: ItemType) => Promise<void>;
  onVideoUrl?: (url: string, itemType: ItemType) => Promise<void>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ChatInput({
  input = '',
  handleInputChange,
  handleSubmit,
  isLoading,
  onImageUpload,
  onVideoUpload,
  onVideoUrl,
  isCollapsed = false,
  onToggleCollapse,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [itemType, setItemType] = useState<ItemType>('watch');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  // Safety check: ensure input is always a string
  const safeInput = typeof input === 'string' ? input : '';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [safeInput]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setSelectedVideo(null); // Clear video if image selected
      setVideoUrl('');
      setShowTypeDropdown(true); // Show dropdown when file selected
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setVideoPreview(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedVideo(file);
      setSelectedImage(null); // Clear image if video selected
      setVideoUrl('');
      setShowTypeDropdown(true); // Show dropdown when file selected
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
        setImagePreview(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !onImageUpload) return;
    
    setIsAnalyzing(true);
    try {
      await onImageUpload(selectedImage, itemType);
      // Clear selection after upload
      setSelectedImage(null);
      setImagePreview(null);
      setShowTypeDropdown(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVideoUpload = async () => {
    if (selectedVideo && onVideoUpload) {
      setIsAnalyzing(true);
      try {
        await onVideoUpload(selectedVideo, itemType);
        setSelectedVideo(null);
        setVideoPreview(null);
        setShowTypeDropdown(false);
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error uploading video:', error);
      } finally {
        setIsAnalyzing(false);
      }
    } else if (videoUrl && onVideoUrl) {
      setIsAnalyzing(true);
      try {
        await onVideoUrl(videoUrl, itemType);
        setVideoUrl('');
        setShowUrlInput(false);
        setShowTypeDropdown(false);
      } catch (error) {
        console.error('Error processing video URL:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setShowTypeDropdown(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const removeVideo = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoUrl('');
    setShowUrlInput(false);
    setShowTypeDropdown(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const isValidVideoUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      return (
        hostname.includes('youtube.com') ||
        hostname.includes('youtu.be') ||
        hostname.includes('instagram.com') ||
        hostname.includes('instagr.am')
      );
    } catch {
      return false;
    }
  };

  const hasFileSelected = selectedImage || selectedVideo || (videoUrl && isValidVideoUrl(videoUrl));

  return (
    <div className="space-y-3 animate-fade-in relative">
      {/* Collapse/Expand Toggle Button - Top Right */}
      {onToggleCollapse && !isCollapsed && (
        <div className="absolute -top-10 right-0 z-10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 md:h-9 md:w-9 p-0 hover:bg-luxury-gold/10 hover:text-luxury-gold transition-luxury rounded-full"
            title="Collapse input to see more chat"
          >
            <Minimize2 className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      )}
      
      {/* Collapsible Content */}
      <div className={`transition-all duration-300 ease-out overflow-hidden ${
        isCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[1000px] opacity-100'
      }`}>
      {/* Item Type Toggle Buttons */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-muted-foreground font-medium">Item Type:</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={itemType === 'watch' ? 'luxury' : 'luxury-outline'}
              size="sm"
              onClick={() => setItemType('watch')}
              disabled={isLoading || isAnalyzing}
              className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm"
            >
              <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
              Watch
            </Button>
            <Button
              type="button"
              variant={itemType === 'card' ? 'luxury' : 'luxury-outline'}
              size="sm"
              onClick={() => setItemType('card')}
              disabled={isLoading || isAnalyzing}
              className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm"
            >
              <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
              Card
            </Button>
          </div>
        </div>
        
        {/* Premium Analysis Badge */}
        {(onImageUpload || onVideoUpload) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-luxury-gold/20 to-luxury-gold-light/20 border border-luxury-gold/30">
            <Sparkles className="h-3 w-3 text-luxury-gold" />
            <span className="text-[10px] md:text-xs font-semibold text-luxury-gold">Premium Analysis</span>
          </div>
        )}
      </div>

      {/* Type Dropdown (shown when file is selected) */}
      {showTypeDropdown && hasFileSelected && (
        <div className="flex items-center gap-2 p-2.5 md:p-3 bg-muted/80 glass border border-luxury-gold/20 rounded-lg animate-slide-up">
          <span className="text-xs md:text-sm text-foreground font-medium">Analyze as:</span>
          <div className="relative">
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as ItemType)}
              className="px-3 py-1.5 text-xs md:text-sm border border-luxury-gold/30 rounded-md bg-background appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-luxury"
              disabled={isAnalyzing}
            >
              <option value="watch">🕐 Watch</option>
              <option value="card">🃏 Card</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-luxury-gold" />
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative inline-block animate-scale-in">
          <div className="relative overflow-hidden rounded-lg border-2 border-luxury-gold/30 shadow-lg">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-24 w-24 md:h-28 md:w-28 object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-7 w-7 md:h-8 md:w-8 rounded-full shadow-lg hover:scale-110 transition-luxury"
            onClick={removeImage}
            disabled={isAnalyzing}
          >
            <X className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      )}

      {/* Video Preview */}
      {videoPreview && (
        <div className="relative inline-block animate-scale-in">
          <div className="relative overflow-hidden rounded-lg border-2 border-luxury-gold/30 shadow-lg">
            <video
              src={videoPreview}
              className="h-24 w-24 md:h-28 md:w-28 object-cover"
              muted
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-7 w-7 md:h-8 md:w-8 rounded-full shadow-lg hover:scale-110 transition-luxury"
            onClick={removeVideo}
            disabled={isAnalyzing}
          >
            <X className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      )}

      {/* Video URL Input */}
      {showUrlInput && (
        <div className="space-y-2 animate-slide-up">
          <div className="flex gap-2 items-center p-2.5 md:p-3 bg-muted/80 glass border border-luxury-gold/20 rounded-lg">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                // Show dropdown when valid URL is entered
                if (isValidVideoUrl(e.target.value)) {
                  setShowTypeDropdown(true);
                }
              }}
              placeholder="Paste YouTube or Instagram video URL..."
              className="flex-1 px-3 py-2 text-xs md:text-sm border border-luxury-gold/30 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-luxury"
              disabled={isAnalyzing}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowUrlInput(false);
                setVideoUrl('');
                setShowTypeDropdown(false);
              }}
              disabled={isAnalyzing}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={safeInput}
            onChange={handleInputChange}
            placeholder="Ask me about luxury watches, trading cards, or market opportunities..."
            className="min-h-[60px] md:min-h-[70px] max-h-[200px] resize-none pr-28 md:pr-36 text-sm md:text-base placeholder:text-muted-foreground/60"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading && safeInput.trim()) {
                  handleSubmit(e as any);
                }
              }
            }}
            disabled={isLoading || isAnalyzing}
          />
          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="watch-image-upload"
            disabled={isLoading || isAnalyzing}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
            id="watch-video-upload"
            disabled={isLoading || isAnalyzing}
          />
          
          {/* Action buttons */}
          <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 flex gap-1 z-10">
            {onImageUpload && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-9 md:w-9 hover:bg-luxury-gold/10 hover:text-luxury-gold transition-luxury relative group"
                disabled={isLoading || isAnalyzing}
                onClick={() => imageInputRef.current?.click()}
                title="Upload photo for AI analysis (Premium)"
              >
                <Camera className="h-4 w-4 md:h-5 md:w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-luxury-gold rounded-full border border-background" />
              </Button>
            )}
            {onVideoUpload && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-9 md:w-9 hover:bg-luxury-gold/10 hover:text-luxury-gold transition-luxury relative group"
                disabled={isLoading || isAnalyzing}
                onClick={() => {
                  if (onVideoUrl) {
                    setShowUrlInput(true);
                  } else if (videoInputRef.current) {
                    videoInputRef.current.click();
                  }
                }}
                title="Upload video for AI analysis (Premium)"
              >
                <Video className="h-4 w-4 md:h-5 md:w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-luxury-gold rounded-full border border-background" />
              </Button>
            )}
            {onVideoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-9 md:w-9 hover:bg-luxury-gold/10 hover:text-luxury-gold transition-luxury"
                disabled={isLoading || isAnalyzing}
                onClick={() => setShowUrlInput(true)}
                title="Paste video URL (YouTube/Instagram)"
              >
                <LinkIcon className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            )}
          </div>
        </div>
        {(selectedImage && onImageUpload) || (selectedVideo && onVideoUpload) || (videoUrl && onVideoUrl && isValidVideoUrl(videoUrl)) ? (
          <Button
            type="button"
            variant="luxury"
            onClick={() => {
              if (selectedImage && onImageUpload) {
                handleImageUpload();
              } else if (selectedVideo && onVideoUpload) {
                handleVideoUpload();
              } else if (videoUrl && onVideoUrl && isValidVideoUrl(videoUrl)) {
                handleVideoUpload();
              }
            }}
            disabled={isLoading || isAnalyzing || !!(videoUrl && !isValidVideoUrl(videoUrl))}
            className="h-[60px] md:h-[70px] px-4 md:px-6 shrink-0 text-sm md:text-base font-semibold"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-luxury-dark rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-luxury-dark rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-luxury-dark rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            ) : (
              `Analyze ${itemType === 'watch' ? 'Watch' : 'Card'}`
            )}
          </Button>
        ) : (
          <Button
            type="submit"
            variant="luxury"
            disabled={isLoading || !safeInput.trim() || isAnalyzing}
            size="icon"
            className="h-[60px] md:h-[70px] w-[60px] md:w-[70px] shrink-0"
          >
            <Send className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        )}
      </form>
      </div>
      
      {/* Collapsed State - Minimal Input */}
      {isCollapsed && onToggleCollapse && (
        <div className="flex items-center gap-2 pt-2 animate-slide-up">
          <div className="flex-1 h-10 md:h-12 bg-muted/50 border border-luxury-gold/20 rounded-lg flex items-center px-3 md:px-4 group hover:border-luxury-gold/40 transition-luxury">
            <span className="text-xs md:text-sm text-muted-foreground truncate flex items-center gap-2">
              {isLoading && (
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
              {safeInput ? (
                <span className="truncate">{safeInput}</span>
              ) : (
                <span className="text-muted-foreground/60">Input collapsed - click to expand</span>
              )}
            </span>
          </div>
          <Button
            type="button"
            variant="luxury"
            size="icon"
            onClick={onToggleCollapse}
            className="h-10 w-10 md:h-12 md:w-12 shrink-0"
            title="Expand input"
            disabled={isLoading}
          >
            <ChevronUp className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}

