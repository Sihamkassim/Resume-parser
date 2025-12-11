const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('🔍 Gemini API Debugger\n');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : '❌ NOT FOUND');
console.log('─'.repeat(60));

async function debugGemini() {
  if (!apiKey) {
    console.error('\n❌ GEMINI_API_KEY not found in .env file');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Test different model names
  const modelsToTest = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'models/gemini-pro',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-flash'
  ];

  console.log('\n📋 Testing Available Models:\n');

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "OK" if you can read this');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} - WORKS!`);
      console.log(`   Response: ${text.substring(0, 50)}...\n`);
      
    } catch (error) {
      if (error.message.includes('API key not valid')) {
        console.log(`❌ ${modelName} - API KEY INVALID\n`);
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`⚠️  ${modelName} - Model not available\n`);
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        console.log(`⚠️  ${modelName} - Quota exceeded\n`);
      } else {
        console.log(`❌ ${modelName} - Error: ${error.message.substring(0, 80)}\n`);
      }
    }
  }

  // Try to list models using API
  console.log('\n─'.repeat(60));
  console.log('\n🔎 Attempting to list models via API:\n');
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log('✅ Available models:');
      data.models.forEach(model => {
        console.log(`   • ${model.name}`);
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`     ✓ Supports generateContent`);
        }
      });
    } else if (data.error) {
      console.log('❌ Error listing models:', data.error.message);
    }
  } catch (error) {
    console.log('⚠️  Could not list models:', error.message);
  }

  console.log('\n─'.repeat(60));
  console.log('\n💡 Recommendations:');
  console.log('   1. If API key is invalid, generate a new one at:');
  console.log('      https://aistudio.google.com/app/apikey');
  console.log('   2. Make sure you copy the entire key');
  console.log('   3. Update your .env file with the new key');
  console.log('   4. Restart your server\n');
}

debugGemini().catch(error => {
  console.error('\n❌ Debug failed:', error.message);
  process.exit(1);
});
