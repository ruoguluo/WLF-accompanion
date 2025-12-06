import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  acceptedFormats?: string[];
  maxSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  isLoading = false,
  acceptedFormats = ['.pdf', '.doc', '.docx'],
  maxSize = 10 * 1024 * 1024, // 10MB
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { file: File; errors: { code: string; message: string }[] }[]) => {
      setError('');

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError(`Invalid file type. Please upload ${acceptedFormats.join(', ')} files.`);
        } else {
          setError('File upload failed. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, acceptedFormats, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize,
    multiple: false,
    disabled: isLoading,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
          'hover:border-blue-400 hover:bg-blue-50',
          isDragActive && 'border-blue-400 bg-blue-50',
          isLoading && 'opacity-50 cursor-not-allowed',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300',
          uploadedFile ? 'border-green-400 bg-green-50' : ''
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {uploadedFile ? (
            <CheckCircle className="w-12 h-12 text-green-500" />
          ) : isDragActive ? (
            <Upload className="w-12 h-12 text-blue-500" />
          ) : (
            <FileText className="w-12 h-12 text-gray-400" />
          )}
          
          <div className="text-center">
            {uploadedFile ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-green-700">
                  File uploaded successfully!
                </p>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p>{formatFileSize(uploadedFile.size)}</p>
                </div>
              </div>
            ) : isDragActive ? (
              <p className="text-lg font-medium text-blue-700">
                Drop the file here...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Drag & drop your resume here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-400">
                  Supported formats: {acceptedFormats.join(', ')} (Max {maxSize / (1024 * 1024)}MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded-md flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {uploadedFile && !isLoading && (
        <button
          onClick={() => {
            setUploadedFile(null);
            setError('');
          }}
          className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Upload different file
        </button>
      )}
    </div>
  );
};

export default FileUpload;