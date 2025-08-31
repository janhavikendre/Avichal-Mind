// YouTube API service for video suggestions
export class YouTubeService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
  }

  async searchVideos(query: string, maxResults: number = 3): Promise<any[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key not configured');
      return [];
    }

    try {
      // Clean and enhance the query for better video search
      const enhancedQuery = this.enhanceQuery(query);
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `q=${encodeURIComponent(enhancedQuery)}&` +
        `type=video&` +
        `maxResults=${maxResults}&` +
        `videoDuration=medium&` +
        `videoEmbeddable=true&` +
        `relevanceLanguage=en&` +
        `key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return [];
      }

      // Get video details for better information
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,statistics,contentDetails&` +
        `id=${videoIds}&` +
        `key=${this.apiKey}`
      );

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        return detailsData.items.map((video: any) => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.medium.url,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails.duration,
          viewCount: video.statistics.viewCount,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          embedUrl: `https://www.youtube.com/embed/${video.id}`
        }));
      }

      // Fallback to basic search results
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
      }));

    } catch (error) {
      console.error('YouTube API error:', error);
      return [];
    }
  }

  private enhanceQuery(query: string): string {
    // Only add wellness keywords if the query is actually about wellness topics
    const wellnessKeywords = [
      'mental health',
      'wellness',
      'self care',
      'meditation',
      'mindfulness',
      'therapy',
      'counseling',
      'psychology',
      'emotional support',
      'stress management',
      'anxiety help',
      'depression support',
      'mental wellness',
      'self improvement',
      'personal growth'
    ];

    // Extract key topics from the query
    const queryLower = query.toLowerCase();
    
    // Check if the query already contains wellness-related content
    const hasWellnessContent = wellnessKeywords.some(keyword => 
      queryLower.includes(keyword.split(' ')[0]) || 
      queryLower.includes(keyword.split(' ')[1])
    );

    // If the query already has wellness content, don't add more keywords
    if (hasWellnessContent) {
      return query;
    }

    // Check if the query contains emotional/mental health indicators
    const emotionalIndicators = [
      'sad', 'depressed', 'anxious', 'worried', 'stressed', 'overwhelmed', 'lonely', 'hopeless',
      'angry', 'frustrated', 'tired', 'exhausted', 'fear', 'panic', 'mood', 'emotion', 'feeling',
      'cry', 'crying', 'tears', 'pain', 'hurt', 'suffering', 'help', 'support', 'advice'
    ];

    const hasEmotionalContent = emotionalIndicators.some(indicator => 
      queryLower.includes(indicator)
    );

    // Only add wellness keywords if there's emotional content
    if (hasEmotionalContent) {
      const relevantKeywords = wellnessKeywords.filter(keyword => 
        queryLower.includes(keyword.split(' ')[0]) || 
        queryLower.includes(keyword.split(' ')[1])
      );

      if (relevantKeywords.length > 0) {
        return `${query} ${relevantKeywords.slice(0, 2).join(' ')}`;
      } else {
        // Add minimal wellness context only for emotional content
        return `${query} mental wellness`;
      }
    }

    // For casual conversations, return the query as-is
    return query;
  }

  async getRelevantVideos(conversationContext: string, language: 'en' | 'hi' | 'mr' = 'en'): Promise<any[]> {
    try {
      // Create a search query based on the conversation context
      const searchQuery = this.createSearchQueryFromContext(conversationContext, language);
      const videos = await this.searchVideos(searchQuery, 3);
      
      return videos.map(video => ({
        ...video,
        relevance: 'Based on your conversation',
        language: language
      }));
    } catch (error) {
      console.error('Error getting relevant videos:', error);
      return [];
    }
  }

  private createSearchQueryFromContext(context: string, language: 'en' | 'hi' | 'mr'): string {
    // Extract key topics from conversation context
    const contextLower = context.toLowerCase();
    
    // Define topic keywords for different languages
    const topicKeywords = {
      en: {
        anxiety: ['anxiety', 'worry', 'stress', 'nervous', 'panic'],
        depression: ['depression', 'sad', 'hopeless', 'empty', 'worthless'],
        relationships: ['relationship', 'partner', 'family', 'friend', 'love'],
        work: ['work', 'job', 'career', 'professional', 'office'],
        sleep: ['sleep', 'insomnia', 'rest', 'tired', 'exhausted'],
        mindfulness: ['mindfulness', 'meditation', 'breathing', 'calm', 'peace']
      },
      hi: {
        anxiety: ['चिंता', 'तनाव', 'डर', 'घबराहट'],
        depression: ['अवसाद', 'उदासी', 'निराशा'],
        relationships: ['रिश्ते', 'परिवार', 'दोस्त', 'प्यार'],
        work: ['काम', 'नौकरी', 'पेशा'],
        sleep: ['नींद', 'अनिद्रा', 'थकान'],
        mindfulness: ['ध्यान', 'मेडिटेशन', 'शांति']
      },
      mr: {
        anxiety: ['चिंता', 'तणाव', 'भीती', 'घाबरटी'],
        depression: ['नैराश्य', 'दुःख', 'निराशा'],
        relationships: ['नाते', 'कुटुंब', 'मित्र', 'प्रेम'],
        work: ['काम', 'नोकरी', 'व्यवसाय'],
        sleep: ['झोप', 'अनिद्रा', 'थकवा'],
        mindfulness: ['ध्यान', 'मेडिटेशन', 'शांतता']
      }
    };

    const keywords = topicKeywords[language] || topicKeywords.en;
    const detectedTopics: string[] = [];

    // Detect topics from context
    Object.entries(keywords).forEach(([topic, words]) => {
      if (words.some(word => contextLower.includes(word))) {
        detectedTopics.push(topic);
      }
    });

    // Create search query
    if (detectedTopics.length > 0) {
      const topicQuery = detectedTopics.slice(0, 2).join(' ');
      return `${topicQuery} mental health wellness ${language === 'hi' ? 'hindi' : language === 'mr' ? 'marathi' : 'english'}`;
    }

    // Fallback to general wellness search
    return `mental wellness self care ${language === 'hi' ? 'hindi' : language === 'mr' ? 'marathi' : 'english'}`;
  }
}

export const youtubeService = new YouTubeService();
