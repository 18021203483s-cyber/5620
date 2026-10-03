// ============================================
// Property Matching Agent (房源匹配Agent)
// Matches user requirements with available properties
// ============================================

import { UserProfile, Property, ScoredProperty } from './types';
import { properties } from './properties';

// Weight for different matching criteria
// (Sum = 100, matches the AHR-02 requirement formula)
const MATCH_WEIGHTS = {
  area: 30,      // Area Match
  price: 25,     // Price Match
  bedrooms: 25,  // Bedroom Match
  special: 20    // Special Requirements (Hard + Soft)
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
// Asymmetric pricing: below-budget properties should receive FULL credit (tenant-friendly),
// while over-budget properties are penalised proportionally.
function calculatePriceScore(property: Property, profile: Partial<UserProfile>): number {
  if (!profile.budget) {
    return 100; // No budget specified
  }

  const { max } = profile.budget;
  const price = property.price;

  // Below or within budget → full credit (tenant-friendly default)
  if (price <= max) {
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

  // Way over budget (>20%)
  return 20;
}

// Calculate bedroom match score
// Asymmetric decay: extra bedrooms = mild penalty; missing bedrooms = severe penalty.
// Hard filter (bedrooms >= required) is applied BEFORE scoring in matchProperties(),
// so diff < 0 cases here are defensive (in case hard filter is relaxed in the future).
function calculateBedroomScore(property: Property, profile: Partial<UserProfile>): number {
  if (profile.bedrooms === undefined || profile.bedrooms === null) {
    return 100; // No preference
  }

  const diff = property.bedrooms - profile.bedrooms;

  // Exact match
  if (diff === 0) return 100;

  // More bedrooms than needed — RELATIVE decay based on the ratio diff/required.
  // Rationale: a tenant asking for 1 bedroom who is shown a 2-bedroom unit is
  // seeing a +100% jump (often unwanted for budget reasons) → low score.
  // A tenant asking for 2 bedrooms who is shown a 3-bedroom unit is seeing a
  // +50% jump (extra space is usually welcome) → moderate score.
  if (diff > 0) {
    const ratio = diff / profile.bedrooms;
    if (ratio <= 0.25) return 85;                            // e.g. 4→5
    if (ratio <= 0.50) return 70;                            // e.g. 2→3
    if (ratio <= 1.00) return 50;                            // e.g. 1→2 (一点点分)
    return Math.max(30, Math.round(50 - (ratio - 1.0) * 20)); // >100% jump
  }

  // Fewer bedrooms than needed — guaranteed 0 (hard floor)
  // (also unreachable in normal flow due to the hard filter in matchProperties,
  //  but acts as a defensive guarantee that totalScore cannot exceed 0 for these.)
  return 0;
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
    if (req.includes('furnished')) {
      if (features.some(f => f.includes('furnished'))) matchedRequirements++;
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

// Filter out properties that violate any hard (must-have) requirement.
// These are absolute deal-breakers — violating ANY one removes the property
// from the candidate list before scoring (one-vote veto).
function filterHardConstraints(properties: Property[], profile: Partial<UserProfile>): Property[] {
  if (!profile.hardRequirements || profile.hardRequirements.length === 0) {
    return properties;
  }

  return properties.filter(property => {
    const features = property.features.map(f => f.toLowerCase());

    return profile.hardRequirements!.every(req => {
      const lower = req.toLowerCase();
      // Pet-friendly is a hard constraint (e.g. tenant owns a large dog)
      if (lower.includes('pet')) {
        return features.some(f => f.includes('pet'));
      }
      // Parking is a hard constraint (e.g. tenant owns a car and street parking is not an option)
      if (lower.includes('parking') || lower.includes('car')) {
        return property.parking > 0;
      }
      // Furnished is a hard constraint (e.g. tenant is moving from overseas)
      if (lower.includes('furnished')) {
        return features.some(f => f.includes('furnished'));
      }
      // Unknown hard requirement — be permissive by default
      return true;
    });
  });
}

// Main matching function
export function matchProperties(profile: Partial<UserProfile>): ScoredProperty[] {
  console.log('🎯 [Matching Agent] === START ===');
  console.log('🎯 [Matching Agent] Received profile:', JSON.stringify(profile, null, 2));
  console.log('🎯 [Matching Agent] Available properties:', properties.length);

  // Step 1: Hard (must-have) constraint filter — remove deal-breakers first
  let filteredProperties = filterHardConstraints(properties, profile);
  console.log(`🎯 [Matching Agent] After hard-constraint filter: ${filteredProperties.length} properties`);

  // Step 2: Bedroom count filter — bedrooms must be >= requirement
  // (asymmetric: missing bedrooms are fatal; extra bedrooms are tolerable)
  if (profile.bedrooms !== undefined && profile.bedrooms !== null) {
    const bedroomRequirement = profile.bedrooms;
    const before = filteredProperties.length;
    filteredProperties = filteredProperties.filter(p => p.bedrooms >= bedroomRequirement);
    console.log(`🎯 [Matching Agent] Filtered by bedrooms >= ${bedroomRequirement}: ${filteredProperties.length} properties (removed ${before - filteredProperties.length})`);
  }
  
  // Score each filtered property
  const scoredProperties: ScoredProperty[] = filteredProperties.map(property => {
    const areaScore = calculateAreaScore(property, profile);
    const priceScore = calculatePriceScore(property, profile);
    const bedroomScore = calculateBedroomScore(property, profile);
    const specialScore = calculateSpecialScore(property, profile);

    // Calculate weighted match score
    let matchScore = Math.round(
      (areaScore * MATCH_WEIGHTS.area +
       priceScore * MATCH_WEIGHTS.price +
       bedroomScore * MATCH_WEIGHTS.bedrooms +
       specialScore * MATCH_WEIGHTS.special) / 100
    );

    // Hard floor: a property with fewer bedrooms than required is a 0% match.
    // This guarantees the result is "扣 100" (i.e. totalScore === 0) when the
    // tenant's bedroom requirement is not met, even if other dimensions scored
    // very high. Acts as a second line of defence after the bedrooms hard filter.
    if (profile.bedrooms !== undefined && profile.bedrooms !== null &&
        property.bedrooms < profile.bedrooms) {
      matchScore = 0;
    }

    console.log(`🎯 [Matching Agent] Property: ${property.suburb} | Area:${areaScore} Price:${priceScore} Bed:${bedroomScore} Special:${specialScore} | Total:${matchScore}`);

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
  console.log('🎯 [Matching Agent] Top matches:', scoredProperties.slice(0, 3).map(p => `${p.suburb}: ${p.matchScore}%`));
  console.log('🎯 [Matching Agent] === END ===');

  return scoredProperties.slice(0, 10);
}

// Get property by ID
export function getPropertyById(propertyId: string): ScoredProperty | undefined {
  const property = properties.find(p => p.id === propertyId);
  if (property) {
    const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${property.lng - 0.01},${property.lat - 0.01},${property.lng + 0.01},${property.lat + 0.01}&layer=mapnik&marker=${property.lat},${property.lng}`;
    return {
      ...property,
      matchScore: 0,
      mapScore: 0,
      parkScore: 0,
      busScore: 0,
      trainScore: 0,
      priceScore: 0,
      totalScore: 0,
      staticMapUrl
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
