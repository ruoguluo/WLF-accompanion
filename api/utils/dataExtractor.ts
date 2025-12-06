import natural from 'natural';

export interface PersonalInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  location?: string;
}

export interface ExtractedProfile {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: string[];
  summary?: string;
  extractedAt: string;
  source: 'resume' | 'linkedin';
  topCompetences?: string[];
  topAchievements?: string[];
  studyWorkAlignment?: string;
}

export class DataExtractor {
  private tokenizer: natural.WordTokenizer;
  private sentenceTokenizer: natural.SentenceTokenizer;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.sentenceTokenizer = new natural.SentenceTokenizer();
  }

  /**
   * Extract structured information from raw text
   */
  async extractInformation(text: string, source: 'resume' | 'linkedin'): Promise<ExtractedProfile> {
    try {
      const cleanedText = this.preprocessText(text);
      
      return {
        personalInfo: this.extractPersonalInfo(cleanedText),
        education: this.extractEducation(cleanedText),
        experience: this.extractExperience(cleanedText),
        skills: this.extractSkills(cleanedText),
        summary: this.extractSummary(cleanedText),
        extractedAt: new Date().toISOString(),
        source,
      };
    } catch (error) {
      console.error('Error extracting information:', error);
      throw new Error('Failed to extract information from text');
    }
  }

  /**
   * Preprocess text for better extraction
   */
  private preprocessText(text: string): string {
    return text
      .replace(/\n\s*\n/g, '\n\n') // Normalize multiple line breaks
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .trim();
  }

  /**
   * Extract personal information
   */
  private extractPersonalInfo(text: string): PersonalInfo {
    const lines = text.split('\n');
    const personalInfo: PersonalInfo = {
      name: this.extractName(text, lines),
      email: this.extractEmail(text),
      phone: this.extractPhone(text),
      location: this.extractLocation(text),
      linkedin: this.extractLinkedIn(text),
    };

    return personalInfo;
  }

  /**
   * Extract name (usually the first significant line)
   */
  private extractName(text: string, lines: string[]): string {
    // Look for name patterns and common resume structures
    const namePatterns = [
      /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/m, // First Last or First Middle Last
      /^([A-Z][a-z]+\s+[A-Z]\.?\s+[A-Z][a-z]+)$/m, // First MiddleInitial Last
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback: return the first non-empty line that looks like a name
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 50 && /^[A-Za-z\s\.]+$/.test(trimmed)) {
        return trimmed;
      }
    }

    return 'Unknown Name';
  }

  /**
   * Extract email address
   */
  private extractEmail(text: string): string | undefined {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : undefined;
  }

  /**
   * Extract phone number
   */
  private extractPhone(text: string): string | undefined {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0].replace(/\s+/g, ' ').trim() : undefined;
  }

  /**
   * Extract location
   */
  private extractLocation(text: string): string | undefined {
    // Look for common location patterns
    const locationRegex = /([A-Za-z\s]+,\s*[A-Za-z\s]{2,3}(?:\s+\d{5})?)/;
    const match = text.match(locationRegex);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extract LinkedIn URL
   */
  private extractLinkedIn(text: string): string | undefined {
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/;
    const match = text.match(linkedinRegex);
    return match ? (match[0].startsWith('http') ? match[0] : `https://${match[0]}`) : undefined;
  }

  /**
   * Extract education information
   */
  private extractEducation(text: string): Education[] {
    const education: Education[] = [];
    const sentences = this.sentenceTokenizer.tokenize(text);
    
    const educationKeywords = ['university', 'college', 'school', 'institute', 'degree', 'bachelor', 'master', 'phd', 'mba'];

    // Simple pattern matching for education entries
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for education keywords
      if (educationKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        const educationEntry = this.parseEducationLine(line, lines[i + 1]);
        if (educationEntry) {
          education.push(educationEntry);
        }
      }
    }

    // If no education found, try to extract from sentences
    if (education.length === 0) {
      for (const sentence of sentences) {
        if (educationKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
          const educationEntry = this.parseEducationSentence(sentence);
          if (educationEntry) {
            education.push(educationEntry);
          }
        }
      }
    }

    return education;
  }

  /**
   * Parse education line
   */
  private parseEducationLine(line: string, nextLine?: string): Education | null {
    // Simple parsing - in a real implementation, you'd want more sophisticated parsing
    const dateRegex = /(\d{4})\s*[-–—]\s*(\d{4}|Present)/i;
    const dateMatch = line.match(dateRegex) || (nextLine && nextLine.match(dateRegex));
    
    if (dateMatch) {
      const institution = line.replace(dateRegex, '').trim();
      return {
        institution: institution || 'Unknown Institution',
        degree: 'Unknown Degree',
        field: 'Unknown Field',
        startDate: dateMatch[1],
        endDate: dateMatch[2],
      };
    }

    return null;
  }

  /**
   * Parse education sentence
   */
  private parseEducationSentence(sentence: string): Education | null {
    const dateRegex = /(\d{4})\s*[-–—]\s*(\d{4}|Present)/i;
    const dateMatch = sentence.match(dateRegex);
    
    if (dateMatch) {
      return {
        institution: sentence.replace(dateRegex, '').trim() || 'Unknown Institution',
        degree: 'Unknown Degree',
        field: 'Unknown Field',
        startDate: dateMatch[1],
        endDate: dateMatch[2],
      };
    }

    return null;
  }

  /**
   * Extract work experience
   */
  private extractExperience(text: string): Experience[] {
    const experience: Experience[] = [];
    const lines = text.split('\n');
    
    const experienceKeywords = ['experience', 'employment', 'work', 'career', 'professional'];

    // Look for experience section and parse job entries
    let inExperienceSection = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we're entering an experience section
      if (experienceKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        inExperienceSection = true;
        continue;
      }

      // If we're in experience section, look for job patterns
      if (inExperienceSection && line.length > 0) {
        const experienceEntry = this.parseExperienceLine(line, lines[i + 1], lines[i + 2]);
        if (experienceEntry) {
          experience.push(experienceEntry);
        }
      }

      // Stop if we hit another major section
      if (inExperienceSection && ['education', 'skills', 'projects'].some(keyword => line.toLowerCase().includes(keyword))) {
        break;
      }
    }

    return experience;
  }

  /**
   * Parse experience line
   */
  private parseExperienceLine(line: string, nextLine?: string, thirdLine?: string): Experience | null {
    const dateRegex = /(\d{4}|Present)\s*[-–—]\s*(\d{4}|Present)/i;
    const dateMatch = line.match(dateRegex) || 
                     (nextLine && nextLine.match(dateRegex)) ||
                     (thirdLine && thirdLine.match(dateRegex));
    
    if (dateMatch) {
      const companyPosition = line.replace(dateRegex, '').trim();
      
      // Simple heuristic: first part is position, second part is company
      const parts = companyPosition.split(/\s+at\s+|\s*[-–—]\s*/);
      const position = parts[0] || 'Unknown Position';
      const company = parts[1] || 'Unknown Company';
      
      return {
        company,
        position,
        startDate: dateMatch[1],
        endDate: dateMatch[2],
        description: nextLine && !nextLine.match(dateRegex) ? nextLine.trim() : '',
      };
    }

    return null;
  }

  /**
   * Extract skills
   */
  private extractSkills(text: string): string[] {
    const skills: string[] = [];
    
    // Common technical skills (expand this list based on your needs)
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'React', 'Angular', 'Vue.js',
      'Node.js', 'Express.js', 'Django', 'Flask', 'Spring', 'MongoDB', 'MySQL',
      'PostgreSQL', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'Linux',
      'Machine Learning', 'Data Analysis', 'SQL', 'HTML', 'CSS', 'TypeScript',
      'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'Android', 'iOS', 'React Native'
    ];

    // Look for skills section
    const skillsSectionMatch = text.match(/skills?\s*\n([\s\S]*?)(?:\n\n|\n[A-Z][a-z]+\s*\n)/i);
    if (skillsSectionMatch) {
      const skillsText = skillsSectionMatch[1];
      const skillLines = skillsText.split(/[,\n]/);
      
      skillLines.forEach(line => {
        const skill = line.trim();
        if (skill.length > 0 && skill.length < 50) {
          skills.push(skill);
        }
      });
    }

    // If no explicit skills section, scan the entire text for common skills
    if (skills.length === 0) {
      commonSkills.forEach(skill => {
        if (text.toLowerCase().includes(skill.toLowerCase())) {
          skills.push(skill);
        }
      });
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Extract professional summary
   */
  private extractSummary(text: string): string | undefined {
    // Look for summary section
    const summaryMatch = text.match(/(?:summary|objective|about)\s*\n([\s\S]*?)(?:\n\n|\n[A-Z][a-z]+\s*\n)/i);
    if (summaryMatch) {
      return summaryMatch[1].trim();
    }

    // If no explicit summary, use the first paragraph
    const paragraphs = text.split('\n\n');
    if (paragraphs.length > 0 && paragraphs[0].length > 50) {
      return paragraphs[0].trim();
    }

    return undefined;
  }
}