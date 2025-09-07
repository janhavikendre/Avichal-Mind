"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface ChatbotWidgetProps {
  className?: string;
}

export function ChatbotWidget({ className }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi! I'm AVI, your mental health companion. I'm here to listen and support you. How are you feeling today?",
      isBot: true
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputValue,
        isBot: false
      };
      setMessages([...messages, newMessage]);
      setInputValue("");

      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: `I understand you're sharing "${inputValue}". Thank you for opening up. Would you like to talk more about this with a licensed professional? I can connect you right away.`,
          isBot: true
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className={cn("fixed bottom-5 right-5 z-50", className)}>
      {/* Chat Window */}
      <div 
        className={`absolute bottom-20 right-0 w-80 h-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold">AVI - Mental Health Assistant</h3>
              <p className="text-sm opacity-75">Online • Ready to help</p>
            </div>
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

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto" style={{ height: '280px' }}>
          {messages.map((message) => (
            <div key={message.id} className={`mb-4 ${message.isBot ? '' : 'text-right'}`}>
              <div className={`rounded-lg p-3 text-sm max-w-xs ${
                message.isBot 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white' 
                  : 'bg-purple-600 text-white inline-block'
              }`}>
                <p>{message.text}</p>
              </div>
            </div>
          ))}
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
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={sendMessage}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <div className="flex justify-between mt-2">
            <button className="text-xs text-gray-500 hover:text-purple-600 transition-colors">
              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice Chat
            </button>
            <span className="text-xs text-gray-400">Conversations are recorded for continuity</span>
          </div>
        </div>
      </div>

      {/* Chat Button */}
      <div 
        onClick={toggleChat}
        className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-pulse"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    </div>
  );
}
