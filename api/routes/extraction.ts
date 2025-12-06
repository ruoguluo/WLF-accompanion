import express from 'express';
import multer from 'multer';
import axios from 'axios';
import { ResumeParser } from '../utils/resumeParser.js';
import { DataExtractor } from '../utils/dataExtractor.js';
import { LinkedInScraper } from '../utils/linkedInScraper.js';
import { createEnhancedExtractor } from '../utils/enhancedDataExtractor.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  },
});

// POST /api/upload-resume - Process uploaded resume file
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_UPLOADED',
          message: 'No file was uploaded',
        },
      });
    }

    const file = req.file;
    const fileBuffer = file.buffer;
    const fileType = file.mimetype;

    console.log(`Processing resume file: ${file.originalname} (${fileType})`);

    // Step 1: Extract text from the resume file
    const parsedResume = await ResumeParser.extractText(fileBuffer, fileType);
    const cleanedText = ResumeParser.cleanText(parsedResume.text);

    console.log(`Extracted ${cleanedText.length} characters from resume`);

    process.env.USE_LLM_PRIMARY = 'true';
    process.env.DEFAULT_LLM_PROVIDER = process.env.DEFAULT_LLM_PROVIDER || 'openrouter';
    const dataExtractor = createEnhancedExtractor();
    const extractedData = await dataExtractor.extractInformation(cleanedText, 'resume');

    let educationLLM: Array<{ institution: string; degree: string; field: string; startDate: string; endDate: string; gpa?: string }> = [];
    let experienceSummaryLLM = '';
    let topCompetencesLLM: string[] = [];
    let topAchievementsLLM: string[] = [];
    let competencesSummaryLLM = '';
    let achievementsSummaryLLM = '';
    let studyWorkAlignmentLLM = '';
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (openrouterKey) {
      try {
        const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';
        const prompt = `You are an expert resume analyst. Extract education background, a concise work experience summary, top 5 competences, top 5 achievements, and whether work experience is related to the study major from the resume text below. Return only valid JSON.

Fields:
- education: array of objects with keys institution, degree, field, startDate, endDate, gpa
- workExperienceSummary: string, 3-5 sentences summarizing roles, impact, technologies, timeline
- topCompetences: array of up to 5 strings describing core competences
- topAchievements: array of up to 5 strings describing quantified achievements
- competencesSummary: string, 2-3 sentences summarizing strengths
- achievementsSummary: string, 2-3 sentences summarizing impact
 - studyWorkAlignment: string, one of "Related", "Partially Related", "Not Related"

Resume Text:\n"""\n${cleanedText}\n"""\n
JSON schema:
{"education":[{"institution":"string","degree":"string","field":"string","startDate":"string","endDate":"string","gpa":"string"}],"workExperienceSummary":"string","topCompetences":["string"],"topAchievements":["string"],"competencesSummary":"string","achievementsSummary":"string","studyWorkAlignment":"string"}`;
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              Authorization: `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'Resume Analyzer',
            },
            timeout: 15000,
          }
        );
        const content: string = response.data.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.education)) {
          educationLLM = parsed.education.map((e: any) => ({
            institution: e.institution || 'Unknown Institution',
            degree: e.degree || 'Unknown Degree',
            field: e.field || 'Unknown Field',
            startDate: e.startDate || 'Unknown',
            endDate: e.endDate || 'Unknown',
            gpa: e.gpa,
          }));
        }
        if (typeof parsed.workExperienceSummary === 'string') {
          experienceSummaryLLM = parsed.workExperienceSummary;
        }
        if (typeof parsed.studyWorkAlignment === 'string') {
          studyWorkAlignmentLLM = parsed.studyWorkAlignment;
        }
        if (Array.isArray(parsed.topCompetences)) {
          topCompetencesLLM = parsed.topCompetences;
        }
        if (Array.isArray(parsed.topAchievements)) {
          topAchievementsLLM = parsed.topAchievements;
        }
        if (typeof parsed.competencesSummary === 'string') {
          competencesSummaryLLM = parsed.competencesSummary;
        }
        if (typeof parsed.achievementsSummary === 'string') {
          achievementsSummaryLLM = parsed.achievementsSummary;
        }
        console.log('OpenRouter extraction completed');
      } catch (llmErr) {
        console.error('OpenRouter extraction failed:', llmErr);
      }
    }

    const payload = {
      ...extractedData,
      education: extractedData.education,
      experience: extractedData.experience,
      skills: extractedData.skills,
      summary: extractedData.summary,
      topCompetences: extractedData.topCompetences,
      topAchievements: extractedData.topAchievements,
    }

    const enriched = {
      ...payload,
      educationLLM,
      experienceSummaryLLM,
      topCompetencesLLM,
      topAchievementsLLM,
      competencesSummaryLLM,
      achievementsSummaryLLM,
    }

    try {
      const saveRes = await axios.post(`${process.env.SELF_BASE_URL || ''}/api/mentors`, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
      const id = saveRes.data?.data?.id
      console.log('Mentor saved', id)
      res.json({ success: true, data: { id, studyWorkAlignment: studyWorkAlignmentLLM || payload.studyWorkAlignment, ...enriched } })
    } catch (e) {
      console.error('Failed to save mentor, returning data without id')
      res.json({ success: true, data: enriched })
    }
  } catch (error) {
    console.error('Error processing resume upload:', error);
    
    let errorMessage = 'Failed to process resume file';
    let errorCode = 'PROCESSING_ERROR';

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('Unsupported file type')) {
        errorCode = 'INVALID_FILE_FORMAT';
      } else if (error.message.includes('Failed to extract text')) {
        errorCode = 'TEXT_EXTRACTION_FAILED';
      } else if (error.message.includes('Failed to extract information')) {
        errorCode = 'INFORMATION_EXTRACTION_FAILED';
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
});

// POST /api/extract-linkedin - Extract information from LinkedIn profile
router.post('/extract-linkedin', async (req, res) => {
  try {
    const { linkedinUrl } = req.body;

    if (!linkedinUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_URL',
          message: 'LinkedIn URL is required',
        },
      });
    }

    console.log(`Processing LinkedIn profile: ${linkedinUrl}`);

    // Step 1: Scrape LinkedIn profile
    const linkedinScraper = new LinkedInScraper();
    const linkedinData = await linkedinScraper.scrapeProfile(linkedinUrl);

    console.log(`Successfully scraped LinkedIn profile for: ${linkedinData.name}`);

    // Step 2: Transform LinkedIn data to our standard format
    const extractedData = {
      personalInfo: {
        name: linkedinData.name,
        email: linkedinData.email,
        location: linkedinData.location,
        linkedin: linkedinData.linkedin,
      },
      education: linkedinData.education.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate,
        endDate: edu.endDate,
      })),
      experience: linkedinData.experience.map(exp => ({
        company: exp.company,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description || '',
        location: exp.location,
      })),
      skills: linkedinData.skills,
      summary: linkedinData.summary,
      extractedAt: new Date().toISOString(),
      source: 'linkedin' as const,
    };

    console.log('Successfully extracted information from LinkedIn profile');

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('Error processing LinkedIn extraction:', error);
    
    let errorMessage = 'Failed to extract LinkedIn profile';
    let errorCode = 'EXTRACTION_ERROR';

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('Invalid LinkedIn')) {
        errorCode = 'INVALID_LINKEDIN_URL';
      } else if (error.message.includes('not found')) {
        errorCode = 'PROFILE_NOT_FOUND';
      } else if (error.message.includes('not public')) {
        errorCode = 'PROFILE_NOT_PUBLIC';
      } else if (error.message.includes('Rate limited')) {
        errorCode = 'RATE_LIMITED';
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }
});

// GET /api/supported-formats - Get supported file formats
router.get('/supported-formats', (req, res) => {
  res.json({
    success: true,
    data: {
      formats: [
        {
          type: 'PDF',
          mimeType: 'application/pdf',
          extension: '.pdf',
          maxSize: '10MB',
        },
        {
          type: 'Microsoft Word',
          mimeType: 'application/msword',
          extension: '.doc',
          maxSize: '10MB',
        },
        {
          type: 'Microsoft Word (OpenXML)',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: '.docx',
          maxSize: '10MB',
        },
      ],
    },
  });
});

export default router;
