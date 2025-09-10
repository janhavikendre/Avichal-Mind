"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

interface ChatbotWidgetProps {
  className?: string;
}

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export function ChatbotWidget({ className }: ChatbotWidgetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "👋 Hi! I'm AVI, your mental health companion. I'm here to listen and support you. How are you feeling today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistory = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const detectLanguage = (text: string): 'en' | 'hi' | 'mr' => {
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    if (hindiChars > 5) {
      // Check for Marathi-specific words
      const marathiWords = ['काय', 'कसे', 'का', 'कधी', 'कुठे', 'कोण', 'मी', 'तुम्ही', 'आहात'];
      const hasMarathiWords = marathiWords.some(word => text.includes(word));
      return hasMarathiWords ? 'mr' : 'hi';
    }
    
    return englishChars > hindiChars ? 'en' : 'hi';
  };

  const sendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage = inputValue.trim();
      const detectedLang = detectLanguage(userMessage);
      setLanguage(detectedLang);
      
      // Add user message
      const newUserMessage: Message = {
        id: Date.now(),
        text: userMessage,
        isBot: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setInputValue("");
      setIsLoading(true);

      try {
        // Get AI response using the API route
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            language: detectedLang,
            conversationHistory: conversationHistory.current
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get response');
        }

        // Add AI response
        const botResponse: Message = {
          id: Date.now() + 1,
          text: data.text,
          isBot: true,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botResponse]);

        // Update conversation history
        conversationHistory.current.push(
          { role: 'user', content: userMessage },
          { role: 'assistant', content: data.text }
        );

        // Keep only last 10 messages in history to prevent context overflow
        if (conversationHistory.current.length > 20) {
          conversationHistory.current = conversationHistory.current.slice(-20);
        }

      } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Fallback response
        const errorResponse: Message = {
          id: Date.now() + 1,
          text: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          isBot: true,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: 1,
        text: "👋 Hi! I'm AVI, your mental health companion. I'm here to listen and support you. How are you feeling today?",
        isBot: true,
        timestamp: new Date()
      }
    ]);
    conversationHistory.current = [];
    setLanguage('en');
  };

  const startVoiceChat = () => {
    // Redirect to voice session page
    router.push('/session/new');
  };

  return (
    <div className={cn("fixed bottom-5 right-5 z-50", className)}>
      {/* Chat Window */}
      <div 
        className={`absolute bottom-20 right-0 w-80 h-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 flex flex-col transition-all duration-300 ${
          isOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">AVI - Mental Health Assistant</h3>
              <p className="text-sm opacity-90">Online • Ready to help</p>
            </div>
            <div className="flex items-center space-x-2">
              {messages.length > 1 && (
                <button 
                  onClick={clearConversation}
                  className="text-white hover:text-gray-200 transition-colors"
                  title="Clear conversation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button 
                onClick={toggleChat}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto" style={{ height: '280px' }}>
          {messages.map((message) => (
            <div key={message.id} className={`mb-4 ${message.isBot ? '' : 'text-right'}`}>
              <div className={`rounded-lg p-3 text-sm max-w-xs ${
                message.isBot 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white' 
                  : 'bg-purple-600 text-white inline-block'
              }`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="mb-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm max-w-xs">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-500">AVI is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex items-center space-x-2">
              {/* <button 
                onClick={startVoiceChat}
                className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
                title="Start voice chat session"
              >
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Voice Chat
              </button> */}
              {language !== 'en' && (
                <span className="text-xs text-purple-600 font-medium">
                  {language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'English'}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">Powered by AI</span>
          </div>
        </div>
      </div>

      {/* Chat Button */}
      <div 
        onClick={toggleChat}
        className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 border border-white/20 backdrop-blur-sm"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    </div>
  );
}
