'use client';

import { useState } from 'react';
import { UserProfile, PassportInfo, ScoredProperty } from '@/lib/types';
import { generateApplication, formatApplicationForDisplay, generatePlainTextApplication, generateContactMessage } from '@/lib/communication-agent';

interface ApplicationFormProps {
  userProfile: UserProfile;
  passportInfo: PassportInfo;
  property: ScoredProperty;
  onSubmit: () => void;
}

export default function ApplicationForm({ userProfile, passportInfo, property, onSubmit }: ApplicationFormProps) {
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const application = generateApplication(userProfile, passportInfo, property, additionalNotes);
  const formattedApp = formatApplicationForDisplay(application);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    onSubmit();
  };

  const handleCopyToClipboard = async () => {
    const text = generatePlainTextApplication(formattedApp);
    await navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = generateContactMessage(formattedApp);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Rental Application - ${property.address}`);
    const body = encodeURIComponent(generatePlainTextApplication(formattedApp));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📋 Rental Application</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review and submit your application
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">{property.totalScore}%</div>
          <div className="text-sm text-gray-500">Match Score</div>
        </div>
      </div>

      {/* Property Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{property.address}</h3>
            <p className="text-blue-100">{property.suburb}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span>{property.bedrooms} bed</span>
              <span>{property.bathrooms} bath</span>
              <span>{property.parking} parking</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${property.price}</div>
            <div className="text-sm text-blue-100">/week</div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>👤</span> Personal Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Full Name</label>
            <p className="font-medium text-gray-900">{formattedApp.personalInfo.fullName}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500">Passport Number</label>
            <p className="font-medium text-gray-900">{formattedApp.personalInfo.passportNumber}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500">Nationality</label>
            <p className="font-medium text-gray-900">{formattedApp.personalInfo.nationality}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500">Date of Birth</label>
            <p className="font-medium text-gray-900">{formattedApp.personalInfo.dateOfBirth}</p>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Contact Email</label>
            <p className="font-medium text-gray-900">{formattedApp.personalInfo.contactEmail}</p>
          </div>
        </div>
        {passportInfo.verified && (
          <div className="mt-3 flex items-center gap-2 text-green-700 text-sm">
            <span>✓</span> Passport Verified
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📊</span> Application Scores
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Match Score</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${formattedApp.scores.matchScore}%` }}
                />
              </div>
              <span className="font-medium text-gray-900 w-12">{formattedApp.scores.matchScore}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Map Score</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${formattedApp.scores.mapScore}%` }}
                />
              </div>
              <span className="font-medium text-gray-900 w-12">{formattedApp.scores.mapScore}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-semibold text-gray-900">Total Score</span>
            <span className="font-bold text-blue-600 text-lg">{formattedApp.scores.totalScore}%</span>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Any additional information you'd like to share with the landlord..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Share Options */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">📤 Share Application</h4>
        <div className="flex gap-2">
          <button
            onClick={handleCopyToClipboard}
            className="flex-1 py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            {showCopied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            💬 WhatsApp
          </button>
          <button
            onClick={handleShareEmail}
            className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            ✉️ Email
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin">⏳</span>
            Submitting Application...
          </>
        ) : (
          <>
            🚀 Submit Application
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        By submitting, you agree to share your information with the property owner/agent.
      </p>
    </div>
  );
}
