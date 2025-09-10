// YouTube API service for video suggestions
export class YouTubeService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
  }

  async searchVideos(query: string, maxResults: number = 3, addRandomness: boolean = true): Promise<any[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key not configured');
      return [];
    }

    console.log('YouTube API: Searching for videos with query:', query);

    try {
      // Clean and enhance the query for better video search
      const enhancedQuery = this.enhanceQuery(query);
      
      // Add randomness to get different videos each time
      const randomOffset = addRandomness ? Math.floor(Math.random() * 50) : 0;
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `q=${encodeURIComponent(enhancedQuery)}&` +
        `type=video&` +
        `maxResults=${Math.min(maxResults * 3, 15)}&` +
        `videoDuration=medium&` +
        `videoEmbeddable=true&` +
        `relevanceLanguage=en&` +
        `order=relevance&` +
        `publishedAfter=2020-01-01T00:00:00Z&` +
        `key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('YouTube API: Received response with', data.items?.length || 0, 'videos');
      
      if (!data.items || data.items.length === 0) {
        console.log('YouTube API: No videos found for query:', enhancedQuery);
        return [];
      }

      // Shuffle and select random videos for variety
      const shuffledItems = this.shuffleArray([...data.items]);
      const selectedItems = shuffledItems.slice(0, maxResults);

      // Get video details for better information
      const videoIds = selectedItems.map((item: any) => item.id.videoId).join(',');
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
      return selectedItems.map((item: any) => ({
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

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private enhanceQuery(query: string): string {
    // Add variety to queries to get different videos
    const varietyTerms = [
      'techniques', 'exercises', 'tips', 'methods', 'practices', 'strategies',
      'guided', 'tutorial', 'beginner', 'advanced', 'quick', 'deep',
      'morning', 'evening', 'daily', 'weekly', 'instant', 'immediate'
    ];
    
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
        // Add variety term for different results
        const randomVariety = varietyTerms[Math.floor(Math.random() * varietyTerms.length)];
        return `${query} ${relevantKeywords.slice(0, 2).join(' ')} ${randomVariety}`;
      } else {
        // Add minimal wellness context only for emotional content
        const randomVariety = varietyTerms[Math.floor(Math.random() * varietyTerms.length)];
        return `${query} mental wellness ${randomVariety}`;
      }
    }

    // For casual conversations, add variety term
    const randomVariety = varietyTerms[Math.floor(Math.random() * varietyTerms.length)];
    return `${query} ${randomVariety}`;
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

  // New method to get varied exercise videos for specific techniques
  async getExerciseVideos(exerciseType: string, language: 'en' | 'hi' | 'mr' = 'en'): Promise<any[]> {
    const exerciseQueries = {
      en: {
        breathing: ['breathing exercises', 'breathing techniques', 'breathing meditation', 'breathwork', 'pranayama'],
        meditation: ['guided meditation', 'mindfulness meditation', 'meditation for beginners', 'calm meditation', 'peaceful meditation'],
        relaxation: ['relaxation techniques', 'progressive relaxation', 'body scan', 'relaxation exercises', 'calm down'],
        stress_relief: ['stress relief exercises', 'stress management techniques', 'instant stress relief', 'quick stress relief', 'stress buster'],
        anxiety_relief: ['anxiety relief exercises', 'calm anxiety', 'anxiety management', 'reduce anxiety', 'anxiety techniques'],
        sleep: ['sleep meditation', 'sleep stories', 'insomnia help', 'fall asleep', 'sleep relaxation'],
        mindfulness: ['mindfulness exercises', 'present moment', 'mindfulness techniques', 'awareness practice', 'mindful breathing']
      },
      hi: {
        breathing: ['श्वास व्यायाम', 'श्वास तकनीक', 'श्वास ध्यान', 'प्राणायाम', 'सांस लेने के व्यायाम'],
        meditation: ['गाइडेड मेडिटेशन', 'माइंडफुलनेस मेडिटेशन', 'शुरुआती के लिए ध्यान', 'शांत ध्यान', 'शांति ध्यान'],
        relaxation: ['विश्रांति तकनीक', 'प्रगतिशील विश्रांति', 'बॉडी स्कैन', 'विश्रांति व्यायाम', 'शांत होना'],
        stress_relief: ['तनाव राहत व्यायाम', 'तनाव प्रबंधन तकनीक', 'तत्काल तनाव राहत', 'त्वरित तनाव राहत', 'तनाव बस्टर'],
        anxiety_relief: ['चिंता राहत व्यायाम', 'चिंता शांत करना', 'चिंता प्रबंधन', 'चिंता कम करना', 'चिंता तकनीक'],
        sleep: ['नींद ध्यान', 'नींद की कहानियां', 'अनिद्रा मदद', 'सो जाना', 'नींद विश्रांति'],
        mindfulness: ['माइंडफुलनेस व्यायाम', 'वर्तमान क्षण', 'माइंडफुलनेस तकनीक', 'जागरूकता अभ्यास', 'सचेत श्वास']
      },
      mr: {
        breathing: ['श्वास व्यायाम', 'श्वास तंत्र', 'श्वास ध्यान', 'प्राणायाम', 'श्वास घेण्याचे व्यायाम'],
        meditation: ['मार्गदर्शित ध्यान', 'माइंडफुलनेस ध्यान', 'सुरुवातीकरिता ध्यान', 'शांत ध्यान', 'शांती ध्यान'],
        relaxation: ['विश्रांती तंत्र', 'प्रगतिशील विश्रांती', 'बॉडी स्कॅन', 'विश्रांती व्यायाम', 'शांत होणे'],
        stress_relief: ['तणाव सुटणे व्यायाम', 'तणाव व्यवस्थापन तंत्र', 'तत्काल तणाव सुटणे', 'त्वरित तणाव सुटणे', 'तणाव बस्टर'],
        anxiety_relief: ['चिंता सुटणे व्यायाम', 'चिंता शांत करणे', 'चिंता व्यवस्थापन', 'चिंता कमी करणे', 'चिंता तंत्र'],
        sleep: ['झोप ध्यान', 'झोप कथा', 'अनिद्रा मदत', 'झोपणे', 'झोप विश्रांती'],
        mindfulness: ['माइंडफुलनेस व्यायाम', 'वर्तमान क्षण', 'माइंडफुलनेस तंत्र', 'जागरूकता सराव', 'सचेत श्वास']
      }
    };

    const queries = exerciseQueries[language] || exerciseQueries.en;
    const exerciseQueriesList = queries[exerciseType as keyof typeof queries] || queries.breathing;
    
    // Randomly select a query for variety
    const randomQuery = exerciseQueriesList[Math.floor(Math.random() * exerciseQueriesList.length)];
    
    return this.searchVideos(randomQuery, 3, true);
  }

  // New method to get videos based on specific emotional state or topic
  async getVideosForEmotionalState(emotionalState: string, language: 'en' | 'hi' | 'mr' = 'en'): Promise<any[]> {
    const emotionalQueries = {
      en: {
        anxiety: ['anxiety relief stress management breathing exercises', 'calm anxiety techniques guided meditation', 'anxiety management tips relaxation'],
        depression: ['depression support mental health recovery hope', 'overcome depression motivational videos', 'depression help therapy techniques'],
        loneliness: ['loneliness coping social connection self love', 'overcome loneliness build connections', 'loneliness support self care'],
        anger: ['anger management emotional regulation calm techniques', 'control anger peaceful methods', 'anger relief calm down exercises'],
        grief: ['grief support loss healing bereavement', 'coping with loss healing process', 'grief counseling emotional support'],
        confidence: ['self confidence building self esteem improvement', 'boost confidence self love techniques', 'confidence building exercises'],
        sleep: ['sleep improvement insomnia help relaxation', 'fall asleep sleep meditation', 'sleep better relaxation techniques'],
        relationships: ['healthy relationships communication skills love', 'relationship advice communication tips', 'love relationships emotional connection'],
        work_stress: ['work stress management burnout prevention', 'workplace stress relief techniques', 'career stress management tips'],
        mindfulness: ['mindfulness meditation present moment awareness', 'mindful living awareness practice', 'mindfulness techniques daily practice']
      },
      hi: {
        anxiety: ['चिंता राहत तनाव प्रबंधन श्वास व्यायाम', 'चिंता शांत करने के तरीके', 'चिंता प्रबंधन विश्रांति'],
        depression: ['अवसाद समर्थन मानसिक स्वास्थ्य पुनर्प्राप्ति आशा', 'अवसाद से बाहर निकलने के तरीके', 'अवसाद मदद प्रेरणा'],
        loneliness: ['एकाकीपण सामना सामाजिक संबंध स्वयं प्रेम', 'एकाकीपण दूर करने के तरीके', 'एकाकीपण समर्थन स्वयं देखभाल'],
        anger: ['क्रोध प्रबंधन भावनात्मक नियमन शांत तंत्र', 'क्रोध नियंत्रण शांत तरीके', 'क्रोध राहत शांत व्यायाम'],
        grief: ['दुख समर्थन नुकसान उपचार शोक', 'नुकसान से निपटने के तरीके', 'दुख परामर्श भावनात्मक समर्थन'],
        confidence: ['आत्मविश्वास निर्माण आत्मसम्मान सुधार', 'आत्मविश्वास बढ़ाने के तरीके', 'आत्मविश्वास व्यायाम'],
        sleep: ['नींद सुधार अनिद्रा मदत विश्रांती', 'सोने में मदद नींद ध्यान', 'बेहतर नींद विश्रांति तकनीक'],
        relationships: ['स्वस्थ रिश्ते संवाद कौशल्य प्रेम', 'रिश्ते सलाह संवाद टिप्स', 'प्रेम रिश्ते भावनात्मक संबंध'],
        work_stress: ['काम तनाव प्रबंधन बर्नआउट रोकथाम', 'कार्यस्थल तनाव राहत तकनीक', 'करियर तनाव प्रबंधन टिप्स'],
        mindfulness: ['ध्यान मेडिटेशन वर्तमान क्षण जागरूकता', 'सचेत जीवन जागरूकता अभ्यास', 'ध्यान तकनीक दैनिक अभ्यास']
      },
      mr: {
        anxiety: ['चिंता राहत तणाव व्यवस्थापन श्वास व्यायाम', 'चिंता शांत करण्याचे मार्ग', 'चिंता व्यवस्थापन विश्रांती'],
        depression: ['नैराश्य समर्थन मानसिक आरोग्य पुनर्प्राप्ती आशा', 'नैराश्यातून बाहेर पडण्याचे मार्ग', 'नैराश्य मदत प्रेरणा'],
        loneliness: ['एकाकीपण सामना सामाजिक संबंध स्वतः प्रेम', 'एकाकीपण दूर करण्याचे मार्ग', 'एकाकीपण समर्थन स्वतः काळजी'],
        anger: ['राग व्यवस्थापन भावनिक नियमन शांत तंत्र', 'राग नियंत्रण शांत मार्ग', 'राग सुटणे शांत व्यायाम'],
        grief: ['दुःख समर्थन नुकसान उपचार शोक', 'नुकसानाशी सामना करण्याचे मार्ग', 'दुःख सल्लागार भावनिक समर्थन'],
        confidence: ['आत्मविश्वास निर्माण आत्मसन्मान सुधार', 'आत्मविश्वास वाढवण्याचे मार्ग', 'आत्मविश्वास व्यायाम'],
        sleep: ['झोप सुधार अनिद्रा मदत विश्रांती', 'झोपण्यात मदत झोप ध्यान', 'चांगली झोप विश्रांती तंत्र'],
        relationships: ['निरोगी नाते संवाद कौशल्य प्रेम', 'नाते सल्ला संवाद टिप्स', 'प्रेम नाते भावनिक संबंध'],
        work_stress: ['काम तणाव व्यवस्थापन बर्नआउट रोकथाम', 'कार्यस्थळ तणाव सुटणे तंत्र', 'करिअर तणाव व्यवस्थापन टिप्स'],
        mindfulness: ['ध्यान मेडिटेशन वर्तमान क्षण जागरूकता', 'सचेत जीवन जागरूकता सराव', 'ध्यान तंत्र दैनिक सराव']
      }
    };

    const queries = emotionalQueries[language] || emotionalQueries.en;
    const emotionalQueriesList = queries[emotionalState as keyof typeof queries] || queries.anxiety;
    
    // Randomly select a query for variety
    const randomQuery = Array.isArray(emotionalQueriesList) 
      ? emotionalQueriesList[Math.floor(Math.random() * emotionalQueriesList.length)]
      : emotionalQueriesList;
    
    return this.searchVideos(randomQuery, 3, true);
  }
}

export const youtubeService = new YouTubeService();
