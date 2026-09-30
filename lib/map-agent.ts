// ============================================
// Map Scoring Agent (地图评分Agent)
// Uses OpenStreetMap data to score properties based on nearby amenities
// ============================================

import { Property, ScoredProperty, POI } from './types';

// OpenStreetMap Overpass API endpoint
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Distance calculation (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Query Overpass API for POIs
async function queryOverpass(query: string): Promise<any[]> {
  try {
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      console.error('Overpass API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error('Failed to query Overpass API:', error);
    return [];
  }
}

// Find parks near a location
async function findParks(lat: number, lng: number, radiusMeters: number = 500): Promise<POI[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["leisure"="park"](around:${radiusMeters},${lat},${lng});
      way["leisure"="park"](around:${radiusMeters},${lat},${lng});
      node["landuse"="recreation_ground"](around:${radiusMeters},${lat},${lng});
      node["leisure"="garden"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;

  const results = await queryOverpass(query);
  return results.map((el: any) => ({
    name: el.tags?.name || 'Unnamed Park',
    type: 'park' as const,
    lat: el.lat || el.center?.lat,
    lng: el.lon || el.center?.lon,
    distance: calculateDistance(lat, lng, el.lat || el.center?.lat, el.lon || el.center?.lon) * 1000
  }));
}

// Find bus stops near a location
async function findBusStops(lat: number, lng: number, radiusMeters: number = 300): Promise<POI[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["highway"="bus_stop"](around:${radiusMeters},${lat},${lng});
      node["public_transport"="stop_position"](around:${radiusMeters},${lat},${lng});
    );
    out;
  `;

  const results = await queryOverpass(query);
  return results.map((el: any) => ({
    name: el.tags?.name || 'Bus Stop',
    type: 'bus_stop' as const,
    lat: el.lat,
    lng: el.lon,
    distance: calculateDistance(lat, lng, el.lat, el.lon) * 1000
  }));
}

// Find train stations near a location
async function findTrainStations(lat: number, lng: number, radiusMeters: number = 800): Promise<POI[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["railway"="station"](around:${radiusMeters},${lat},${lng});
      node["railway"="halt"](around:${radiusMeters},${lat},${lng});
      node["public_transport"="station"](around:${radiusMeters},${lat},${lng});
      way["railway"="station"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;

  const results = await queryOverpass(query);
  return results.map((el: any) => ({
    name: el.tags?.name || 'Train Station',
    type: 'train_station' as const,
    lat: el.lat || el.center?.lat,
    lng: el.lon || el.center?.lon,
    distance: calculateDistance(lat, lng, el.lat || el.center?.lat, el.lon || el.center?.lon) * 1000
  }));
}

// Calculate score for parks
function calculateParkScore(parks: POI[]): number {
  if (parks.length === 0) return 20; // No parks nearby
  if (parks.length >= 3) return 100; // Many parks
  if (parks.length === 2) return 80;
  if (parks.length === 1) {
    const distance = parks[0].distance;
    if (distance < 200) return 90; // Very close park
    if (distance < 400) return 75;
    return 60;
  }
  return 50;
}

// Calculate score for bus stops
function calculateBusScore(busStops: POI[]): number {
  if (busStops.length === 0) return 10; // No bus stops
  if (busStops.length >= 5) return 100; // Excellent coverage
  if (busStops.length >= 3) return 80;
  if (busStops.length >= 2) return 60;
  
  // Only one stop - check distance
  const distance = busStops[0].distance;
  if (distance < 100) return 70;
  if (distance < 200) return 55;
  return 40;
}

// Calculate score for train stations
function calculateTrainScore(trainStations: POI[]): number {
  if (trainStations.length === 0) return 0; // No train access is significant
  
  // Find closest station
  const closest = trainStations.reduce((min, station) => 
    station.distance < min.distance ? station : min
  , trainStations[0]);

  if (closest.distance < 200) return 100; // Walking distance
  if (closest.distance < 400) return 90;
  if (closest.distance < 600) return 75;
  if (closest.distance < 800) return 60;
  return 40;
}

// Main function to calculate map scores for a property
export async function calculateMapScores(property: Property): Promise<{
  parkScore: number;
  busScore: number;
  trainScore: number;
  mapScore: number;
  nearbyParks: POI[];
  nearbyBusStops: POI[];
  nearbyTrainStations: POI[];
}> {
  const [parks, busStops, trainStations] = await Promise.all([
    findParks(property.lat, property.lng),
    findBusStops(property.lat, property.lng),
    findTrainStations(property.lat, property.lng)
  ]);

  const parkScore = calculateParkScore(parks);
  const busScore = calculateBusScore(busStops);
  const trainScore = calculateTrainScore(trainStations);

  // Weighted map score
  const mapScore = Math.round(
    (parkScore * 0.2) + (busScore * 0.25) + (trainScore * 0.55)
  );

  return {
    parkScore,
    busScore,
    trainScore,
    mapScore,
    nearbyParks: parks,
    nearbyBusStops: busStops,
    nearbyTrainStations: trainStations
  };
}

// Calculate map scores for multiple properties
export async function calculateMapScoresForProperties(
  properties: Property[]
): Promise<ScoredProperty[]> {
  // Process in batches to avoid rate limiting
  const results: ScoredProperty[] = [];
  
  for (const property of properties) {
    try {
      const scores = await calculateMapScores(property);
      results.push({
        ...property,
        matchScore: property.matchScore || 0,
        priceScore: property.priceScore || 0,
        ...scores,
        totalScore: 0 // Will be calculated below
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to calculate scores for property ${property.id}:`, error);
      // Use default scores
      results.push({
        ...property,
        matchScore: property.matchScore || 0,
        priceScore: property.priceScore || 0,
        parkScore: 50,
        busScore: 50,
        trainScore: 50,
        mapScore: 50,
        nearbyParks: [],
        nearbyBusStops: [],
        nearbyTrainStations: [],
        totalScore: 0
      });
    }
  }

  // Calculate total scores
  return results.map(property => ({
    ...property,
    totalScore: Math.round(
      (property.matchScore * 0.4) +
      (property.mapScore * 0.4) +
      (property.priceScore * 0.2)
    )
  }));
}

// Format POI list for display
export function formatPOISummary(
  parks: POI[],
  busStops: POI[],
  trainStations: POI[]
): string {
  const lines: string[] = [];

  if (parks.length > 0) {
    lines.push(`🌳 Parks (${parks.length}): ${parks.slice(0, 3).map(p => p.name).join(', ')}${parks.length > 3 ? '...' : ''}`);
  } else {
    lines.push('🌳 Parks: None nearby');
  }

  if (busStops.length > 0) {
    lines.push(`🚌 Bus Stops (${busStops.length}): Within walking distance`);
  } else {
    lines.push('🚌 Bus Stops: Limited coverage');
  }

  if (trainStations.length > 0) {
    const closest = trainStations.reduce((min, s) => s.distance < min.distance ? s : min);
    lines.push(`🚆 Train: ${closest.name} (${Math.round(closest.distance)}m)`);
  } else {
    lines.push('🚆 Train: No stations within 800m');
  }

  return lines.join('\n');
}

// Get score breakdown for display
export function getScoreBreakdown(property: ScoredProperty): {
  category: string;
  score: number;
  maxScore: number;
  icon: string;
}[] {
  return [
    { category: 'Match Score', score: property.matchScore, maxScore: 100, icon: '🎯' },
    { category: 'Map Score', score: property.mapScore, maxScore: 100, icon: '🗺️' },
    { category: '  - Parks', score: property.parkScore, maxScore: 100, icon: '🌳' },
    { category: '  - Bus', score: property.busScore, maxScore: 100, icon: '🚌' },
    { category: '  - Train', score: property.trainScore, maxScore: 100, icon: '🚆' },
    { category: 'Price Fit', score: property.priceScore, maxScore: 100, icon: '💰' },
    { category: 'TOTAL', score: property.totalScore, maxScore: 100, icon: '⭐' },
  ];
}
