// Simple Test Call Script for Avichal Mind Voice AI
const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// IMPORTANT: Update this to your phone number
const testPhoneNumber = '+919876543210'; // Replace with your actual phone number

if (!accountSid || !authToken || !fromNumber) {
  console.error('❌ Missing Twilio credentials');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function makeSimpleTestCall() {
  console.log('📞 Making simple test call...');
  console.log('🎯 Testing basic speech recognition');
  
  try {
    const call = await client.calls.create({
      url: 'https://avichal-mind.vercel.app/api/voice-webhook',
      to: testPhoneNumber,
      from: fromNumber,
      timeout: 30,
      record: false
    });

    console.log('✅ Call initiated!');
    console.log(`📋 Call SID: ${call.sid}`);
    console.log('');
    console.log('� Test these simple phrases:');
    console.log('   - "Hello"');
    console.log('   - "I am stressed"');
    console.log('   - "Hindi mein baat karte hain"');
    console.log('   - "Marathi madhe bola"');
    console.log('');
    console.log('📞 Expected behavior:');
    console.log('   1. Short greeting: "Hi! I\'m Avichal Mind Assistant. How can I help you today?"');
    console.log('   2. AI should respond to ANY speech (no confidence filtering)');
    console.log('   3. Simple prompts like "Anything else?" for follow-ups');
    console.log('   4. Clean "Thank you. Goodbye." at the end');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

makeSimpleTestCall();