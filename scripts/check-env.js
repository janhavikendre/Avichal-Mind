#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment setup...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

console.log(`📁 .env file exists: ${envExists ? '✅ Yes' : '❌ No'}`);

if (!envExists) {
  console.log('\n⚠️  No .env file found! Please create one based on env.example');
  console.log('   Copy env.example to .env and fill in your values');
  process.exit(1);
}

// Read and parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key] = valueParts.join('=');
    }
  }
});

// Check required environment variables
const requiredVars = [
  'MONGODB_URI',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

const optionalVars = [
  'CLERK_WEBHOOK_SECRET',
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY',
  'DEEPGRAM_API_KEY',
  'AZURE_SPEECH_KEY',
  'AZURE_SPEECH_REGION'
];

console.log('\n📋 Required Environment Variables:');
let allRequiredSet = true;

requiredVars.forEach(varName => {
  const value = envVars[varName];
  const isSet = value && value !== 'your_value_here' && value !== '';
  console.log(`   ${varName}: ${isSet ? '✅ Set' : '❌ Not set or invalid'}`);
  if (!isSet) allRequiredSet = false;
});

console.log('\n📋 Optional Environment Variables:');
optionalVars.forEach(varName => {
  const value = envVars[varName];
  const isSet = value && value !== 'your_value_here' && value !== '';
  console.log(`   ${varName}: ${isSet ? '✅ Set' : '⚠️  Not set'}`);
});

console.log('\n🔧 Environment Setup Summary:');
if (allRequiredSet) {
  console.log('✅ All required environment variables are set!');
  console.log('   You should be able to run the application.');
} else {
  console.log('❌ Some required environment variables are missing or invalid.');
  console.log('   Please check the .env file and ensure all required variables are set.');
  process.exit(1);
}

// Check MongoDB URI format
const mongoUri = envVars.MONGODB_URI;
if (mongoUri) {
  console.log('\n🔍 MongoDB URI Check:');
  if (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://')) {
    console.log('✅ MongoDB URI format looks correct');
  } else {
    console.log('❌ MongoDB URI format may be incorrect');
    console.log('   Should start with mongodb:// or mongodb+srv://');
  }
}

// Check Clerk keys format
const clerkPublishableKey = envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = envVars.CLERK_SECRET_KEY;

console.log('\n🔍 Clerk Keys Check:');
if (clerkPublishableKey && clerkPublishableKey.startsWith('pk_')) {
  console.log('✅ Clerk Publishable Key format looks correct');
} else {
  console.log('❌ Clerk Publishable Key format may be incorrect');
  console.log('   Should start with pk_');
}

if (clerkSecretKey && clerkSecretKey.startsWith('sk_')) {
  console.log('✅ Clerk Secret Key format looks correct');
} else {
  console.log('❌ Clerk Secret Key format may be incorrect');
  console.log('   Should start with sk_');
}

console.log('\n🎉 Environment check completed!');
console.log('\n💡 Next steps:');
console.log('   1. Run: npm run dev');
console.log('   2. Visit: http://localhost:3000/api/test-db');
console.log('   3. Check the console for any errors');
