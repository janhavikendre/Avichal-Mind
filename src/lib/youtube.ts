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
      
      // For stress management, be more specific
      if (conversationContext.toLowerCase().includes('stress') || 
          conversationContext.toLowerCase().includes('anxiety') || 
          conversationContext.toLowerCase().includes('तनाव') || 
          conversationContext.toLowerCase().includes('तणाव')) {
        const stressQuery = this.createStressManagementQuery(language);
        const stressVideos = await this.searchVideos(stressQuery, 2);
        
        // Also get general wellness videos
        const generalVideos = await this.searchVideos(searchQuery, 1);
        
        return [...stressVideos, ...generalVideos].map(video => ({
          ...video,
          relevance: 'Based on your conversation',
          language: language
        }));
      }
      
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

  private createStressManagementQuery(language: 'en' | 'hi' | 'mr'): string {
    const stressQueries = {
      en: 'stress management techniques breathing exercises meditation relaxation',
      hi: 'तनाव प्रबंधन तकनीक श्वास व्यायाम ध्यान विश्रांती',
      mr: 'तणाव व्यवस्थापन तंत्र श्वास व्यायाम ध्यान विश्रांती'
    };
    
    return stressQueries[language] || stressQueries.en;
  }

  private createSearchQueryFromContext(context: string, language: 'en' | 'hi' | 'mr'): string {
    // Extract key topics from conversation context
    const contextLower = context.toLowerCase();
    
    // Define topic keywords for different languages with enhanced coverage
    const topicKeywords = {
      en: {
        anxiety: ['anxiety', 'worry', 'stress', 'nervous', 'panic', 'fear', 'overwhelmed', 'tense'],
        depression: ['depression', 'sad', 'hopeless', 'empty', 'worthless', 'down', 'blue', 'miserable'],
        relationships: ['relationship', 'partner', 'family', 'friend', 'love', 'marriage', 'dating', 'breakup'],
        work: ['work', 'job', 'career', 'professional', 'office', 'boss', 'colleague', 'workplace'],
        sleep: ['sleep', 'insomnia', 'rest', 'tired', 'exhausted', 'bed', 'night', 'dream'],
        mindfulness: ['mindfulness', 'meditation', 'breathing', 'calm', 'peace', 'zen', 'yoga', 'relaxation'],
        self_care: ['self care', 'self-care', 'wellness', 'health', 'care', 'healing', 'recovery'],
        emotions: ['emotion', 'feeling', 'mood', 'happy', 'sad', 'angry', 'frustrated', 'joy'],
        grief: ['grief', 'loss', 'death', 'mourning', 'bereavement', 'missing', 'gone'],
        confidence: ['confidence', 'self-esteem', 'worth', 'value', 'believe', 'capable', 'strong']
      },
      hi: {
        anxiety: ['चिंता', 'तनाव', 'डर', 'घबराहट', 'परेशान', 'बेचैन', 'उत्तेजित'],
        depression: ['अवसाद', 'उदासी', 'निराशा', 'दुखी', 'खाली', 'बेकार', 'निराश'],
        relationships: ['रिश्ते', 'परिवार', 'दोस्त', 'प्यार', 'शादी', 'तलाक', 'ब्रेकअप'],
        work: ['काम', 'नौकरी', 'पेशा', 'कार्यालय', 'बॉस', 'सहकर्मी', 'कार्यस्थल'],
        sleep: ['नींद', 'अनिद्रा', 'आराम', 'थकान', 'बिस्तर', 'रात', 'सपना'],
        mindfulness: ['ध्यान', 'मेडिटेशन', 'श्वास', 'शांति', 'योग', 'आराम', 'शांत'],
        self_care: ['स्वास्थ्य', 'आरोग्य', 'देखभाल', 'उपचार', 'स्वयं की देखभाल'],
        emotions: ['भावना', 'मनोदशा', 'खुश', 'दुखी', 'गुस्सा', 'निराश', 'आनंद'],
        grief: ['दुख', 'नुकसान', 'मृत्यु', 'शोक', 'याद', 'गया', 'खोया'],
        confidence: ['आत्मविश्वास', 'आत्मसम्मान', 'मूल्य', 'योग्य', 'विश्वास', 'सक्षम', 'मजबूत']
      },
      mr: {
        anxiety: ['चिंता', 'तणाव', 'भीती', 'घाबरटी', 'परेशान', 'बेचैन', 'उत्तेजित'],
        depression: ['नैराश्य', 'दुःख', 'निराशा', 'दुखी', 'रिक्त', 'निरुपयोगी', 'निराश'],
        relationships: ['नाते', 'कुटुंब', 'मित्र', 'प्रेम', 'लग्न', 'घटस्फोट', 'ब्रेकअप'],
        work: ['काम', 'नोकरी', 'व्यवसाय', 'कार्यालय', 'मालक', 'सहकारी', 'कार्यस्थळ'],
        sleep: ['झोप', 'अनिद्रा', 'विश्रांती', 'थकवा', 'पलंग', 'रात्र', 'स्वप्न'],
        mindfulness: ['ध्यान', 'मेडिटेशन', 'श्वास', 'शांतता', 'योग', 'विश्रांती', 'शांत'],
        self_care: ['आरोग्य', 'स्वास्थ्य', 'काळजी', 'उपचार', 'स्वतःची काळजी'],
        emotions: ['भावना', 'मनोदशा', 'आनंदी', 'दुखी', 'राग', 'निराश', 'आनंद'],
        grief: ['दुःख', 'नुकसान', 'मृत्यू', 'शोक', 'आठवण', 'गेले', 'हरवले'],
        confidence: ['आत्मविश्वास', 'आत्मसन्मान', 'मूल्य', 'योग्य', 'विश्वास', 'सक्षम', 'बलवान']
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

    // Create enhanced search query based on detected topics
    if (detectedTopics.length > 0) {
      const topicQuery = detectedTopics.slice(0, 2).join(' ');
      
      // Add language-specific wellness terms
      const wellnessTerms = {
        en: 'mental health wellness self care',
        hi: 'मानसिक स्वास्थ्य कल्याण स्वयं की देखभाल',
        mr: 'मानसिक आरोग्य कल्याण स्वतःची काळजी'
      };
      
      const languageWellness = wellnessTerms[language] || wellnessTerms.en;
      return `${topicQuery} ${languageWellness}`;
    }

    // Fallback to general wellness search with language context
    const generalWellness = {
      en: 'mental wellness self care emotional support',
      hi: 'मानसिक कल्याण स्वयं की देखभाल भावनात्मक समर्थन',
      mr: 'मानसिक कल्याण स्वतःची काळजी भावनिक समर्थन'
    };
    
    return generalWellness[language] || generalWellness.en;
  }

  // New method to get videos based on specific emotional state or topic
  async getVideosForEmotionalState(emotionalState: string, language: 'en' | 'hi' | 'mr' = 'en'): Promise<any[]> {
    const emotionalQueries = {
      en: {
        anxiety: 'anxiety relief stress management breathing exercises',
        depression: 'depression support mental health recovery hope',
        loneliness: 'loneliness coping social connection self love',
        anger: 'anger management emotional regulation calm techniques',
        grief: 'grief support loss healing bereavement',
        confidence: 'self confidence building self esteem improvement',
        sleep: 'sleep improvement insomnia help relaxation',
        relationships: 'healthy relationships communication skills love',
        work_stress: 'work stress management burnout prevention',
        mindfulness: 'mindfulness meditation present moment awareness'
      },
      hi: {
        anxiety: 'चिंता राहत तनाव प्रबंधन श्वास व्यायाम',
        depression: 'अवसाद समर्थन मानसिक स्वास्थ्य पुनर्प्राप्ति आशा',
        loneliness: 'एकाकीपण सामना सामाजिक संबंध स्वयं प्रेम',
        anger: 'क्रोध प्रबंधन भावनात्मक नियमन शांत तंत्र',
        grief: 'दुख समर्थन नुकसान उपचार शोक',
        confidence: 'आत्मविश्वास निर्माण आत्मसम्मान सुधार',
        sleep: 'नींद सुधार अनिद्रा मदत विश्रांती',
        relationships: 'स्वस्थ रिश्ते संवाद कौशल्य प्रेम',
        work_stress: 'काम तनाव प्रबंधन बर्नआउट रोकथाम',
        mindfulness: 'ध्यान मेडिटेशन वर्तमान क्षण जागरूकता'
      },
      mr: {
        anxiety: 'चिंता राहत तणाव व्यवस्थापन श्वास व्यायाम',
        depression: 'नैराश्य समर्थन मानसिक आरोग्य पुनर्प्राप्ती आशा',
        loneliness: 'एकाकीपण सामना सामाजिक संबंध स्वतः प्रेम',
        anger: 'राग व्यवस्थापन भावनिक नियमन शांत तंत्र',
        grief: 'दुःख समर्थन नुकसान उपचार शोक',
        confidence: 'आत्मविश्वास निर्माण आत्मसन्मान सुधार',
        sleep: 'झोप सुधार अनिद्रा मदत विश्रांती',
        relationships: 'निरोगी नाते संवाद कौशल्य प्रेम',
        work_stress: 'काम तणाव व्यवस्थापन बर्नआउट रोकथाम',
        mindfulness: 'ध्यान मेडिटेशन वर्तमान क्षण जागरूकता'
      }
    };

    const queries = emotionalQueries[language] || emotionalQueries.en;
    const query = queries[emotionalState as keyof typeof queries] || queries.anxiety;
    
    return this.searchVideos(query, 3);
  }
}

export const youtubeService = new YouTubeService();
