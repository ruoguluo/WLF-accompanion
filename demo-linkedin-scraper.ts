import { LinkedInScraper } from './api/utils/linkedInScraper';

async function demonstrateScraping() {
  console.log('🚀 LinkedIn Scraper Demonstration\n');
  
  const scraper = new LinkedInScraper();
  const testUrl = 'https://www.linkedin.com/in/williamhgates';
  
  console.log('📋 Step 1: Validating URL');
  console.log(`   Testing URL: ${testUrl}`);
  
  try {
    console.log('\n🌐 Step 2: Sending HTTP Request');
    console.log('   - Adding 2-second delay for rate limiting');
    console.log('   - Using browser-like User-Agent');
    console.log('   - Setting appropriate headers');
    
    const profile = await scraper.scrapeProfile(testUrl);
    
    console.log('\n📊 Step 3: Data Extraction Results');
    console.log('   ✅ Profile scraped successfully!\n');
    
    console.log('📈 Extracted Information:');
    console.log(`   👤 Name: ${profile.name}`);
    console.log(`   📝 Title: ${profile.title || 'Not found'}`);
    console.log(`   📍 Location: ${profile.location || 'Not found'}`);
    console.log(`   🔗 LinkedIn: ${profile.linkedin}`);
    console.log(`   📖 Summary: ${profile.summary ? profile.summary.substring(0, 100) + '...' : 'Not found'}`);
    
    console.log(`\n💼 Experience (${profile.experience.length} positions):`);
    profile.experience.forEach((exp, index) => {
      console.log(`   ${index + 1}. ${exp.position} at ${exp.company}`);
      console.log(`      ${exp.startDate} - ${exp.endDate}`);
      if (exp.description) {
        console.log(`      Description: ${exp.description.substring(0, 80)}...`);
      }
    });
    
    console.log(`\n🎓 Education (${profile.education.length} entries):`);
    profile.education.forEach((edu, index) => {
      console.log(`   ${index + 1}. ${edu.degree} in ${edu.field}`);
      console.log(`      ${edu.institution} (${edu.startDate} - ${edu.endDate})`);
    });
    
    console.log(`\n🛠️  Skills (${profile.skills.length}):`);
    console.log(`   ${profile.skills.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
  }
}

demonstrateScraping();