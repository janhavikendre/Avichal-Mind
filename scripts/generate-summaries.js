const { connectDB } = require('../src/lib/db');
const { SummaryService } = require('../src/services/summary');

async function generateSummaries() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('📊 Generating summaries for existing sessions...');
    const result = await SummaryService.generateSummariesForAllSessions();
    
    console.log('\n📋 Summary Generation Results:');
    console.log(`✅ Successfully generated: ${result.successful}`);
    console.log(`⏭️  Skipped (insufficient content): ${result.skipped}`);
    console.log(`❌ Failed: ${result.failed}`);
    console.log(`📝 Total processed: ${result.totalProcessed}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n✨ Summary generation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating summaries:', error);
    process.exit(1);
  }
}

generateSummaries();
