import axios from 'axios';

export interface LLMConfig {
  provider: 'deepseek' | 'openai' | 'anthropic' | 'openrouter';
  apiKey: string;
  model?: string;
  baseURL?: string;
}

export interface ResumeExtractionRequest {
  text: string;
  source: 'resume' | 'linkedin';
}

export interface ResumeExtractionResponse {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    location?: string;
  }>;
  skills: string[];
  summary?: string;
  topCompetences?: string[];
  topAchievements?: string[];
  studyWorkAlignment?: string;
}

export class LLMResumeExtractor {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async extractResumeInformation(request: ResumeExtractionRequest): Promise<ResumeExtractionResponse> {
    const prompt = this.createExtractionPrompt(request.text, request.source);
    
    try {
      const response = await this.callLLM(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('LLM extraction failed:', error);
      throw new Error('Failed to extract resume information using LLM');
    }
  }

  private createExtractionPrompt(text: string, source: string): string {
    return `You are an expert resume parser. Extract structured information from the following ${source} text and return it as a valid JSON object.

Text to analyze:
"""
${text}
"""

Extract the following information:

1. **Personal Information**:
   - Full name (required)
   - Email address (if present)
   - Phone number (if present)
   - Location (if present)
   - LinkedIn URL (if present)

2. **Education** (array of objects):
   - Institution name
   - Degree type (Bachelor, Master, PhD, etc.)
   - Field of study
   - Start date
   - End date
   - GPA (if mentioned)

3. **Work Experience** (array of objects):
   - Company name
   - Job title/position
   - Start date
   - End date (or "Present" if current)
   - Job description/bullet points
   - Location (if mentioned)

4. **Skills** (array of strings):
   - Technical skills
   - Soft skills
   - Languages
   - Tools and technologies

5. **Professional Summary** (if present):
   - Comprehensive overview of the resume content
   - Cover roles, impact, technologies, leadership, and education
   - Limit to a maximum of 1000 words

6. **Top Competences**:
   - Top 5 core competences inferred from experience and skills

7. **Top Achievements**:
   - Top 5 quantified achievements from experience or projects

8. **Study-Work Alignment**:
   - Assess whether work experience is related to the study major
   - Return one of: "Related", "Partially Related", "Not Related"
   - Base on relevance of roles/responsibilities to the field of study
   - Mention this alignment succinctly within the summary

**IMPORTANT GUIDELINES:**
- Return ONLY valid JSON, no additional text
- Use consistent date formats (YYYY-MM or YYYY)
- If information is not present, use null or omit the field
- Be accurate and extract only verifiable information
- For dates, use "Present" for current positions
- For skills, be specific and avoid generic terms
 - Do not exceed 1000 words in the summary

Return the JSON in this exact structure:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string", 
    "location": "string",
    "linkedin": "string"
  },
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string",
      "location": "string"
    }
  ],
  "skills": ["string"],
  "summary": "string",
  "topCompetences": ["string"],
  "topAchievements": ["string"],
  "studyWorkAlignment": "string"
}`;
  }

  private async callLLM(prompt: string): Promise<string> {
    switch (this.config.provider) {
      case 'deepseek':
        return this.callDeepSeek(prompt);
      case 'openai':
        return this.callOpenAI(prompt);
      case 'anthropic':
        return this.callAnthropic(prompt);
      case 'openrouter':
        return this.callOpenRouter(prompt);
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }

  private async callDeepSeek(prompt: string): Promise<string> {
    const response = await axios.post(
      this.config.baseURL || 'https://api.deepseek.com/v1/chat/completions',
      {
        model: this.config.model || 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text;
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: this.config.model || 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Resume Extractor'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  private truncateWords(input: string | undefined, max: number): string | undefined {
    if (!input) return input;
    const words = input.trim().split(/\s+/);
    if (words.length <= max) return input;
    return words.slice(0, max).join(' ') + '…';
  }

  private parseResponse(response: string): ResumeExtractionResponse {
    try {
      const parsed = JSON.parse(response);
      
      // Validate the response structure
      if (!parsed.personalInfo || !parsed.personalInfo.name) {
        throw new Error('Invalid response: missing personalInfo.name');
      }
      
      if (!Array.isArray(parsed.education)) {
        parsed.education = [];
      }
      
      if (!Array.isArray(parsed.experience)) {
        parsed.experience = [];
      }
      
      if (!Array.isArray(parsed.skills)) {
        parsed.skills = [];
      }
      
      return {
        personalInfo: {
          name: parsed.personalInfo.name || 'Unknown Name',
          email: parsed.personalInfo.email,
          phone: parsed.personalInfo.phone,
          location: parsed.personalInfo.location,
          linkedin: parsed.personalInfo.linkedin,
        },
        education: parsed.education.map((edu: any) => ({
          institution: edu.institution || 'Unknown Institution',
          degree: edu.degree || 'Unknown Degree',
          field: edu.field || 'Unknown Field',
          startDate: edu.startDate || 'Unknown',
          endDate: edu.endDate || 'Unknown',
          gpa: edu.gpa,
        })),
        experience: parsed.experience.map((exp: any) => ({
          company: exp.company || 'Unknown Company',
          position: exp.position || 'Unknown Position',
          startDate: exp.startDate || 'Unknown',
          endDate: exp.endDate || 'Unknown',
          description: exp.description || '',
          location: exp.location,
        })),
        skills: parsed.skills || [],
        summary: this.truncateWords(parsed.summary, 1000),
        topCompetences: Array.isArray(parsed.topCompetences) ? parsed.topCompetences : [],
        topAchievements: Array.isArray(parsed.topAchievements) ? parsed.topAchievements : [],
        studyWorkAlignment: typeof parsed.studyWorkAlignment === 'string' ? parsed.studyWorkAlignment : undefined,
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Response:', response);
      throw new Error('Invalid JSON response from LLM');
    }
  }
}