import React, { useState } from 'react';
import { User, GraduationCap, Briefcase, Award, MapPin, Mail, Phone, Calendar, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

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
  studyWorkAlignment?: string;
  certificates?: string[];
  industry?: string;
  experienceDuration?: string;
}

interface ResultsDisplayProps {
  data: ExtractedProfile;
  isLoading?: boolean;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data, isLoading = false }) => {
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Present';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
      const years = Math.floor(diffMonths / 12);
      const months = diffMonths % 12;
      
      if (years > 0 && months > 0) {
        return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
      } else if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''}`;
      } else {
        return `${months} month${months > 1 ? 's' : ''}`;
      }
    } catch {
      return '';
    }
  };

  const truncateWords = (text: string, maxWords: number): string => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '…';
  };

  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  };

  const totalExperienceMonths = (items: Experience[]): number => {
    let total = 0;
    for (const exp of items) {
      try {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const diff = Math.abs(end.getTime() - start.getTime());
        total += Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      } catch {}
    }
    return total;
  };

  const formatTotalDuration = (months: number): string => {
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years > 0 && rem > 0) return `${years} year${years > 1 ? 's' : ''} ${rem} month${rem > 1 ? 's' : ''}`;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${rem} month${rem !== 1 ? 's' : ''}`;
  };

  const inferIndustry = (items: Experience[], skillsList: string[]): string => {
    const text = ([...items.map(i => `${i.company} ${i.position}`), ...skillsList]).join(' ').toLowerCase();
    const checks: Array<[string, string[]]> = [
      ['Technology', ['software','developer','engineer','react','node','aws','cloud','saas','golang','java','python','frontend','backend']],
      ['Finance', ['bank','finance','trading','investment','quant','fintech','capital']],
      ['Healthcare', ['hospital','health','medical','biotech','pharma']],
      ['Education', ['university','school','education','teaching','research']],
      ['E-commerce', ['ecommerce','retail','shop','marketplace']],
      ['Manufacturing', ['manufacturing','factory','production','industrial']],
      ['Government', ['government','federal','public','municipal','state']]
    ];
    for (const [label, kws] of checks) {
      if (kws.some(k => text.includes(k))) return label;
    }
    return 'Unknown';
  };

  const degreeLevel = (deg: string): number => {
    const d = (deg || '').toLowerCase();
    if (/(phd|doctor|m\.d\.|md|jd|doctorate|dphil|edd)/.test(d)) return 4;
    if (/(master|m\.sc|m\.s\.|mba|meng|m\.eng)/.test(d)) return 3;
    if (/(bachelor|b\.sc|b\.s\.|ba|beng|b\.eng)/.test(d)) return 2;
    if (/(associate|aa|as)/.test(d)) return 1;
    return 0;
  };

  const getHighestDegree = (items: Education[]): { text: string } => {
    if (!items || items.length === 0) return { text: '' };
    let best = items[0];
    for (const e of items) {
      const a = degreeLevel(e.degree);
      const b = degreeLevel(best.degree);
      if (a > b) best = e;
      else if (a === b) {
        const be = (best.endDate || '').toString();
        const ee = (e.endDate || '').toString();
        if (ee && (!be || ee > be)) best = e;
      }
    }
    const deg = best.degree?.trim() || '';
    const field = best.field?.trim() || '';
    const text = deg ? (field ? `${deg} in ${field}` : deg) : '';
    return { text };
  };

  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [experienceCollapsed, setExperienceCollapsed] = useState(true);
  const [educationCollapsed, setEducationCollapsed] = useState(true);
  const [skillsCollapsed, setSkillsCollapsed] = useState(true);
  const [certificatesCollapsed, setCertificatesCollapsed] = useState(true);

  const experience = Array.isArray(data.experience) ? data.experience : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const highestDegree = getHighestDegree(education).text;

  const alignment = (data.studyWorkAlignment || '').trim();
  const alignmentLower = alignment.toLowerCase();
  const alignmentType = alignment
    ? (alignmentLower.includes('unrelated') || alignmentLower.includes('not related')
        ? 'negative'
        : (alignmentLower.includes('related') ? 'positive' : 'neutral'))
    : 'neutral';
  const badgeClasses = alignmentType === 'positive'
    ? 'bg-green-100 text-green-800'
    : alignmentType === 'negative'
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800';
  const alignmentText = alignment || 'Unknown';

  const totalMonths = totalExperienceMonths(experience);
  const totalDurationText = (data.experienceDuration && data.experienceDuration.trim()) || (totalMonths > 0 ? formatTotalDuration(totalMonths) : '');
  const industryText = (data.industry && data.industry.trim()) || inferIndustry(experience, skills);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Extracted Information</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            {data.source === 'resume' ? 'Resume' : 'LinkedIn'}
          </span>
          <span>•</span>
          <span>{new Date(data.extractedAt).toLocaleDateString()}</span>
          <span className={`px-2 py-1 rounded-full text-xs ${badgeClasses}`}>
            {alignmentText}
          </span>
          {industryText && (
            <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              {industryText}
            </span>
          )}
        </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <User className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-xl font-bold text-gray-900 mb-3">{data.personalInfo.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {data.personalInfo.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{data.personalInfo.location}</span>
              </div>
            )}
            {highestDegree && (
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{highestDegree}</span>
              </div>
            )}
            {industryText && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{industryText}</span>
              </div>
            )}
            {totalDurationText && (
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{totalDurationText}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded-full ${badgeClasses}`}>{alignmentText}</span>
              <span className="text-gray-500">Study–Work Alignment</span>
            </div>
            {data.personalInfo.email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{data.personalInfo.email}</span>
              </div>
            )}
            {data.personalInfo.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{data.personalInfo.phone}</span>
              </div>
            )}
            {data.personalInfo.linkedin && (
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-gray-500" />
                <a
                  href={data.personalInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Summary</h3>
          <p className="text-gray-700 leading-relaxed">
            {summaryExpanded ? data.summary : truncateWords(data.summary, 1000)}
          </p>
          <div className="mt-3 text-sm">
            <span className="font-semibold text-gray-900">Study–Work Alignment:</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full ${badgeClasses}`}>{alignmentText}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">Industry:</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">{industryText || 'Unknown'}</span>
            </div>
            {totalDurationText && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">Experience:</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">{totalDurationText}</span>
              </div>
            )}
          </div>
          {countWords(data.summary) > 1000 && (
            <button
              type="button"
              onClick={() => setSummaryExpanded(v => !v)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {summaryExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
            </div>
            <button
              type="button"
              onClick={() => setExperienceCollapsed(v => !v)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {experienceCollapsed ? 'Unfold' : 'Fold'}
            </button>
          </div>
          {!experienceCollapsed && (
            <div className="space-y-4">
              {experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                      <p className="text-gray-600">{exp.company}</p>
                      {exp.location && (
                        <p className="text-sm text-gray-500">{exp.location}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDuration(exp.startDate, exp.endDate)}
                      </div>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
            </div>
            <button
              type="button"
              onClick={() => setEducationCollapsed(v => !v)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {educationCollapsed ? 'Unfold' : 'Fold'}
            </button>
          </div>
          {!educationCollapsed && (
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="border-l-2 border-green-200 pl-4 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-gray-600">{edu.field}</p>
                      <p className="text-gray-600">{edu.institution}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                        </span>
                      </div>
                      {edu.gpa && (
                        <div className="text-xs text-gray-400">GPA: {edu.gpa}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            </div>
            <button
              type="button"
              onClick={() => setSkillsCollapsed(v => !v)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {skillsCollapsed ? 'Unfold' : 'Fold'}
            </button>
          </div>
          {!skillsCollapsed && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificates */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Certificates</h3>
          </div>
          <button
            type="button"
            onClick={() => setCertificatesCollapsed(v => !v)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {certificatesCollapsed ? 'Unfold' : 'Fold'}
          </button>
        </div>
        {!certificatesCollapsed && (
          Array.isArray(data.certificates) && data.certificates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.certificates.map((c, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-700">None</p>
          )
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;