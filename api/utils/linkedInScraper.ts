import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LinkedInProfile {
  name: string;
  title?: string;
  location?: string;
  email?: string;
  linkedin: string;
  summary?: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description?: string;
    location?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
  skills: string[];
}

export class LinkedInScraper {
  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  private readonly DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

  /**
   * Scrape LinkedIn public profile
   */
  async scrapeProfile(linkedinUrl: string): Promise<LinkedInProfile> {
    try {
      // Validate LinkedIn URL
      if (!this.isValidLinkedInUrl(linkedinUrl)) {
        throw new Error('Invalid LinkedIn profile URL');
      }

      // Add delay to respect rate limits
      await this.delay(this.DELAY_BETWEEN_REQUESTS);

      const response = await axios.get(linkedinUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      
      // Extract profile information
      const profile = this.extractProfileData($, linkedinUrl);
      
      return profile;
    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('LinkedIn profile not found or not public');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limited by LinkedIn. Please try again later.');
        }
      }
      throw new Error('Failed to scrape LinkedIn profile');
    }
  }

  /**
   * Validate LinkedIn URL
   */
  private isValidLinkedInUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'www.linkedin.com' || urlObj.hostname === 'linkedin.com';
    } catch {
      return false;
    }
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract profile data from HTML
   */
  private extractProfileData($: cheerio.CheerioAPI, linkedinUrl: string): LinkedInProfile {
    const profile: LinkedInProfile = {
      name: this.extractName($),
      title: this.extractTitle($),
      location: this.extractLocation($),
      linkedin: linkedinUrl,
      summary: this.extractSummary($),
      experience: this.extractExperience($),
      education: this.extractEducation($),
      skills: this.extractSkills($),
    };

    return profile;
  }

  /**
   * Extract name
   */
  private extractName($: cheerio.CheerioAPI): string {
    // Try multiple selectors for name
    const nameSelectors = [
      'h1.text-heading-xlarge',
      'h1.inline.t-24.v-align-middle.break-words',
      '.pv-top-card__name',
      '.text-heading-xlarge',
    ];

    for (const selector of nameSelectors) {
      const nameElement = $(selector);
      if (nameElement.length > 0) {
        const name = nameElement.text().trim();
        if (name.length > 0) {
          return name;
        }
      }
    }

    return 'Unknown Name';
  }

  /**
   * Extract title/headline
   */
  private extractTitle($: cheerio.CheerioAPI): string | undefined {
    const titleSelectors = [
      'div.text-body-medium.break-words',
      '.pv-top-card__summary-position',
      '.headline',
      'h2.mt1.t-18.t-black.t-normal',
    ];

    for (const selector of titleSelectors) {
      const titleElement = $(selector);
      if (titleElement.length > 0) {
        const title = titleElement.text().trim();
        if (title.length > 0) {
          return title;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract location
   */
  private extractLocation($: cheerio.CheerioAPI): string | undefined {
    const locationSelectors = [
      'span.text-body-small.inline.t-black--light.break-words',
      '.pv-top-card__location',
      '.t-16.t-black.t-normal.inline-block',
    ];

    for (const selector of locationSelectors) {
      const locationElement = $(selector);
      if (locationElement.length > 0) {
        const location = locationElement.text().trim();
        if (location.length > 0) {
          return location;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract summary/about
   */
  private extractSummary($: cheerio.CheerioAPI): string | undefined {
    const summarySelectors = [
      'div.inline-show-more-text span[aria-hidden="true"]',
      '.pv-about__summary-text',
      '.summary',
      'div#about + div p',
    ];

    for (const selector of summarySelectors) {
      const summaryElement = $(selector);
      if (summaryElement.length > 0) {
        const summary = summaryElement.text().trim();
        if (summary.length > 0 && summary.length < 1000) {
          return summary;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract experience
   */
  private extractExperience($: cheerio.CheerioAPI): Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description?: string;
    location?: string;
  }> {
    const experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate: string;
      description?: string;
      location?: string;
    }> = [];

    const experienceSelectors = [
      'section[data-field="experience_panel"] li',
      '.pv-experience-section__position-item',
      '.experience-item',
      'div#experience + div ul li',
    ];

    for (const selector of experienceSelectors) {
      const experienceElements = $(selector);
      if (experienceElements.length > 0) {
        experienceElements.each((index, element) => {
          const exp = this.parseExperienceElement($, $(element));
          if (exp) {
            experience.push(exp);
          }
        });
        break;
      }
    }

    return experience;
  }

  /**
   * Parse experience element
   */
  private parseExperienceElement($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description?: string;
    location?: string;
  } | null {
    try {
      const positionSelectors = [
        'h3.t-16.t-black.t-bold',
        '.pv-entity__summary-info h3',
        'h3',
      ];

      const companySelectors = [
        'p.pv-entity__secondary-title.t-14.t-black.t-normal',
        '.pv-entity__secondary-title',
        'p',
      ];

      const dateSelectors = [
        'h4.pv-entity__date-range.t-14.t-black--light.t-normal span:nth-child(2)',
        '.pv-entity__date-range span:nth-child(2)',
        'span',
      ];

      let position = '';
      let company = '';
      let dateRange = '';

      // Extract position
      for (const selector of positionSelectors) {
        const posElement = element.find(selector);
        if (posElement.length > 0) {
          position = posElement.first().text().trim();
          break;
        }
      }

      // Extract company
      for (const selector of companySelectors) {
        const compElement = element.find(selector);
        if (compElement.length > 0) {
          company = compElement.first().text().trim();
          break;
        }
      }

      // Extract date range
      for (const selector of dateSelectors) {
        const dateElement = element.find(selector);
        if (dateElement.length > 0) {
          const dateText = dateElement.text().trim();
          if (dateText.includes('–') || dateText.includes('-')) {
            dateRange = dateText;
            break;
          }
        }
      }

      if (position && company) {
        const { startDate, endDate } = this.parseDateRange(dateRange);
        
        return {
          position,
          company,
          startDate,
          endDate,
          description: this.extractExperienceDescription($, element),
          location: this.extractExperienceLocation($, element),
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing experience element:', error);
      return null;
    }
  }

  /**
   * Extract experience description
   */
  private extractExperienceDescription($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string | undefined {
    const descriptionSelectors = [
      'p.pv-entity__description.t-14.t-black.t-normal.inline-show-more-text span[aria-hidden="true"]',
      '.pv-entity__description',
      'div.inline-show-more-text',
    ];

    for (const selector of descriptionSelectors) {
      const descElement = element.find(selector);
      if (descElement.length > 0) {
        const description = descElement.text().trim();
        if (description.length > 0) {
          return description;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract experience location
   */
  private extractExperienceLocation($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string | undefined {
    const locationSelectors = [
      'h4.pv-entity__location.t-14.t-black--light.t-normal span:nth-child(2)',
      '.pv-entity__location span:nth-child(2)',
    ];

    for (const selector of locationSelectors) {
      const locElement = element.find(selector);
      if (locElement.length > 0) {
        const location = locElement.text().trim();
        if (location.length > 0) {
          return location;
        }
      }
    }

    return undefined;
  }

  /**
   * Parse date range
   */
  private parseDateRange(dateRange: string): { startDate: string; endDate: string } {
    const dateRegex = /(\w+\s*\d{4}|\d{4})\s*[-–—]\s*(\w+\s*\d{4}|\d{4}|Present)/i;
    const match = dateRange.match(dateRegex);
    
    if (match) {
      return {
        startDate: match[1].trim(),
        endDate: match[2].trim(),
      };
    }

    return { startDate: 'Unknown', endDate: 'Unknown' };
  }

  /**
   * Extract education
   */
  private extractEducation($: cheerio.CheerioAPI): Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }> {
    const education: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate: string;
    }> = [];

    const educationSelectors = [
      'section[data-field="education_panel"] li',
      '.pv-education-section__education-item',
      'div#education + div ul li',
    ];

    for (const selector of educationSelectors) {
      const educationElements = $(selector);
      if (educationElements.length > 0) {
        educationElements.each((index, element) => {
          const edu = this.parseEducationElement($, $(element));
          if (edu) {
            education.push(edu);
          }
        });
        break;
      }
    }

    return education;
  }

  /**
   * Parse education element
   */
  private parseEducationElement($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  } | null {
    try {
      const institutionSelectors = [
        'h3.pv-entity__school-name.t-16.t-black.t-bold',
        '.pv-entity__school-name',
        'h3',
      ];

      const degreeSelectors = [
        'span.pv-entity__degree-name.t-14.t-black.t-normal span:nth-child(2)',
        '.pv-entity__degree-name span:nth-child(2)',
      ];

      const fieldSelectors = [
        'span.pv-entity__fos.t-14.t-black.t-normal span:nth-child(2)',
        '.pv-entity__fos span:nth-child(2)',
      ];

      const dateSelectors = [
        'p.pv-entity__dates.t-14.t-black--light.t-normal span:nth-child(2)',
        '.pv-entity__dates span:nth-child(2)',
      ];

      let institution = '';
      let degree = '';
      let field = '';
      let dateRange = '';

      // Extract institution
      for (const selector of institutionSelectors) {
        const instElement = element.find(selector);
        if (instElement.length > 0) {
          institution = instElement.text().trim();
          break;
        }
      }

      // Extract degree
      for (const selector of degreeSelectors) {
        const degElement = element.find(selector);
        if (degElement.length > 0) {
          degree = degElement.text().trim();
          break;
        }
      }

      // Extract field of study
      for (const selector of fieldSelectors) {
        const fieldElement = element.find(selector);
        if (fieldElement.length > 0) {
          field = fieldElement.text().trim();
          break;
        }
      }

      // Extract date range
      for (const selector of dateSelectors) {
        const dateElement = element.find(selector);
        if (dateElement.length > 0) {
          dateRange = dateElement.text().trim();
          break;
        }
      }

      if (institution) {
        const { startDate, endDate } = this.parseDateRange(dateRange);
        
        return {
          institution,
          degree: degree || 'Unknown Degree',
          field: field || 'Unknown Field',
          startDate,
          endDate,
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing education element:', error);
      return null;
    }
  }

  /**
   * Extract skills
   */
  private extractSkills($: cheerio.CheerioAPI): string[] {
    const skills: string[] = [];

    const skillsSelectors = [
      'section[data-field="skill_card_skill_topic"] li',
      '.pv-skill-category-entity__name',
      '.pv-skill-entity__skill-name',
      'div#skills + div ul li',
    ];

    for (const selector of skillsSelectors) {
      const skillsElements = $(selector);
      if (skillsElements.length > 0) {
        skillsElements.each((index, element) => {
          const skill = $(element).text().trim();
          if (skill.length > 0) {
            skills.push(skill);
          }
        });
        break;
      }
    }

    return skills;
  }
}
