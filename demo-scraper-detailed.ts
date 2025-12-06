import axios from 'axios';
import * as cheerio from 'cheerio';

async function demonstrateLinkedInScraping() {
  console.log('🔍 LINKEDIN SCRAPER DEEP DIVE');
  console.log('='.repeat(50));
  
  const linkedinUrl = 'https://www.linkedin.com/in/williamhgates';
  
  console.log(`\n🎯 Target Profile: ${linkedinUrl}`);
  console.log('\n📋 Step 1: URL Validation');
  console.log('   Checking if URL is valid LinkedIn profile...');
  
  // URL Validation
  try {
    const urlObj = new URL(linkedinUrl);
    const isValid = urlObj.hostname === 'www.linkedin.com' || urlObj.hostname === 'linkedin.com';
    console.log(`   ✅ Valid LinkedIn URL: ${isValid}`);
  } catch (error) {
    console.log('   ❌ Invalid URL format');
    return;
  }
  
  console.log('\n⏱️  Step 2: Rate Limiting');
  console.log('   Adding 2-second delay to respect LinkedIn limits...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n🌐 Step 3: HTTP Request Setup');
  console.log('   Configuring browser-like headers...');
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };
  
  console.log('   Headers configured:', Object.keys(headers));
  
  try {
    console.log('\n📡 Step 4: Sending Request');
    console.log('   Fetching LinkedIn page...');
    
    const response = await axios.get(linkedinUrl, {
      headers,
      timeout: 10000,
    });
    
    console.log(`   ✅ Response received: ${response.status} ${response.statusText}`);
    console.log(`   📊 Content length: ${response.data.length} characters`);
    
    console.log('\n🔍 Step 5: HTML Parsing with Cheerio');
    const $ = cheerio.load(response.data);
    
    // Show a sample of the HTML structure
    console.log('   Sample HTML structure found:');
    console.log('   - Title:', $('title').text().substring(0, 100) + '...');
    console.log('   - Meta description:', $('meta[name="description"]').attr('content')?.substring(0, 100) + '...');
    
    console.log('\n🎯 Step 6: Data Extraction Strategy');
    console.log('   Using multiple CSS selectors for each data point...');
    
    // Extract name with multiple selectors
    console.log('\n   👤 Name Extraction:');
    const nameSelectors = [
      'h1.text-heading-xlarge',
      'h1.inline.t-24.v-align-middle.break-words',
      '.pv-top-card__name',
      '.text-heading-xlarge',
    ];
    
    let extractedName = 'Unknown Name';
    for (const selector of nameSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const name = element.text().trim();
        console.log(`   Trying selector: "${selector}"`);
        console.log(`   Found: "${name}"`);
        if (name.length > 0) {
          extractedName = name;
          break;
        }
      }
    }
    
    console.log(`   ✅ Final name: ${extractedName}`);
    
    // Extract experience
    console.log('\n   💼 Experience Extraction:');
    const experienceSelectors = [
      'section[data-field="experience_panel"] li',
      '.pv-experience-section__position-item',
      'div#experience + div ul li',
    ];
    
    const experiences = [];
    for (const selector of experienceSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`   Using selector: "${selector}"`);
        console.log(`   Found ${elements.length} experience entries`);
        
        elements.each((index, element) => {
          const position = $(element).find('h3').first().text().trim();
          const company = $(element).find('p').first().text().trim();
          if (position || company) {
            experiences.push({ position, company });
          }
        });
        break;
      }
    }
    
    console.log('   Extracted experiences:');
    experiences.forEach((exp, i) => {
      console.log(`   ${i + 1}. ${exp.position} at ${exp.company}`);
    });
    
    // Extract summary/about section
    console.log('\n   📝 Summary Extraction:');
    const summarySelectors = [
      'div.inline-show-more-text span[aria-hidden="true"]',
      '.pv-about__summary-text',
      '.summary',
      'div#about + div p',
    ];
    
    let summary = 'Not found';
    for (const selector of summarySelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 0 && text.length < 1000) {
          summary = text.substring(0, 150) + '...';
          console.log(`   Found with selector: "${selector}"`);
          break;
        }
      }
    }
    
    console.log(`   Summary: ${summary}`);
    
    console.log('\n⚠️  Step 7: Anti-Scraping Challenges');
    console.log('   LinkedIn implements several anti-scraping measures:');
    console.log('   - Dynamic content loading with JavaScript');
    console.log('   - Rate limiting and IP blocking');
    console.log('   - CAPTCHA challenges for suspicious activity');
    console.log('   - Frequently changing HTML structure');
    console.log('   - Requiring authentication for detailed profiles');
    
    console.log('\n🔧 Step 8: Scraping Strategy Summary');
    console.log('   ✅ Multiple selector fallbacks for robustness');
    console.log('   ✅ Rate limiting (2-second delays)');
    console.log('   ✅ Browser-like headers to avoid detection');
    console.log('   ✅ Error handling for different response types');
    console.log('   ✅ Timeout protection (10 seconds)');
    
  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    
    if (error.response) {
      console.log('   Response error:', error.response.status, error.response.statusText);
    } else if (error.request) {
      console.log('   Request error: No response received');
    } else {
      console.log('   Setup error:', error.message);
    }
  }
}

demonstrateLinkedInScraping();