import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugLinkedInProfile() {
  const linkedinUrl = 'https://www.linkedin.com/in/rgluo/';
  
  console.log('🔍 DEBUGGING LINKEDIN PROFILE SCRAPING');
  console.log('='.repeat(50));
  console.log(`URL: ${linkedinUrl}`);
  console.log('');

  // Step 1: URL Validation
  console.log('📋 Step 1: URL Validation');
  try {
    const urlObj = new URL(linkedinUrl);
    const isValid = urlObj.hostname === 'www.linkedin.com' || urlObj.hostname === 'linkedin.com';
    console.log(`✅ URL is valid: ${isValid}`);
    console.log(`   Hostname: ${urlObj.hostname}`);
    console.log(`   Path: ${urlObj.pathname}`);
  } catch (error) {
    console.log(`❌ URL validation failed: ${error.message}`);
    return;
  }

  // Step 2: Test HTTP Request
  console.log('\n🌐 Step 2: Testing HTTP Request');
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  
  try {
    console.log('   Sending request with headers...');
    const response = await axios.get(linkedinUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
      validateStatus: (status) => true, // Accept all status codes
    });

    console.log(`   📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`   📏 Content Length: ${response.data.length} characters`);
    
    // Check for common LinkedIn responses
    if (response.status === 404) {
      console.log('   ❌ Profile not found (404)');
      console.log('   Possible reasons:');
      console.log('   • Profile is private or doesn\'t exist');
      console.log('   • URL is incorrect');
      console.log('   • Profile has been deleted');
      return;
    }
    
    if (response.status === 429) {
      console.log('   ⚠️  Rate limited (429)');
      console.log('   Too many requests - need to wait before retrying');
      return;
    }
    
    if (response.status === 403) {
      console.log('   🚫 Access forbidden (403)');
      console.log('   LinkedIn is blocking this request');
      return;
    }
    
    if (response.status === 301 || response.status === 302) {
      console.log('   🔄 Redirect detected');
      console.log(`   Location: ${response.headers.location}`);
      return;
    }
    
    if (response.status !== 200) {
      console.log(`   ⚠️  Unexpected status code: ${response.status}`);
      console.log('   Response preview:', response.data.substring(0, 200));
      return;
    }

    console.log('   ✅ Got successful response (200)');
    
    // Step 3: Parse HTML
    console.log('\n🔍 Step 3: HTML Analysis');
    const $ = cheerio.load(response.data);
    
    // Check for common LinkedIn elements
    const title = $('title').text();
    console.log(`   Page Title: ${title}`);
    
    // Check for profile-specific content
    const hasProfileContent = response.data.includes('profile') || 
                             response.data.includes('experience') ||
                             response.data.includes('education');
    console.log(`   Has Profile Content: ${hasProfileContent}`);
    
    // Check for login prompts
    const hasLoginPrompt = response.data.includes('signin') || 
                          response.data.includes('login') ||
                          response.data.includes('join');
    console.log(`   Has Login Prompt: ${hasLoginPrompt}`);
    
    // Check for error messages
    const hasErrorMessage = response.data.includes('error') || 
                           response.data.includes('not found') ||
                           response.data.includes('unavailable');
    console.log(`   Has Error Message: ${hasErrorMessage}`);
    
    // Try to extract basic info
    console.log('\n🎯 Step 4: Data Extraction Test');
    
    // Test name selectors
    const nameSelectors = [
      'h1.text-heading-xlarge',
      'h1.inline.t-24.v-align-middle.break-words',
      '.pv-top-card__name',
      '.text-heading-xlarge',
    ];
    
    let foundName = false;
    for (const selector of nameSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const name = element.text().trim();
        console.log(`   Found name with "${selector}": ${name}`);
        foundName = true;
        break;
      }
    }
    
    if (!foundName) {
      console.log('   ❌ No name found with standard selectors');
      console.log('   This suggests the profile might be:');
      console.log('   • Private or restricted');
      console.log('   • Using different HTML structure');
      console.log('   • Requiring authentication');
    }
    
    // Test experience selectors
    const experienceSelectors = [
      'section[data-field="experience_panel"] li',
      '.pv-experience-section__position-item',
      'div#experience + div ul li',
    ];
    
    let foundExperience = false;
    for (const selector of experienceSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`   Found ${elements.length} experience entries with "${selector}"`);
        foundExperience = true;
        break;
      }
    }
    
    if (!foundExperience) {
      console.log('   ❌ No experience data found with standard selectors');
    }
    
    console.log('\n📋 Step 5: Summary');
    console.log('Based on the analysis:');
    
    if (response.status === 200 && hasProfileContent) {
      console.log('✅ The profile is accessible and has content');
      if (!foundName || !foundExperience) {
        console.log('⚠️  But LinkedIn may have changed their HTML structure');
        console.log('   The scraper needs selector updates');
      }
    } else if (hasLoginPrompt) {
      console.log('🚫 LinkedIn is redirecting to login page');
      console.log('   This profile requires authentication to view');
    } else if (hasErrorMessage) {
      console.log('❌ LinkedIn is showing an error page');
      console.log('   The profile might not exist or be restricted');
    } else {
      console.log('❓ Unclear what the issue is');
      console.log('   Need to investigate the HTML response further');
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.log('   Request timed out (10 seconds)');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   Domain not found - check internet connection');
    } else if (error.response) {
      console.log(`   HTTP Error: ${error.response.status}`);
    } else {
      console.log('   Network or configuration error');
    }
  }
}

debugLinkedInProfile();