'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSimplePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testDatabase = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/test-db-simple');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Simple Test Page</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Database Connection Test</CardTitle>
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
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Database Connection:</strong> ✅ Working (as shown in terminal)</p>
              <p><strong>Clerk Authentication:</strong> ❌ Needs valid keys</p>
              <p><strong>MongoDB URI:</strong> ✅ Set correctly</p>
              <p><strong>Environment Variables:</strong> ⚠️ Need to update Clerk keys</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. <strong>Get Clerk Keys:</strong> Go to https://dashboard.clerk.com/ and get your API keys</p>
              <p>2. <strong>Update .env.local:</strong> Replace the placeholder keys with real ones</p>
              <p>3. <strong>Restart Server:</strong> Run `npm run dev` again</p>
              <p>4. <strong>Test Authentication:</strong> Try signing in again</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
