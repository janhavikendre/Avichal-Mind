#!/usr/bin/env node

/**
 * Test script for Twilio integration
 * Run this script to test your Twilio configuration
 */

const twilio = require('twilio');
require('dotenv').config({ path: '.env.local' });

async function testTwilioConfig() {
  console.log('🧪 Testing Twilio Configuration...\n');

  // Check environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  console.log('📋 Environment Variables:');
  console.log(`TWILIO_ACCOUNT_SID: ${accountSid ? '✅ Set' : '❌ Missing'}`);
  console.log(`TWILIO_AUTH_TOKEN: ${authToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`TWILIO_PHONE_NUMBER: ${phoneNumber ? '✅ Set' : '❌ Missing'}\n`);

  if (!accountSid || !authToken || !phoneNumber) {
    console.log('❌ Missing required Twilio environment variables!');
    console.log('Please add the following to your .env.local file:');
    console.log('TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('TWILIO_PHONE_NUMBER=your_twilio_phone_number');
    return;
  }

  try {
    // Initialize Twilio client
    const client = twilio(accountSid, authToken);
    console.log('🔗 Twilio client initialized successfully\n');

    // Test account connection
    console.log('🔍 Testing account connection...');
    const account = await client.api.accounts(accountSid).fetch();
    console.log(`✅ Connected to account: ${account.friendlyName}\n`);

    // Test phone number
    console.log('📞 Testing phone number...');
    const incomingNumbers = await client.incomingPhoneNumbers.list();
    const hasValidNumber = incomingNumbers.some(number => 
      number.phoneNumber === phoneNumber
    );
    
    if (hasValidNumber) {
      console.log(`✅ Phone number ${phoneNumber} is valid and active\n`);
    } else {
      console.log(`⚠️  Phone number ${phoneNumber} not found in your account`);
      console.log('Available numbers:');
      incomingNumbers.forEach(number => {
        console.log(`  - ${number.phoneNumber} (${number.friendlyName || 'No name'})`);
      });
      console.log('');
    }

    // Test webhook URL (you'll need to update this with your actual ngrok URL)
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('🌐 Webhook Configuration:');
    console.log(`Webhook URL: ${webhookUrl}/api/voice-webhook`);
    console.log('⚠️  Make sure to use ngrok for local testing:');
    console.log('  1. Install ngrok: npm install -g ngrok');
    console.log('  2. Run: ngrok http 3000');
    console.log('  3. Update NEXT_PUBLIC_APP_URL in .env.local with your ngrok URL\n');

    console.log('✅ Twilio configuration test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Set up ngrok for local testing');
    console.log('2. Update your Twilio phone number webhook URL to:');
    console.log(`   ${webhookUrl}/api/voice-webhook`);
    console.log('3. Test the phone input on your landing page');

  } catch (error) {
    console.error('❌ Twilio configuration test failed:');
    console.error(`Error: ${error.message}`);
    
    if (error.code === 20003) {
      console.log('\n💡 This usually means invalid credentials. Please check:');
      console.log('- TWILIO_ACCOUNT_SID is correct');
      console.log('- TWILIO_AUTH_TOKEN is correct');
    }
  }
}

// Run the test
testTwilioConfig().catch(console.error);
