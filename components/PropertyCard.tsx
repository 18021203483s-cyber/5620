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

        {/* Score Breakdown */}
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

        {/* Action */}
        <button 
          className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          {isSelected ? '✓ Selected' : 'View Details & Apply'}
        </button>
      </div>
    </div>
  );
}
