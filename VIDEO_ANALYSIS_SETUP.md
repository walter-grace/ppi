# Video Analysis Setup

## Overview

The application now supports analyzing watches from:
1. **Local video files** - Upload MP4, MOV, AVI, etc.
2. **YouTube videos** - Paste YouTube URLs
3. **Instagram videos** - Paste Instagram video URLs

## Requirements

For video processing to work, you need to install the following tools on your server:

### 1. FFmpeg (Required for all video processing)

FFmpeg is used to extract frames from videos for analysis.

**Installation:**

- **Windows**: Download from https://ffmpeg.org/download.html or use `choco install ffmpeg`
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg` (Ubuntu/Debian) or `sudo yum install ffmpeg` (CentOS/RHEL)

**Verify installation:**
```bash
ffmpeg -version
```

### 2. yt-dlp or youtube-dl (Required for YouTube/Instagram URLs)

Used to download videos from YouTube and Instagram.

**Installation:**

- **yt-dlp** (recommended, better than youtube-dl):
  ```bash
  # Windows (with pip)
  pip install yt-dlp
  
  # macOS
  brew install yt-dlp
  
  # Linux
  pip install yt-dlp
  # OR
  sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
  sudo chmod a+rx /usr/local/bin/yt-dlp
  ```

- **youtube-dl** (fallback):
  ```bash
  pip install youtube-dl
  ```

**Verify installation:**
```bash
yt-dlp --version
# OR
youtube-dl --version
```

## How It Works

1. **Video Upload/URL**: User uploads a video file or provides a YouTube/Instagram URL
2. **Frame Extraction**: FFmpeg extracts 5 evenly-spaced frames from the video
3. **Frame Analysis**: Each frame is analyzed using GPT-4o-mini vision model
4. **Result Merging**: Results from all frames are merged to create a comprehensive analysis
5. **eBay Search**: The extracted watch information is used to search eBay with detailed queries

## Supported Video Formats

- **Local files**: MP4, MOV, AVI, MKV, WebM, and other formats supported by FFmpeg
- **YouTube**: Any public YouTube video URL
- **Instagram**: Instagram post/reel video URLs

## Usage

### In the UI:

1. Click the **Video icon** (📹) in the chat input
2. Choose one of:
   - **Upload file**: Select a local video file
   - **Paste URL**: Click the link icon to paste a YouTube or Instagram URL
3. Click **"Analyze Watch"** to process the video
4. The system will extract frames, analyze them, and search eBay automatically

### Example URLs:

- YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`
- YouTube Short: `https://youtu.be/VIDEO_ID`
- Instagram: `https://www.instagram.com/p/POST_ID/`
- Instagram Reel: `https://www.instagram.com/reel/REEL_ID/`

## Troubleshooting

### "FFmpeg not found" error:
- Ensure FFmpeg is installed and in your system PATH
- Restart your Next.js dev server after installing FFmpeg

### "Failed to download video" error:
- Ensure yt-dlp or youtube-dl is installed
- Check that the URL is publicly accessible
- Some Instagram videos may require authentication

### Video processing is slow:
- Large videos take longer to process
- The system extracts 5 frames by default
- Consider using shorter videos or clips for faster analysis

## Notes

- Video processing happens server-side for security and performance
- Temporary files are automatically cleaned up after processing
- Maximum video size is limited by your server's available memory
- For production, consider adding video size limits and processing timeouts

