import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Linkedin, AlertCircle, CheckCircle } from 'lucide-react';

const linkedinSchema = z.object({
  linkedinUrl: z
    .string()
    .min(1, 'LinkedIn URL is required')
    .url('Please enter a valid URL')
    .refine(
      (url) => {
        const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)\/?$/;
        return linkedinRegex.test(url);
      },
      {
        message: 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)',
      }
    ),
});

type LinkedInFormData = z.infer<typeof linkedinSchema>;

interface LinkedInInputProps {
  onUrlSubmit: (url: string) => void;
  isLoading?: boolean;
}

const LinkedInInput: React.FC<LinkedInInputProps> = ({ onUrlSubmit, isLoading = false }) => {
  const [submittedUrl, setSubmittedUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LinkedInFormData>({
    resolver: zodResolver(linkedinSchema),
  });

  const onSubmit = (data: LinkedInFormData) => {
    setSubmittedUrl(data.linkedinUrl);
    onUrlSubmit(data.linkedinUrl);
  };

  const handleReset = () => {
    setSubmittedUrl('');
    reset();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {submittedUrl ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">LinkedIn URL Submitted</p>
                <p className="text-sm text-gray-500 truncate">{submittedUrl}</p>
              </div>
            </div>
            {!isLoading && (
              <button
                onClick={handleReset}
                className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Use different URL
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Linkedin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('linkedinUrl')}
                  type="url"
                  id="linkedinUrl"
                  className={
                    `block w-full pl-10 pr-3 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.linkedinUrl ? 'border-red-300' : 'border-gray-300'
                    }`
                  }
                  placeholder="https://linkedin.com/in/username"
                  disabled={isLoading}
                />
              </div>
              {errors.linkedinUrl && (
                <div className="mt-2 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{errors.linkedinUrl.message}</p>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Make sure your LinkedIn profile is public</p>
              <p>• Use the full profile URL (e.g., https://linkedin.com/in/johndoe)</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? 'Processing...' : 'Extract Information'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LinkedInInput;