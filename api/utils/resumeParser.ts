import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ParsedResume {
  text: string;
  metadata: {
    pages?: number;
    info?: unknown;
    metadata?: unknown;
  };
}

export class ResumeParser {
  /**
   * Extract text from various resume file formats
   */
  static async extractText(fileBuffer: Buffer, fileType: string): Promise<ParsedResume> {
    try {
      switch (fileType.toLowerCase()) {
        case 'application/pdf':
        case '.pdf':
          return await this.extractFromPDF(fileBuffer);
        
        case 'application/msword':
        case '.doc':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case '.docx':
          return await this.extractFromDOCX(fileBuffer);
        
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Error extracting text from resume:', error);
      throw new Error('Failed to extract text from resume file');
    }
  }

  /**
   * Extract text from PDF file
   */
  private static async extractFromPDF(fileBuffer: Buffer): Promise<ParsedResume> {
    try {
      const data = await pdfParse(fileBuffer);
      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          info: data.info,
          metadata: data.metadata,
        },
      };
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  /**
   * Extract text from DOC/DOCX file
   */
  private static async extractFromDOCX(fileBuffer: Buffer): Promise<ParsedResume> {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return {
        text: result.value,
        metadata: {
          info: result.messages,
        },
      };
    } catch (error) {
      console.error('Error extracting text from DOC/DOCX:', error);
      throw new Error('Failed to extract text from Word document');
    }
  }

  /**
   * Clean and normalize extracted text
   */
  static cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .trim();
  }
}