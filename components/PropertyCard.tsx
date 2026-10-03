'use client';

import { ScoredProperty } from '@/lib/types';
import { getScoreBreakdown } from '@/lib/map-agent';

interface PropertyCardProps {
  property: ScoredProperty;
  onSelect: () => void;
  isSelected?: boolean;
}

export default function PropertyCard({ property, onSelect, isSelected = false }: PropertyCardProps) {
  const scoreBreakdown = getScoreBreakdown(property);
  const totalScore = scoreBreakdown.find(s => s.category === 'TOTAL');
  const llm = property.llmAnalysis;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getOverallBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
      }`}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-200">
        <img
          src={property.imageUrl}
          alt={property.address}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
          }}
        />
        {/* Price Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
          <span className="text-lg font-bold text-blue-600">${property.price}</span>
          <span className="text-sm text-gray-500">/week</span>
        </div>
        {/* Score Badge */}
        {totalScore && (
          <div className={`absolute top-3 right-3 ${getOverallBadgeColor(totalScore.score)} text-white px-3 py-1.5 rounded-lg shadow-sm font-bold`}>
            {totalScore.score}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 truncate">{property.address}</h4>
        <p className="text-sm text-gray-500 mb-3">{property.suburb}</p>

        {/* Features */}
        <div className="flex gap-3 text-sm text-gray-600 mb-3">
          <span>🛏️ {property.bedrooms} bed</span>
          <span>🛁 {property.bathrooms} bath</span>
          <span>🚗 {property.parking > 0 ? property.parking : '-'} parking</span>
        </div>

        {/* Features Tags */}
        {property.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {property.features.slice(0, 3).map((feature, i) => (
              <span
                key={i}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Score Breakdown — compact */}
        <div className="space-y-1.5">
          {scoreBreakdown.slice(0, 4).map((item) => (
            <div key={item.category} className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs text-gray-500 flex-1">{item.category}</span>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreColor(item.score)}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${getScoreColor(item.score).split(' ')[1]}`}>
                {item.score}%
              </span>
            </div>
          ))}
        </div>

        {/* AI Location Analysis — shown prominently below scores */}
        {llm && (
          <div
            className="mt-4 border-t border-gray-100 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🤖</span>
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                AI Location Insights
              </span>
            </div>

            {/* Main description */}
            {llm.locationDescription && (
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {llm.locationDescription}
              </p>
            )}

            {/* Lifestyle vibe */}
            {llm.lifestyleVibe && (
              <p className="text-xs text-gray-600 italic mb-3">
                {llm.lifestyleVibe}
              </p>
            )}

            {/* Highlights as bullets */}
            {llm.highlights && llm.highlights.length > 0 && (
              <ul className="text-sm text-gray-700 space-y-1 mb-3">
                {llm.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Commute notes */}
            {llm.commuteNotes && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 mb-3">
                <div className="flex items-start gap-2">
                  <span className="text-sm">🚆</span>
                  <div className="text-xs text-blue-900">
                    <div className="font-semibold mb-0.5">Commute</div>
                    <div className="text-blue-800 leading-relaxed">{llm.commuteNotes}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendation verdict */}
            {llm.recommendation && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-sm">⭐</span>
                  <p className="text-xs text-purple-900 leading-relaxed">
                    {llm.recommendation}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map Link */}
        {property.staticMapUrl && (
          <a
            href={property.staticMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-3 text-center text-xs text-blue-600 hover:text-blue-700 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            🗺️ View Area on Map
          </a>
        )}

        {/* Action */}
        <button
          className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
            isSelected
              ? 'bg-blue-500 text-white'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          {isSelected ? '✓ Viewing Location' : '📍 View Location'}
        </button>
      </div>
    </div>
  );
}