'use client';

import { useState } from 'react';

export default function TestYouTubePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testYouTubeAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-youtube');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to test YouTube API' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          YouTube API Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Test YouTube API Connection
          </h2>
          
          <button
            onClick={testYouTubeAPI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium"
          >
            {loading ? 'Testing...' : 'Test YouTube API'}
          </button>
        </div>

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Results
            </h2>
            
            <div className="space-y-4">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">API Key Configured: </span>
                <span className={`font-medium ${result.apiKeyConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {result.apiKeyConfigured ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Success: </span>
                <span className={`font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? 'Yes' : 'No'}
                </span>
              </div>
              
              {result.videoCount !== undefined && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Videos Found: </span>
                  <span className="font-medium text-blue-600">{result.videoCount}</span>
                </div>
              )}
              
              {result.error && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Error: </span>
                  <span className="font-medium text-red-600">{result.error}</span>
                </div>
              )}
              
              {result.videos && result.videos.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Sample Videos:</h3>
                  <div className="space-y-2">
                    {result.videos.slice(0, 3).map((video: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded p-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">{video.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{video.channelTitle}</p>
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Watch Video
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            How to Test Video Suggestions
          </h2>
          
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>To test video suggestions in the chat, try these messages:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>"I'm feeling stressed" (after 2+ messages)</li>
              <li>"I need help with anxiety" (after 2+ messages)</li>
              <li>"Show me videos" (immediately)</li>
              <li>"I'm having a panic attack" (crisis response)</li>
              <li>"I'm feeling overwhelmed" (wellness topic)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
