import { DataExtractor, ExtractedProfile } from './dataExtractor';
import { LLMResumeExtractor, LLMConfig } from '../services/llmExtractor';

export class EnhancedDataExtractor {
  private traditionalExtractor: DataExtractor;
  private llmExtractor?: LLMResumeExtractor;
  private useLLMPrimary: boolean;

  constructor(useLLMPrimary = false, llmConfig?: LLMConfig) {
    this.traditionalExtractor = new DataExtractor();
    this.useLLMPrimary = useLLMPrimary;
    
    if (llmConfig) {
      this.llmExtractor = new LLMResumeExtractor(llmConfig);
    }
  }

  async extractInformation(text: string, source: 'resume' | 'linkedin'): Promise<ExtractedProfile> {
    // If LLM is configured and we want to use it as primary
    if (this.llmExtractor && this.useLLMPrimary) {
      try {
        console.log('Using LLM for primary extraction...');
        const llmResult = await this.llmExtractor.extractResumeInformation({
          text,
          source
        });
        
        // Convert LLM format to our format
        return this.convertLLMToOurFormat(llmResult, source);
      } catch (error) {
        console.error('LLM extraction failed, falling back to traditional method:', error);
        return this.traditionalExtractor.extractInformation(text, source);
      }
    }
    
    // Traditional method first, LLM as fallback
    try {
      console.log('Using traditional extraction method...');
      const result = await this.traditionalExtractor.extractInformation(text, source);
      
      // If traditional method gives poor results and LLM is available, try LLM
      if (this.llmExtractor && this.shouldUseLLMFallback(result)) {
        console.log('Traditional extraction quality is low, trying LLM fallback...');
        try {
          const llmResult = await this.llmExtractor.extractResumeInformation({
            text,
            source
          });
          return this.convertLLMToOurFormat(llmResult, source);
        } catch (llmError) {
          console.error('LLM fallback also failed, using traditional result:', llmError);
          return result;
        }
      }
      
      return result;
    } catch (error) {
      // If traditional method fails completely and LLM is available
      if (this.llmExtractor) {
        console.error('Traditional extraction failed, trying LLM...', error);
        try {
          const llmResult = await this.llmExtractor.extractResumeInformation({
            text,
            source
          });
          return this.convertLLMToOurFormat(llmResult, source);
        } catch (llmError) {
          console.error('Both extraction methods failed:', llmError);
          throw error; // Throw original error
        }
      }
      
      throw error;
    }
  }

  private shouldUseLLMFallback(result: ExtractedProfile): boolean {
    // Check if traditional extraction gave poor results
    const hasPoorResults = 
      result.personalInfo.name === 'Unknown Name' ||
      result.education.length === 0 && result.experience.length === 0 ||
      result.skills.length < 3;
    
    return hasPoorResults;
  }

  private convertLLMToOurFormat(llmResult: any, source: 'resume' | 'linkedin'): ExtractedProfile {
    return {
      personalInfo: {
        name: llmResult.personalInfo.name || 'Unknown Name',
        email: llmResult.personalInfo.email,
        phone: llmResult.personalInfo.phone,
        location: llmResult.personalInfo.location,
        linkedin: llmResult.personalInfo.linkedin,
      },
      education: llmResult.education || [],
      experience: llmResult.experience || [],
      skills: llmResult.skills || [],
      summary: llmResult.summary,
      topCompetences: llmResult.topCompetences || [],
      topAchievements: llmResult.topAchievements || [],
      studyWorkAlignment: llmResult.studyWorkAlignment,
      extractedAt: new Date().toISOString(),
      source,
    };
  }
}

// Factory function to create enhanced extractor based on environment
export function createEnhancedExtractor(): EnhancedDataExtractor {
  const llmConfig = getLLMConfigFromEnvironment();
  const useLLMPrimary = process.env.USE_LLM_PRIMARY === 'true';
  
  return new EnhancedDataExtractor(useLLMPrimary, llmConfig);
}

function getLLMConfigFromEnvironment(): LLMConfig | undefined {
  const provider = process.env.DEFAULT_LLM_PROVIDER as LLMConfig['provider'];
  
  switch (provider) {
    case 'deepseek':
      if (process.env.DEEPSEEK_API_KEY) {
        return {
          provider: 'deepseek',
          apiKey: process.env.DEEPSEEK_API_KEY,
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          baseURL: process.env.DEEPSEEK_BASE_URL,
        };
      }
      break;
      
    case 'openai':
      if (process.env.OPENAI_API_KEY) {
        return {
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        };
      }
      break;
      
    case 'anthropic':
      if (process.env.ANTHROPIC_API_KEY) {
        return {
          provider: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        };
      }
      break;
      
    case 'openrouter':
      if (process.env.OPENROUTER_API_KEY) {
        return {
          provider: 'openrouter',
          apiKey: process.env.OPENROUTER_API_KEY,
          model: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
        };
      }
      break;
  }
  
  return undefined;
}