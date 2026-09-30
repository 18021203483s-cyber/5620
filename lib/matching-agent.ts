// ============================================
// Property Matching Agent (房源匹配Agent)
// Matches user requirements with available properties
// ============================================

import { UserProfile, Property, ScoredProperty } from './types';
import { properties } from './properties';

// Weight for different matching criteria
const MATCH_WEIGHTS = {
  area: 30,
  price: 25,
  bedrooms: 25,
  special: 20
};

// Calculate area match score
function calculateAreaScore(property: Property, profile: Partial<UserProfile>): number {
  if (!profile.preferredAreas || profile.preferredAreas.length === 0) {
    return 100; // No preference, full score
  }

  const propertyArea = property.suburb.toLowerCase();
  const preferredAreas = profile.preferredAreas.map(a => a.toLowerCase());

  // Exact match
  if (preferredAreas.some(area => propertyArea.includes(area) || area.includes(propertyArea))) {
    return 100;
  }

  // Sydney CBD as default - check if property is in CBD
  if (preferredAreas.some(area => area.includes('cbd')) && 
      (propertyArea.includes('sydney') || propertyArea.includes('haymarket'))) {
    return 90;
  }

  // Calculate distance from preferred areas (simplified)
  // In production, would use actual geocoding
  const nearbyAreas: { [key: string]: string[] } = {
    'surry hills': ['darlinghurst', 'paddington', 'city'],
    'newtown': ['glebe', 'redfern', 'chippendale', 'ultimo'],
    'pyrmont': ['ultimo', 'city', 'blackwattle'],
    'zetland': ['waterloo', 'alexandria', 'rosebery'],
  };

  for (const [area, neighbors] of Object.entries(nearbyAreas)) {
    if (preferredAreas.includes(area)) {
      if (neighbors.some(n => propertyArea.includes(n))) {
        return 70;
      }
    }
  }

  // Different area
  return 30;
}

// Calculate price match score
function calculatePriceScore(property: Property, profile: Partial<UserProfile>): number {
  if (!profile.budget) {
    return 100; // No budget specified
  }

  const { min, max } = profile.budget;
  const price = property.price;

  // Within budget
  if (price >= min && price <= max) {
    return 100;
  }

  // Slightly over budget (up to 10%)
  if (price > max && price <= max * 1.1) {
    return 80;
  }

  // Over budget (10-20%)
  if (price > max * 1.1 && price <= max * 1.2) {
    return 60;
  }

  // Under budget - also penalized slightly
  if (price < min && price >= min * 0.8) {
    return 90;
  }

  // Way over or under budget
  return 30;
}

// Calculate bedroom match score
function calculateBedroomScore(property: Property, profile: Partial<UserProfile>): number {
  if (profile.bedrooms === undefined || profile.bedrooms === null) {
    return 100; // No preference
  }

  const diff = Math.abs(property.bedrooms - profile.bedrooms);
  
  if (diff === 0) return 100;
  if (diff === 1) return 80;
  if (diff === 2) return 50;
  return 30;
}

// Calculate special requirements match
function calculateSpecialScore(property: Property, profile: Partial<UserProfile>): number {
  if (!profile.specialRequirements || profile.specialRequirements.length === 0) {
    return 100;
  }

  const features = property.features.map(f => f.toLowerCase());
  const requirements = profile.specialRequirements.map(r => r.toLowerCase());

  let matchedRequirements = 0;

  for (const req of requirements) {
    if (req.includes('pet')) {
      if (features.some(f => f.includes('pet'))) matchedRequirements++;
    }
    if (req.includes('parking') || req.includes('car')) {
      if (property.parking > 0) matchedRequirements++;
    }
    if (req.includes('transport') || req.includes('train') || req.includes('bus')) {
      // Assume properties near city have good transport
      if (features.some(f => f.includes('station')) || 
          property.suburb.toLowerCase().includes('city') ||
          property.suburb.toLowerCase().includes('ultimo')) {
        matchedRequirements++;
      }
    }
  }

  return (matchedRequirements / requirements.length) * 100;
}

// Main matching function
export function matchProperties(profile: Partial<UserProfile>): ScoredProperty[] {
  // Score each property
  const scoredProperties: ScoredProperty[] = properties.map(property => {
    const areaScore = calculateAreaScore(property, profile);
    const priceScore = calculatePriceScore(property, profile);
    const bedroomScore = calculateBedroomScore(property, profile);
    const specialScore = calculateSpecialScore(property, profile);

    // Calculate weighted match score
    const matchScore = Math.round(
      (areaScore * MATCH_WEIGHTS.area +
       priceScore * MATCH_WEIGHTS.price +
       bedroomScore * MATCH_WEIGHTS.bedrooms +
       specialScore * MATCH_WEIGHTS.special) / 100
    );

    return {
      ...property,
      matchScore,
      mapScore: 0, // Will be calculated by map agent
      parkScore: 0,
      busScore: 0,
      trainScore: 0,
      priceScore,
      totalScore: 0 // Will be calculated after map scores
    };
  });

  // Sort by match score (descending)
  scoredProperties.sort((a, b) => b.matchScore - a.matchScore);

  // Return top 10 matches
  return scoredProperties.slice(0, 10);
}

// Get property by ID
export function getPropertyById(propertyId: string): ScoredProperty | undefined {
  const property = properties.find(p => p.id === propertyId);
  if (property) {
    return {
      ...property,
      matchScore: 0,
      mapScore: 0,
      parkScore: 0,
      busScore: 0,
      trainScore: 0,
      priceScore: 0,
      totalScore: 0
    };
  }
  return undefined;
}

// Generate match summary
export function generateMatchSummary(scoredProperty: ScoredProperty, profile: Partial<UserProfile>): string {
  const reasons: string[] = [];

  if (scoredProperty.matchScore >= 80) {
    reasons.push(`Excellent overall match (${scoredProperty.matchScore}%)`);
  } else if (scoredProperty.matchScore >= 60) {
    reasons.push(`Good match (${scoredProperty.matchScore}%)`);
  } else {
    reasons.push(`Partial match (${scoredProperty.matchScore}%)`);
  }

  if (scoredProperty.priceScore >= 90) {
    reasons.push('Within your budget');
  } else if (scoredProperty.priceScore < 70) {
    reasons.push('Price may be outside your range');
  }

  if (profile.preferredAreas && profile.preferredAreas.length > 0) {
    const isPreferred = profile.preferredAreas.some(
      area => scoredProperty.suburb.toLowerCase().includes(area.toLowerCase())
    );
    if (isPreferred) {
      reasons.push(`In your preferred area (${scoredProperty.suburb})`);
    }
  }

  if (profile.specialRequirements && profile.specialRequirements.length > 0) {
    const matchedReqs = profile.specialRequirements.filter(req => {
      const lowerReq = req.toLowerCase();
      if (lowerReq.includes('pet') && scoredProperty.features.some(f => f.toLowerCase().includes('pet'))) {
        return true;
      }
      if ((lowerReq.includes('parking') || lowerReq.includes('car')) && scoredProperty.parking > 0) {
        return true;
      }
      return false;
    });
    if (matchedReqs.length > 0) {
      reasons.push(`Meets: ${matchedReqs.join(', ')}`);
    }
  }

  return reasons.join('\n• ');
}
