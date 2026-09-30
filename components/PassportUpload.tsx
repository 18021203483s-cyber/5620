'use client';

import { useState, useRef } from 'react';
import { PassportInfo } from '@/lib/types';
import { extractPassportInfo } from '@/lib/document-agent';

interface PassportUploadProps {
  onUpload: (info: PassportInfo) => void;
  onSkip: () => void;
  propertyAddress: string;
}

export default function PassportUpload({ onUpload, onSkip, propertyAddress }: PassportUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please drop an image file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Extract base64 without the data URL prefix
      const base64Data = base64.split(',')[1];
      
      // Call passport extraction
      const passportInfo = await extractPassportInfo(base64Data);
      
      onUpload(passportInfo);
    } catch (err: any) {
      console.error('Upload error:', err);
      
      // Handle specific passport errors
      const errorMessage = err.message || '';
      
      if (errorMessage.toLowerCase().includes('passport') || 
          errorMessage.toLowerCase().includes('not appear') ||
          errorMessage.toLowerCase().includes('not a passport')) {
        setError('⚠️ ' + errorMessage + '\n\nPlease upload a valid passport image.');
      } else {
        setError('Failed to process passport. Please try again with a clearer photo.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📄 Verify Your Identity</h2>
          <p className="text-sm text-gray-500 mt-1">
            For: {propertyAddress}
          </p>
        </div>
        <button 
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Skip for now
        </button>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          preview 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        {preview ? (
          <div className="space-y-4">
            <img 
              src={preview} 
              alt="Passport preview" 
              className="max-h-48 mx-auto rounded-lg shadow"
            />
            <p className="text-sm text-gray-600">
              Click to change image or drag a new one
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📷</span>
            </div>
            <p className="text-gray-700 font-medium">
              Drop your passport photo here
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-medium">Verification Failed</p>
              <p className="mt-1 text-red-600 whitespace-pre-line">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🔒 Secure Verification</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✓ Your passport photo is processed securely</li>
          <li>✓ We only extract basic information for verification</li>
          <li>✓ Data is not stored after application submission</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isProcessing}
          className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Processing...
            </span>
          ) : (
            'Verify Passport'
          )}
        </button>
      </div>
    </div>
  );
}
