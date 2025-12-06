import { DataExtractor } from './api/utils/dataExtractor';
import { readFileSync } from 'fs';

async function testExtraction() {
  try {
    const resumeText = readFileSync('./test-resume-simple.txt', 'utf-8');
    console.log('Testing resume text extraction...');
    console.log('Input text length:', resumeText.length);
    
    const extractor = new DataExtractor();
    const result = await extractor.extractInformation(resumeText, 'resume');
    
    console.log('Extraction successful!');
    console.log('Personal Info:', result.personalInfo);
    console.log('Education:', result.education);
    console.log('Experience:', result.experience);
    console.log('Skills:', result.skills);
    
  } catch (error) {
    console.error('Extraction failed:', error);
  }
}

testExtraction();