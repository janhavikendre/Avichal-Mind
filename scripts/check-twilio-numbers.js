#!/usr/bin/env node

/**
 * Check what phone numbers are available in your Twilio account
 */

const twilio = require('twilio');
require('dotenv').config({ path: '.env.local' });

async function checkTwilioNumbers() {
  console.log('📞 Checking your Twilio phone numbers...\n');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.log('❌ Missing Twilio credentials in .env.local');
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    
    // Get all phone numbers
    const incomingNumbers = await client.incomingPhoneNumbers.list();
    
    console.log(`📋 Found ${incomingNumbers.length} phone number(s) in your account:\n`);
    
    if (incomingNumbers.length === 0) {
      console.log('❌ No phone numbers found in your account.');
      console.log('💡 You need to buy a phone number from Twilio Console.');
      console.log('   Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
      return;
    }
    
    incomingNumbers.forEach((number, index) => {
      console.log(`${index + 1}. Phone Number: ${number.phoneNumber}`);
      console.log(`   Friendly Name: ${number.friendlyName || 'No name'}`);
      console.log(`   Status: ${number.status}`);
      console.log(`   Voice URL: ${number.voiceUrl || 'Not set'}`);
      console.log('');
    });
    
    // Show the first number as the recommended one
    const firstNumber = incomingNumbers[0];
    console.log('✅ Recommended phone number to use:');
    console.log(`   ${firstNumber.phoneNumber}`);
    console.log('');
    console.log('📝 Update your .env.local file with:');
    console.log(`   TWILIO_PHONE_NUMBER=${firstNumber.phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Error checking phone numbers:', error.message);
  }
}

checkTwilioNumbers().catch(console.error);
