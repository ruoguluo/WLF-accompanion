import React, { useState } from 'react';
import { FileText, Linkedin, Upload, ArrowLeft, Loader2 } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import LinkedInInput from '@/components/LinkedInInput';
import ResultsDisplay from '@/components/ResultsDisplay';
import axios from 'axios';
import NavBar from '@/components/NavBar';

interface PersonalInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  location?: string;
}

interface ExtractedProfile {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  skills: string[];
  summary?: string;
  extractedAt: string;
  source: 'resume' | 'linkedin';
}

type InputMethod = 'file' | 'linkedin' | null;

export default function Home() {
  const [inputMethod, setInputMethod] = useState<InputMethod>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProfile | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await axios.post('/api/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const data = response.data.data as ExtractedProfile & { id?: string };
        setExtractedData(data);
        try {
          await axios.post('/api/mentors', {
            personalInfo: data.personalInfo,
            education: data.education,
            experience: data.experience,
            skills: data.skills,
            summary: data.summary,
            extractedAt: data.extractedAt,
            source: data.source,
            topCompetences: (data as any).topCompetences,
            topAchievements: (data as any).topAchievements,
          })
        } catch {}
      } else {
        setError('Failed to extract information from resume');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to upload and process file');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInSubmit = async (url: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/extract-linkedin', {
        linkedinUrl: url,
      });

      if (response.data.success) {
        const data = response.data.data as ExtractedProfile & { id?: string };
        setExtractedData(data);
        try {
          await axios.post('/api/mentors', {
            personalInfo: data.personalInfo,
            education: data.education,
            experience: data.experience,
            skills: data.skills,
            summary: data.summary,
            extractedAt: data.extractedAt,
            source: data.source,
            topCompetences: (data as any).topCompetences,
            topAchievements: (data as any).topAchievements,
          })
        } catch {}
      } else {
        setError('Failed to extract information from LinkedIn');
      }
    } catch (err) {
      console.error('Error extracting LinkedIn data:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message || 'Failed to extract LinkedIn profile');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInputMethod(null);
    setExtractedData(null);
    setError('');
    setIsLoading(false);
  };

  if (extractedData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar title="Create Mentor" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Start Over</span>
            </button>
          </div>
          
          <ResultsDisplay data={extractedData} />
        </div>
      </div>
    );
  }

  if (inputMethod === 'file') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar title="Create Mentor" />
        <div className="flex items-center justify-center py-8">
          <div className="max-w-2xl w-full mx-4">
          <div className="text-center mb-8">
            <button
              onClick={() => setInputMethod(null)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Options</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Resume</h1>
            <p className="text-gray-600">
              Drag and drop your resume file or click to browse. We support PDF, DOC, and DOCX formats.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-8">
            <FileUpload 
              onFileSelect={handleFileUpload} 
              isLoading={isLoading}
            />
            
            {isLoading && (
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing your resume...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (inputMethod === 'linkedin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar title="Create Mentor" />
        <div className="flex items-center justify-center py-8">
          <div className="max-w-2xl w-full mx-4">
          <div className="text-center mb-8">
            <button
              onClick={() => setInputMethod(null)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Options</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">LinkedIn Profile</h1>
            <p className="text-gray-600">
              Enter your LinkedIn profile URL to extract your professional information.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-8">
            <LinkedInInput 
              onUrlSubmit={handleLinkedInSubmit}
              isLoading={isLoading}
            />
            
            {isLoading && (
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Extracting LinkedIn profile...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavBar title="Create Mentor" />
      <div className="max-w-4xl mx-auto px-4 text-center py-8">
        <div className="mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Resume & LinkedIn
              <span className="block text-blue-600">Information Extractor</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Extract professional information from your resume or LinkedIn profile automatically. 
            Get structured data including education, work experience, skills, and more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload Resume</h3>
            <p className="text-gray-600 mb-6">
              Upload your resume in PDF, DOC, or DOCX format. We'll extract your professional information automatically.
            </p>
            <button
              onClick={() => setInputMethod('file')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Choose File
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <Linkedin className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">LinkedIn Profile</h3>
            <p className="text-gray-600 mb-6">
              Provide your LinkedIn profile URL to extract your professional information from your public profile.
            </p>
            <button
              onClick={() => setInputMethod('linkedin')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Use LinkedIn
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>Secure • Fast • Accurate</span>
          </div>
        </div>
      </div>
    </div>
  );
}