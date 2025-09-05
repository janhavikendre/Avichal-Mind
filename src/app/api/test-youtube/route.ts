import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing YouTube API...');
    
    // Test basic video search
    const videos = await youtubeService.searchVideos('mental health meditation', 3);
    
    console.log('YouTube API test results:', videos.length, 'videos found');
    
    return NextResponse.json({
      success: true,
      videoCount: videos.length,
      videos: videos,
      apiKeyConfigured: !!process.env.YOUTUBE_API_KEY
    });
  } catch (error) {
    console.error('YouTube API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyConfigured: !!process.env.YOUTUBE_API_KEY
    }, { status: 500 });
  }
}
