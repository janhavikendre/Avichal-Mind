'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, MicOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  contentText: string;
  contentAudioUrl?: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  mode: 'text' | 'voice';
  language: 'en' | 'hi' | 'mr';
  onMessageSent?: (message: Message) => void;
}

export default function ChatInterface({ 
  sessionId, 
  mode, 
  language, 
  onMessageSent 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
  }, [sessionId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const userMessage = newMessage.trim();
    setNewMessage('');

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      contentText: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/session/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage,
          isAudio: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Remove temp message and add real messages
        setMessages(prev => {
          const filtered = prev.filter(msg => msg._id !== tempUserMessage._id);
          return [...filtered, {
            _id: `user-${Date.now()}`,
            role: 'user',
            contentText: userMessage,
            createdAt: new Date().toISOString(),
          }, data.message];
        });

        if (onMessageSent) {
          onMessageSent(data.message);
        }
      } else {
        const errorData = await response.json();
        if (errorData.error === 'crisis_detected') {
          toast.error('Crisis detected. Please contact support immediately.');
        } else {
          toast.error('Failed to send message');
        }
        
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    toast(isRecording ? 'Recording stopped' : 'Recording started');
    // TODO: Implement voice recording functionality
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start your conversation here...</p>
            <p className="text-sm mt-2">
              {language === 'hi' ? 'अपनी बातचीत यहाँ शुरू करें...' : 
               language === 'mr' ? 'तुमची संवाद येथे सुरू करा...' : 
               'Begin your wellness journey'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100'
              }`}>
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <p className="text-sm">{message.contentText}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                                         {message.role === 'assistant' && message.contentAudioUrl && (
                                               <Button className="text-sm bg-purple-600 hover:bg-purple-700 text-white">
                          🔊
                        </Button>
                     )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                language === 'hi' 
                  ? 'अपना संदेश यहाँ लिखें...' 
                  : language === 'mr'
                  ? 'तुमचा संदेश येथे लिहा...'
                  : 'Type your message here...'
              }
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={isSending}
            />
          </div>
          <div className="flex flex-col space-y-2">
                         {mode === 'voice' && (
                               <Button
                  onClick={toggleRecording}
                  className={`h-10 w-10 p-0 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </Button>
             )}
                           <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
                className="h-10 w-10 p-0 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Send size={16} />
              </Button>
          </div>
        </div>
        
                 {/* Mode and Language Badges */}
         <div className="flex space-x-2 mt-2">
           <Badge>
             {mode === 'voice' ? 'Voice' : 'Text'}
           </Badge>
                       <Badge>
              {language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}
            </Badge>
         </div>
      </div>
    </div>
  );
}
