# Resume & LinkedIn Information Extraction Website

## Product Overview
A web application that allows users to upload their resume (PDF/DOC/DOCX) or provide their LinkedIn URL to automatically extract professional information including education background, work experience, skills, and contact information.

## Core Features

### 1. File Upload Functionality
- Support for PDF, DOC, DOCX file formats
- Drag-and-drop interface
- File validation and size limits (max 10MB)
- Progress indicator during upload

### 2. LinkedIn URL Input
- URL validation for LinkedIn profile links
- Input field with proper formatting validation
- Error handling for invalid URLs

### 3. Information Extraction
- **Resume Parsing**: Extract text from uploaded documents
- **LinkedIn Scraping**: Fetch public profile data from LinkedIn URLs
- **Data Processing**: Parse and structure extracted information

### 4. Extracted Information Display
- Education background (institutions, degrees, dates)
- Work experience (companies, positions, duration)
- Skills and competencies
- Contact information (email, phone, location)
- Professional summary

### 5. User Interface
- Clean, modern design with responsive layout
- Intuitive navigation between upload options
- Loading states and progress indicators
- Error handling and user feedback

## Technical Requirements

### Frontend (React + TypeScript)
- Modern UI with Tailwind CSS
- File upload with drag-and-drop
- Form validation and error handling
- Responsive design for mobile and desktop

### Backend (Node.js + Express)
- File upload handling with multer
- Resume parsing using pdf-parse and mammoth libraries
- LinkedIn scraping (using appropriate APIs)
- Data processing and formatting
- RESTful API endpoints

### Data Processing
- Text extraction from various file formats
- Natural language processing for information extraction
- Data validation and sanitization
- Structured output format (JSON)

## User Flow
1. User lands on homepage with two options: "Upload Resume" or "Enter LinkedIn URL"
2. User chooses preferred method and provides input
3. System processes the input and extracts information
4. Extracted data is displayed in an organized format
5. User can review and potentially edit the extracted information

## Success Criteria
- Successfully extract key professional information 90%+ of the time
- Support for common resume formats and LinkedIn public profiles
- Fast processing time (< 30 seconds for most files)
- Intuitive user experience with clear feedback
- Mobile-responsive design

## Future Enhancements
- Export extracted data to various formats (PDF, JSON, etc.)
- Integration with job application systems
- Advanced resume analysis and suggestions
- Multi-language support
- Cover letter generation based on extracted data