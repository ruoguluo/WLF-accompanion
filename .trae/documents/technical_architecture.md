# Technical Architecture - Resume & LinkedIn Information Extraction

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + TypeScript)            │
├─────────────────────────────────────────────────────────────────┤
│  Components:                                                    │
│  • HomePage - Landing with upload options                      │
│  • FileUpload - Drag-and-drop resume upload                    │
│  • LinkedInInput - URL input with validation                   │
│  • ResultsDisplay - Show extracted information                 │
│  • LoadingSpinner - Processing indicators                      │
│                                                                 │
│  State Management:                                              │
│  • Zustand for global state                                     │
│  • React Query for API calls                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP Requests
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)                  │
├─────────────────────────────────────────────────────────────────┤
│  API Endpoints:                                                 │
│  • POST /api/upload-resume - Process uploaded files            │
│  • POST /api/extract-linkedin - Fetch LinkedIn data            │
│  • GET /api/health - Health check                              │
│                                                                 │
│  Middleware:                                                    │
│  • multer - File upload handling                               │
│  • cors - Cross-origin requests                                │
│  • helmet - Security headers                                   │
│                                                                 │
│  Processing Modules:                                            │
│  • resumeParser.js - Extract text from PDF/DOC/DOCX           │
│  • linkedInScraper.js - Fetch LinkedIn profile data           │
│  • dataExtractor.js - Parse and structure information          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Processing
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Processing Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Libraries & Tools:                                             │
│  • pdf-parse - PDF text extraction                              │
│  • mammoth - DOC/DOCX text extraction                          │
│  • axios - HTTP requests for LinkedIn scraping                 │
│  • cheerio - HTML parsing for LinkedIn data                    │
│  • natural - NLP for information extraction                    │
│                                                                 │
│  Processing Pipeline:                                           │
│  1. Input validation and sanitization                          │
│  2. Text extraction from files or web scraping               │
│  3. Natural language processing for key information            │
│  4. Data structuring and formatting                          │
│  5. Response formatting for frontend                         │
└─────────────────────────────────────────────────────────────────┘

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **File Upload**: React Dropzone
- **Form Validation**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **File Upload**: Multer
- **Security**: Helmet, CORS
- **Text Processing**: pdf-parse, mammoth, natural
- **Web Scraping**: Axios, Cheerio

### Development Tools
- **Package Manager**: pnpm (preferred) or npm
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Formatting**: Prettier

## Data Models

### Extracted Information Structure
```typescript
interface ExtractedProfile {
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
  extractedAt: string;
  source: 'resume' | 'linkedin';
}
```

### API Response Formats

#### Success Response
```json
{
  "success": true,
  "data": {
    "personalInfo": { ... },
    "education": [ ... ],
    "experience": [ ... ],
    "skills": [ ... ],
    "summary": "...",
    "extractedAt": "2024-01-15T10:30:00Z",
    "source": "resume"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "Unsupported file format. Please upload PDF, DOC, or DOCX files."
  }
}
```

## Security Considerations

### File Upload Security
- File type validation (MIME type checking)
- File size limits (10MB max)
- Malicious file detection
- Secure file storage and cleanup

### Data Processing Security
- Input sanitization and validation
- Rate limiting for API endpoints
- CORS configuration for frontend domain
- Error message sanitization

### LinkedIn Scraping Ethics
- Respect robots.txt and rate limits
- Only scrape publicly available information
- Implement delays between requests
- Handle anti-bot measures appropriately

## Performance Optimization

### Frontend Optimizations
- Lazy loading for components
- Image and asset optimization
- Debounced form inputs
- Progressive loading for results

### Backend Optimizations
- Efficient text processing algorithms
- Caching for frequently accessed data
- Streaming for large file processing
- Connection pooling for database (if needed)

## Error Handling Strategy

### Client-Side Errors
- Network connectivity issues
- File validation errors
- User input validation
- Graceful degradation

### Server-Side Errors
- File processing failures
- External service timeouts
- Parsing errors
- Rate limiting exceeded

## Deployment Considerations

### Environment Variables
- PORT, NODE_ENV
- CORS_ORIGIN
- MAX_FILE_SIZE
- RATE_LIMIT_WINDOW
- RATE_LIMIT_MAX

### Production Setup
- PM2 for process management
- Nginx for reverse proxy
- SSL/TLS certificates
- Log aggregation and monitoring
- Health check endpoints

## Testing Strategy

### Unit Tests
- Component rendering tests
- Utility function tests
- API endpoint tests
- Data processing tests

### Integration Tests
- File upload flow
- LinkedIn scraping flow
- Error handling scenarios
- Performance benchmarks