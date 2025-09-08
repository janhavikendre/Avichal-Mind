import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'success',
    message: 'Webhook endpoint is accessible',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    url: request.url
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const allData = Object.fromEntries(formData.entries());
    
    return NextResponse.json({
      status: 'success',
      message: 'Webhook POST endpoint is working',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      receivedData: allData
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Webhook POST endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
