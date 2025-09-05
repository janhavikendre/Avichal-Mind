// Crisis Video Suggestion Service for Mental Health Support
export interface CrisisVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
  embedUrl: string;
  duration?: string;
  category: 'anxiety' | 'depression' | 'panic' | 'grief' | 'crisis_support' | 'breathing' | 'grounding' | 'mindfulness';
  language: 'en' | 'hi' | 'mr';
  priority: 'high' | 'medium' | 'low';
}

export interface CrisisVideoResponse {
  videos: CrisisVideo[];
  crisisType: string;
  supportMessage: string;
  emergencyResources: {
    helpline: string;
    textLine: string;
    emergency: string;
  };
}

export class CrisisVideoService {
  private static crisisVideoDatabase: Record<string, Record<string, CrisisVideo[]>> = {
    en: {
      suicidal: [
        {
          id: 'crisis-suicide-1',
          title: 'You Are Not Alone - Crisis Support',
          description: 'Immediate support and resources for those in crisis',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'Crisis Support',
          url: 'https://www.youtube.com/watch?v=crisis-suicide-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-suicide-1',
          duration: '5:30',
          category: 'crisis_support',
          language: 'en',
          priority: 'high'
        }
      ],
      mental_breakdown: [
        {
          id: 'crisis-breakdown-1',
          title: 'Mental Breakdown Recovery - Step by Step',
          description: 'Gentle guidance for recovering from a mental breakdown',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'Mental Health Support',
          url: 'https://www.youtube.com/watch?v=crisis-breakdown-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-breakdown-1',
          duration: '8:45',
          category: 'crisis_support',
          language: 'en',
          priority: 'high'
        },
        {
          id: 'crisis-breakdown-2',
          title: 'Grounding Techniques for Crisis Moments',
          description: 'Immediate grounding techniques to help you feel safe',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'Therapy in a Nutshell',
          url: 'https://www.youtube.com/watch?v=crisis-breakdown-2',
          embedUrl: 'https://www.youtube.com/embed/crisis-breakdown-2',
          duration: '6:20',
          category: 'grounding',
          language: 'en',
          priority: 'high'
        }
      ],
      panic_attack: [
        {
          id: 'crisis-panic-1',
          title: 'Panic Attack Help - Immediate Relief',
          description: 'Step-by-step guide to manage panic attacks',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'Anxiety Relief',
          url: 'https://www.youtube.com/watch?v=crisis-panic-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-panic-1',
          duration: '7:15',
          category: 'panic',
          language: 'en',
          priority: 'high'
        },
        {
          id: 'crisis-panic-2',
          title: 'Breathing Exercise for Panic Attacks',
          description: 'Calming breathing technique to stop panic attacks',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'Mindfulness Channel',
          url: 'https://www.youtube.com/watch?v=crisis-panic-2',
          embedUrl: 'https://www.youtube.com/embed/crisis-panic-2',
          duration: '4:30',
          category: 'breathing',
          language: 'en',
          priority: 'high'
        }
      ],
      severe_distress: [
        {
          id: 'crisis-distress-1',
          title: 'Crisis Coping Strategies',
          description: 'Immediate strategies to help you through difficult moments',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'Mental Health First Aid',
          url: 'https://www.youtube.com/watch?v=crisis-distress-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-distress-1',
          duration: '9:20',
          category: 'crisis_support',
          language: 'en',
          priority: 'medium'
        },
        {
          id: 'crisis-distress-2',
          title: '5-4-3-2-1 Grounding Technique',
          description: 'Quick grounding exercise to help you feel present',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'Therapy Tools',
          url: 'https://www.youtube.com/watch?v=crisis-distress-2',
          embedUrl: 'https://www.youtube.com/embed/crisis-distress-2',
          duration: '3:45',
          category: 'grounding',
          language: 'en',
          priority: 'medium'
        }
      ]
    },
    hi: {
      suicidal: [
        {
          id: 'crisis-suicide-hi-1',
          title: 'आप अकेले नहीं हैं - संकट सहायता',
          description: 'संकट में तत्काल सहायता और संसाधन',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'संकट सहायता',
          url: 'https://www.youtube.com/watch?v=crisis-suicide-hi-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-suicide-hi-1',
          duration: '5:30',
          category: 'crisis_support',
          language: 'hi',
          priority: 'high'
        }
      ],
      mental_breakdown: [
        {
          id: 'crisis-breakdown-hi-1',
          title: 'मानसिक टूटन से उबरना - कदम दर कदम',
          description: 'मानसिक टूटन से उबरने के लिए कोमल मार्गदर्शन',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'मानसिक स्वास्थ्य सहायता',
          url: 'https://www.youtube.com/watch?v=crisis-breakdown-hi-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-breakdown-hi-1',
          duration: '8:45',
          category: 'crisis_support',
          language: 'hi',
          priority: 'high'
        },
        {
          id: 'crisis-breakdown-hi-2',
          title: 'संकट के क्षणों के लिए ग्राउंडिंग तकनीक',
          description: 'आपको सुरक्षित महसूस कराने के लिए तत्काल ग्राउंडिंग तकनीक',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'थेरेपी टूल्स',
          url: 'https://www.youtube.com/watch?v=crisis-breakdown-hi-2',
          embedUrl: 'https://www.youtube.com/embed/crisis-breakdown-hi-2',
          duration: '6:20',
          category: 'grounding',
          language: 'hi',
          priority: 'high'
        }
      ],
      panic_attack: [
        {
          id: 'crisis-panic-hi-1',
          title: 'पैनिक अटैक सहायता - तत्काल राहत',
          description: 'पैनिक अटैक को प्रबंधित करने के लिए कदम दर कदम गाइड',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'चिंता राहत',
          url: 'https://www.youtube.com/watch?v=crisis-panic-hi-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-panic-hi-1',
          duration: '7:15',
          category: 'panic',
          language: 'hi',
          priority: 'high'
        },
        {
          id: 'crisis-panic-hi-2',
          title: 'पैनिक अटैक के लिए श्वास व्यायाम',
          description: 'पैनिक अटैक को रोकने के लिए शांत करने वाली श्वास तकनीक',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'माइंडफुलनेस चैनल',
          url: 'https://www.youtube.com/watch?v=crisis-panic-hi-2',
          embedUrl: 'https://www.youtube.com/embed/crisis-panic-hi-2',
          duration: '4:30',
          category: 'breathing',
          language: 'hi',
          priority: 'high'
        }
      ],
      severe_distress: [
        {
          id: 'crisis-distress-hi-1',
          title: 'संकट से निपटने की रणनीतियां',
          description: 'कठिन क्षणों में आपकी मदद के लिए तत्काल रणनीतियां',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'मानसिक स्वास्थ्य प्राथमिक चिकित्सा',
          url: 'https://www.youtube.com/watch?v=crisis-distress-hi-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-distress-hi-1',
          duration: '9:20',
          category: 'crisis_support',
          language: 'hi',
          priority: 'medium'
        },
        {
          id: 'crisis-distress-hi-2',
          title: '5-4-3-2-1 ग्राउंडिंग तकनीक',
          description: 'आपको वर्तमान में महसूस कराने के लिए त्वरित ग्राउंडिंग व्यायाम',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'थेरेपी टूल्स',
          url: 'https://www.youtube.com/watch?v=crisis-distress-hi-2',
          embedUrl: 'https://www.youtube.com/embed/crisis-distress-hi-2',
          duration: '3:45',
          category: 'grounding',
          language: 'hi',
          priority: 'medium'
        }
      ]
    },
    mr: {
      suicidal: [
        {
          id: 'crisis-suicide-mr-1',
          title: 'तुम्ही एकटे नाही आहात - संकट सहाय्य',
          description: 'संकटात त्वरित सहाय्य आणि संसाधने',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'संकट सहाय्य',
          url: 'https://www.youtube.com/watch?v=crisis-suicide-mr-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-suicide-mr-1',
          duration: '5:30',
          category: 'crisis_support',
          language: 'mr',
          priority: 'high'
        }
      ],
      mental_breakdown: [
        {
          id: 'crisis-breakdown-mr-1',
          title: 'मानसिक टूटनातून बाहेर पडणे - पायरी दर पायरी',
          description: 'मानसिक टूटनातून बाहेर पडण्यासाठी सौम्य मार्गदर्शन',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'मानसिक आरोग्य सहाय्य',
          url: 'https://www.youtube.com/watch?v=crisis-breakdown-mr-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-breakdown-mr-1',
          duration: '8:45',
          category: 'crisis_support',
          language: 'mr',
          priority: 'high'
        },
        {
          id: 'crisis-breakdown-mr-2',
          title: 'संकटाच्या क्षणांसाठी ग्राउंडिंग तंत्र',
          description: 'तुम्हाला सुरक्षित वाटण्यासाठी त्वरित ग्राउंडिंग तंत्र',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'थेरेपी टूल्स',
          url: 'https://www.youtube.com/watch?v=crisis-breakdown-mr-2',
          embedUrl: 'https://www.youtube.com/embed/crisis-breakdown-mr-2',
          duration: '6:20',
          category: 'grounding',
          language: 'mr',
          priority: 'high'
        }
      ],
      panic_attack: [
        {
          id: 'crisis-panic-mr-1',
          title: 'पॅनिक अटॅक सहाय्य - त्वरित आराम',
          description: 'पॅनिक अटॅक व्यवस्थापित करण्यासाठी पायरी दर पायरी मार्गदर्शन',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'चिंता आराम',
          url: 'https://www.youtube.com/watch?v=crisis-panic-mr-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-panic-mr-1',
          duration: '7:15',
          category: 'panic',
          language: 'mr',
          priority: 'high'
        },
        {
          id: 'crisis-panic-mr-2',
          title: 'पॅनिक अटॅकसाठी श्वास व्यायाम',
          description: 'पॅनिक अटॅक थांबवण्यासाठी शांत करणारी श्वास तंत्र',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'माइंडफुलनेस चॅनेल',
          url: 'https://www.youtube.com/watch?v=crisis-panic-mr-2',
          embedUrl: 'https://www.youtube.com/embed/crisis-panic-mr-2',
          duration: '4:30',
          category: 'breathing',
          language: 'mr',
          priority: 'high'
        }
      ],
      severe_distress: [
        {
          id: 'crisis-distress-mr-1',
          title: 'संकट हाताळण्याच्या रणनीती',
          description: 'कठीण क्षणांत तुमची मदत करण्यासाठी त्वरित रणनीती',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'मानसिक आरोग्य प्राथमिक उपचार',
          url: 'https://www.youtube.com/watch?v=crisis-distress-mr-1',
          embedUrl: 'https://www.youtube.com/embed/crisis-distress-mr-1',
          duration: '9:20',
          category: 'crisis_support',
          language: 'mr',
          priority: 'medium'
        },
        {
          id: 'crisis-distress-mr-2',
          title: '5-4-3-2-1 ग्राउंडिंग तंत्र',
          description: 'तुम्हाला वर्तमानात वाटण्यासाठी त्वरित ग्राउंडिंग व्यायाम',
          thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
          channelTitle: 'थेरेपी टूल्स',
          url: 'https://www.youtube.com/watch?v=crisis-distress-mr-2',
          embedUrl: 'https://www.youtube.com/embed/crisis-distress-mr-2',
          duration: '3:45',
          category: 'grounding',
          language: 'mr',
          priority: 'medium'
        }
      ]
    }
  };

  static async getCrisisVideos(
    crisisType: 'suicidal' | 'mental_breakdown' | 'panic_attack' | 'severe_distress',
    language: 'en' | 'hi' | 'mr' = 'en',
    maxVideos: number = 3
  ): Promise<CrisisVideoResponse> {
    try {
      // Get videos for the specific crisis type and language
      const languageVideos = this.crisisVideoDatabase[language] || this.crisisVideoDatabase.en;
      const crisisVideos = languageVideos[crisisType] || languageVideos.severe_distress;
      
      // Sort by priority and take the requested number
      const sortedVideos = crisisVideos
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, maxVideos);

      // Generate appropriate support message
      const supportMessage = this.generateSupportMessage(crisisType, language);
      
      // Get emergency resources
      const emergencyResources = this.getEmergencyResources(language);

      return {
        videos: sortedVideos,
        crisisType,
        supportMessage,
        emergencyResources
      };
    } catch (error) {
      console.error('Error getting crisis videos:', error);
      // Return fallback response
      return this.getFallbackCrisisResponse(language);
    }
  }

  private static generateSupportMessage(
    crisisType: string,
    language: 'en' | 'hi' | 'mr'
  ): string {
    const messages = {
      en: {
        suicidal: "You are not alone. These videos provide immediate support and resources. Please reach out to a crisis helpline or mental health professional right away.",
        mental_breakdown: "I understand you're going through a very difficult time. These videos can help you feel more grounded and supported during this crisis.",
        panic_attack: "Panic attacks can feel overwhelming, but they will pass. These videos will guide you through breathing and grounding techniques.",
        severe_distress: "You're experiencing intense emotions right now. These videos offer immediate coping strategies to help you through this moment."
      },
      hi: {
        suicidal: "आप अकेले नहीं हैं। ये वीडियो तत्काल सहायता और संसाधन प्रदान करते हैं। कृपया तुरंत किसी संकट हेल्पलाइन या मानसिक स्वास्थ्य पेशेवर से संपर्क करें।",
        mental_breakdown: "मैं समझता हूं कि आप बहुत कठिन समय से गुजर रहे हैं। ये वीडियो इस संकट के दौरान आपको अधिक स्थिर और समर्थित महसूस कराने में मदद कर सकते हैं।",
        panic_attack: "पैनिक अटैक अभिभूत करने वाला लग सकता है, लेकिन यह गुजर जाएगा। ये वीडियो आपको श्वास और ग्राउंडिंग तकनीकों के माध्यम से मार्गदर्शन करेंगे।",
        severe_distress: "आप अभी तीव्र भावनाओं का अनुभव कर रहे हैं। ये वीडियो इस क्षण में आपकी मदद के लिए तत्काल सामना करने की रणनीतियां प्रदान करते हैं।"
      },
      mr: {
        suicidal: "तुम्ही एकटे नाही आहात. हे व्हिडिओ त्वरित सहाय्य आणि संसाधने प्रदान करतात. कृपया त्वरित कोणत्याही संकट हेल्पलाइन किंवा मानसिक आरोग्य व्यावसायिकांशी संपर्क साधा.",
        mental_breakdown: "मी समजतो की तुम्ही खूप कठीण काळातून जात आहात. हे व्हिडिओ या संकटादरम्यान तुम्हाला अधिक स्थिर आणि समर्थित वाटण्यास मदत करू शकतात.",
        panic_attack: "पॅनिक अटॅक अधिक भार वाटू शकतो, पण तो निघून जाईल. हे व्हिडिओ तुम्हाला श्वास आणि ग्राउंडिंग तंत्रांद्वारे मार्गदर्शन करतील.",
        severe_distress: "तुम्ही आता तीव्र भावना अनुभवत आहात. हे व्हिडिओ या क्षणात तुमची मदत करण्यासाठी त्वरित सामना करण्याच्या रणनीती ऑफर करतात."
      }
    };

    return messages[language][crisisType as keyof typeof messages[typeof language]] || messages[language].severe_distress;
  }

  private static getEmergencyResources(language: 'en' | 'hi' | 'mr') {
    const resources = {
      en: {
        helpline: '988',
        textLine: 'Text HOME to 741741',
        emergency: '112'
      },
      hi: {
        helpline: '988',
        textLine: 'HOME को 741741 पर टेक्स्ट करें',
        emergency: '112'
      },
      mr: {
        helpline: '988',
        textLine: 'HOME ला 741741 ला टेक्स्ट करा',
        emergency: '112'
      }
    };

    return resources[language];
  }

  private static getFallbackCrisisResponse(language: 'en' | 'hi' | 'mr'): CrisisVideoResponse {
    const fallbackVideos: CrisisVideo[] = [
      {
        id: 'fallback-crisis-1',
        title: language === 'hi' ? 'संकट सहायता' : language === 'mr' ? 'संकट सहाय्य' : 'Crisis Support',
        description: language === 'hi' ? 'तत्काल सहायता और संसाधन' : language === 'mr' ? 'त्वरित सहाय्य आणि संसाधने' : 'Immediate support and resources',
        thumbnail: 'https://img.youtube.com/vi/placeholder/mqdefault.jpg',
        channelTitle: language === 'hi' ? 'संकट सहायता' : language === 'mr' ? 'संकट सहाय्य' : 'Crisis Support',
        url: 'https://www.youtube.com/watch?v=fallback-crisis-1',
        embedUrl: 'https://www.youtube.com/embed/fallback-crisis-1',
        duration: '5:00',
        category: 'crisis_support',
        language,
        priority: 'high'
      }
    ];

    return {
      videos: fallbackVideos,
      crisisType: 'severe_distress',
      supportMessage: language === 'hi' 
        ? 'आप अकेले नहीं हैं। कृपया तुरंत मदद लें।'
        : language === 'mr'
        ? 'तुम्ही एकटे नाही आहात. कृपया त्वरित मदत घ्या.'
        : 'You are not alone. Please reach out for help immediately.',
      emergencyResources: this.getEmergencyResources(language)
    };
  }

  // Method to get videos from YouTube API as backup
  static async getYouTubeCrisisVideos(
    crisisType: string,
    language: 'en' | 'hi' | 'mr' = 'en',
    maxVideos: number = 3
  ): Promise<CrisisVideo[]> {
    try {
      // Import YouTube service dynamically to avoid circular dependencies
      const { youtubeService } = await import('./youtube');
      
      // Create search queries based on crisis type and language
      const searchQueries = this.getCrisisSearchQueries(crisisType, language);
      
      const allVideos: CrisisVideo[] = [];
      
      for (const query of searchQueries) {
        const videos = await youtubeService.searchVideos(query, 2);
        const crisisVideos: CrisisVideo[] = videos.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          channelTitle: video.channelTitle,
          url: video.url,
          embedUrl: video.embedUrl,
          duration: video.duration,
          category: this.mapCrisisTypeToCategory(crisisType),
          language,
          priority: 'medium'
        }));
        
        allVideos.push(...crisisVideos);
        
        if (allVideos.length >= maxVideos) break;
      }
      
      return allVideos.slice(0, maxVideos);
    } catch (error) {
      console.error('Error getting YouTube crisis videos:', error);
      return [];
    }
  }

  private static getCrisisSearchQueries(crisisType: string, language: 'en' | 'hi' | 'mr'): string[] {
    const queries = {
      en: {
        suicidal: ['crisis support suicide prevention', 'mental health crisis help'],
        mental_breakdown: ['mental breakdown recovery', 'crisis intervention mental health'],
        panic_attack: ['panic attack help breathing exercises', 'anxiety crisis management'],
        severe_distress: ['crisis coping strategies', 'mental health emergency support']
      },
      hi: {
        suicidal: ['संकट सहायता आत्महत्या रोकथाम', 'मानसिक स्वास्थ्य संकट मदद'],
        mental_breakdown: ['मानसिक टूटन पुनर्प्राप्ति', 'संकट हस्तक्षेप मानसिक स्वास्थ्य'],
        panic_attack: ['पैनिक अटैक मदद श्वास व्यायाम', 'चिंता संकट प्रबंधन'],
        severe_distress: ['संकट सामना रणनीतियां', 'मानसिक स्वास्थ्य आपातकालीन सहायता']
      },
      mr: {
        suicidal: ['संकट सहाय्य आत्महत्या रोकथाम', 'मानसिक आरोग्य संकट मदत'],
        mental_breakdown: ['मानसिक टूटन पुनर्प्राप्ती', 'संकट हस्तक्षेप मानसिक आरोग्य'],
        panic_attack: ['पॅनिक अटॅक मदत श्वास व्यायाम', 'चिंता संकट व्यवस्थापन'],
        severe_distress: ['संकट सामना रणनीती', 'मानसिक आरोग्य आणीबाणी सहाय्य']
      }
    };

    return queries[language][crisisType as keyof typeof queries[typeof language]] || queries[language].severe_distress;
  }

  private static mapCrisisTypeToCategory(crisisType: string): CrisisVideo['category'] {
    const mapping: Record<string, CrisisVideo['category']> = {
      suicidal: 'crisis_support',
      mental_breakdown: 'crisis_support',
      panic_attack: 'panic',
      severe_distress: 'crisis_support'
    };

    return mapping[crisisType] || 'crisis_support';
  }
}

export const crisisVideoService = new CrisisVideoService();
