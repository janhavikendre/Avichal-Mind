'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestDBPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testDatabase = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setTestResult(data);
      console.log('Database test result:', data);
    } catch (error) {
      console.error('Error testing database:', error);
      setTestResult({ error: 'Failed to test database' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Connection Test</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Database Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testDatabase} 
              disabled={isTesting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isTesting ? 'Testing...' : 'Test Database Connection'}
            </Button>
          </CardContent>
        </Card>

        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>Test Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Environment Variables Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>MONGODB_URI:</strong> {process.env.NEXT_PUBLIC_MONGODB_URI ? 'Set' : 'Not set (private)'}</p>
              <p><strong>CLERK_SECRET_KEY:</strong> {process.env.NEXT_PUBLIC_CLERK_SECRET_KEY ? 'Set' : 'Not set (private)'}</p>
              <p><strong>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:</strong> {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Not set'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
