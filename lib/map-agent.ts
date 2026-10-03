// ============================================
// Map Scoring Agent (地图评分Agent) - Member B
// Uses OpenStreetMap data + LLM to score properties based on nearby amenities
// LLM provides intelligent analysis of location quality
// ============================================

import { Property, ScoredProperty, POI, LLMAnalysis } from './types';

// OpenStreetMap Overpass API endpoint
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// LLM API Configuration
const LLM_API_URL = process.env.OPENAI_API_BASE || 'https://www.ainipy.com/v1';
const LLM_API_KEY = process.env.OPENAI_API_KEY || '';

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

// ============================================
// LLM-based Location Analyzer (NEW - Member B Feature)
// ============================================

// Local alias — keep historical name for clarity inside the file
type LLMAnalysisResult = LLMAnalysis;

// Generate static map URL for a property (embed in LLM context)
function generateStaticMapUrl(lat: number, lng: number, zoom: number = 15): string {
  // OpenStreetMap static tile URL (no API key needed)
  // Center the map on the property location
  const bbox = calculateBoundingBox(lat, lng, 0.5); // ~500m radius
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}&layer=mapnik&marker=${lat},${lng}`;
}

// Calculate bounding box for a given center point and radius in km
function calculateBoundingBox(lat: number, lng: number, radiusKm: number): { north: number; south: number; east: number; west: number } {
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = 111.32 * Math.cos(lat * Math.PI / 180);
  
  const latDelta = radiusKm / kmPerDegreeLat;
  const lngDelta = radiusKm / kmPerDegreeLng;
  
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta
  };
}

// Generate OpenRouteService static map with POIs marked
function generateAnnotatedMapUrl(lat: number, lng: number, parks: POI[], trainStations: POI[], busStops: POI[]): string {
  // Use Leaflet-style markers on a static map
  // We'll construct a URL that shows the area with markers
  
  // OpenStreetMap embed with all POI markers
  const markers = [
    `|${lat},${lng},publichouse-red.png`, // Property (red)
    ...trainStations.slice(0, 3).map(s => `|${s.lat},${s.lng},ylw-pushpin.png`), // Stations (yellow)
    ...parks.slice(0, 3).map(p => `|${p.lat},${p.lng},greensquare.png`) // Parks (green)
  ];
  
  const bbox = calculateBoundingBox(lat, lng, 1.0); // 1km radius to show POIs
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.west},${bbox.south},${bbox.east},${bbox.north}${markers.join('')}&layer=mapnik`;
}

// Check if property features mention station proximity
function hasStationFeature(features: string[]): boolean {
  return features.some(f => 
    f.toLowerCase().includes('station') || 
    f.toLowerCase().includes('transport') ||
    f.toLowerCase().includes('train')
  );
}

// Call LLM to analyze location data
async function analyzeLocationWithLLM(
  property: Property,
  parks: POI[],
  busStops: POI[],
  trainStations: POI[]
): Promise<LLMAnalysisResult> {
  console.log(`🗺️ [Map Agent] 🔮 Calling LLM to analyze location...`);
  
  if (!LLM_API_KEY) {
    console.log(`🗺️ [Map Agent] ⚠️ No LLM API key configured!`);
    return getDefaultAnalysis(property, parks, busStops, trainStations);
  }

  const parkNames = parks.length > 0 
    ? parks.slice(0, 5).map(p => p.name).join(', ') 
    : 'None';
  const stationNames = trainStations.length > 0 
    ? trainStations.slice(0, 5).map(s => s.name).join(', ') 
    : 'None';
  const closestStation = trainStations.length > 0
    ? trainStations.reduce((min, s) => s.distance < min.distance ? s : min)
    : null;
  const closestStationText = closestStation
    ? `${closestStation.name} (~${Math.round(closestStation.distance)}m)`
    : 'No station within 2km';
  
  // Generate static map URL for visual context
  const staticMapUrl = generateAnnotatedMapUrl(property.lat, property.lng, parks, trainStations, busStops);
  
  // Check if property is advertised as close to station
  const isAdvertisedNearStation = hasStationFeature(property.features);

  const prompt = `You are an expert local real-estate analyst writing for a renter who is considering THIS SPECIFIC PROPERTY in Sydney, Australia. Be concrete — reference real names, distances, and streets. Speak warmly but factually, like a knowledgeable local.

**Property under review**
- Suburb: ${property.suburb}
- Address: ${property.address}
- Weekly rent: $${property.price}
- Bedrooms: ${property.bedrooms}
- Coordinates: (${property.lat}, ${property.lng})
- Listed features: ${property.features.join(', ') || 'none specified'}
- Description: ${property.description}
- Advertised as "close to station": ${isAdvertisedNearStation ? 'YES' : 'No'}
- Closest verified train station: ${closestStationText}

**Verified nearby amenities (OpenStreetMap)**
- Parks / green space (${parks.length}): ${parkNames}
- Train stations (${trainStations.length}): ${stationNames}
- Bus stops (${busStops.length}) nearby

**Scoring (use as guidance only, you can adjust if justified)**
1. Walkability — parks, tree-lined streets, mixed-use streets where daily errands are walkable. Newtown / Glebe with 2+ parks = 85+.
2. Transit — Sydney is train-centric; a station within 800m is excellent. Strong bus networks can compensate when no train is close.
3. Lifestyle — cafe/restaurant culture, atmosphere, who tends to live there, weekend vibe.
4. Enhanced Map Score = Walkability*0.35 + Transit*0.40 + Lifestyle*0.25

**Your task — write a DETAILED analysis (the renter will actually read this).**

Return ONLY valid JSON in EXACTLY this shape:
{
  "walkabilityScore": <0-100 integer>,
  "transitScore": <0-100 integer>,
  "lifestyleScore": <0-100 integer>,
  "enhancedMapScore": <0-100 integer>,

  "locationDescription": "<3-5 sentences. Start by naming the suburb and its overall character. Then describe what's immediately around the address (parks, station, main street) with real names and distances. End with a sentence on what kind of renter this suits.>",

  "commuteNotes": "<2-3 sentences on typical commute times: how long to Sydney CBD by train/bus at peak, what line, plus weekend/off-peak notes. Mention the actual line (e.g. Inner West Line, T2).>",

  "lifestyleVibe": "<1-2 sentences capturing the feel of the neighbourhood — cafe/restaurant scene, weekend vibe, demographic, noise.>",

  "highlights": [
    "<one specific positive, e.g. 'X Park is a 4-minute walk' or '4 different bus routes within 200m'>",
    "<another specific positive>",
    "<another specific positive>",
    "<another specific positive (optional 4th)>"
  ],

  "recommendation": "<1-2 sentences — a clear, honest verdict for a renter at this price point.>"
}

IMPORTANT:
- Reference actual station/place names from the data above. Do NOT invent places.
- If amenities are sparse, say so honestly rather than overselling.
- Keep locationDescription readable, ~60-100 words.
- Return ONLY the JSON object, no markdown fences, no extra text.`;

  try {
    const response = await fetch(`${LLM_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5.6-sol',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful real estate analyst. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🗺️ [Map Agent] LLM API error: ${response.status} - ${errorText}`);
      return getDefaultAnalysis(property, parks, busStops, trainStations);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.log(`🗺️ [Map Agent] ⚠️ Empty LLM response, using default`);
      return getDefaultAnalysis(property, parks, busStops, trainStations);
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`🗺️ [Map Agent] ⚠️ Could not parse JSON, using default`);
      return getDefaultAnalysis(property, parks, busStops, trainStations);
    }

    const result = JSON.parse(jsonMatch[0]) as LLMAnalysisResult;
    console.log(`🗺️ [Map Agent] ✅ LLM Analysis: ${result.locationDescription}`);
    console.log(`🗺️ [Map Agent] 📊 Scores - Transit:${result.transitScore} Walk:${result.walkabilityScore} Lifestyle:${result.lifestyleScore} => Map:${result.enhancedMapScore}`);
    
    return result;
  } catch (error) {
    console.error(`🗺️ [Map Agent] ❌ LLM call failed:`, error);
    return getDefaultAnalysis(property, parks, busStops, trainStations);
  }
}

// Default analysis when LLM is unavailable
function getDefaultAnalysis(
  property: Property,
  parks: POI[],
  busStops: POI[],
  trainStations: POI[]
): LLMAnalysisResult {
  console.log(`🗺️ [Map Agent] ⚠️ Using default analysis for ${property.suburb}`);
  
  // Sydney suburb-based transit intelligence (trains)
  const suburbTransitScores: { [key: string]: number } = {
    'newtown': 85,      // Inner West Line
    'glebe': 75,         // Near Ultimo/Rozelle
    'haymarket': 90,    // Central Station area
    'waterloo': 80,      // Near Green Square
    'surry hills': 85,   // Near Central
    'pyrmont': 75,       // Near Pyrmont Bridge
    'zetland': 80,       // Near Green Square
    'redfern': 90,       // Major station
    'parramatta': 95,   // Major station
    'chatswood': 95,    // Major station
    'bondi junction': 90 // Major station
  };
  
  // Sydney suburb-based walkability (parks & lifestyle)
  const suburbWalkabilityScores: { [key: string]: number } = {
    'newtown': 95,       // King Street, parks everywhere
    'glebe': 90,         // Glebe Point Road, foreshore
    'haymarket': 70,     // Chinatown, urban
    'waterloo': 85,      // parks nearby, new development
    'surry hills': 90,   // Crown Street, cafes
    'pyrmont': 85,       // Foreshore, park
    'zetland': 88,       // East Village, parks
    'redfern': 75,       // Urban, some parks
    'parramatta': 70,    // CBD, limited green
    'chatswood': 75,     // Urban CBD
    'bondi junction': 85  // Near parks/beach
  };
  
  // Calculate actual transit score
  let transitScore = 50; // Default
  const suburbKey = property.suburb.toLowerCase();
  
  if (trainStations.length > 0) {
    // Use OSM data if available
    const closestDistance = Math.min(...trainStations.map(s => s.distance));
    if (closestDistance < 300) transitScore = 100;
    else if (closestDistance < 600) transitScore = 90;
    else if (closestDistance < 1000) transitScore = 80;
    else if (closestDistance < 1500) transitScore = 70;
    else transitScore = 60;
  } else if (suburbTransitScores[suburbKey]) {
    // Use suburb knowledge
    transitScore = suburbTransitScores[suburbKey];
  } else if (busStops.length >= 5) {
    // Good bus coverage can compensate
    transitScore = 65;
  } else if (busStops.length >= 2) {
    transitScore = 55;
  }
  
  // Calculate walkability score
  let walkabilityScore = 50;
  
  if (parks.length >= 3) {
    walkabilityScore = 95;
  } else if (parks.length === 2) {
    walkabilityScore = 85;
  } else if (parks.length === 1) {
    walkabilityScore = parks[0].distance < 300 ? 80 : 65;
  } else if (suburbWalkabilityScores[suburbKey]) {
    // Use suburb knowledge
    walkabilityScore = suburbWalkabilityScores[suburbKey];
  }
  
  // Add bus coverage bonus
  if (busStops.length >= 5) {
    walkabilityScore = Math.min(100, walkabilityScore + 10);
  }
  
  // Lifestyle score (parks + transit)
  const lifestyleScore = Math.round((walkabilityScore + transitScore) / 2);
  
  // Enhanced map score
  const enhancedMapScore = Math.round(
    transitScore * 0.40 + 
    walkabilityScore * 0.35 + 
    lifestyleScore * 0.25
  );

  console.log(`🗺️ [Map Agent] Default scores: Transit=${transitScore}, Walk=${walkabilityScore}, Lifestyle=${lifestyleScore}, Map=${enhancedMapScore}`);

  return {
    walkabilityScore: Math.round(walkabilityScore),
    transitScore: Math.round(transitScore),
    lifestyleScore: Math.round(lifestyleScore),
    enhancedMapScore,
    locationDescription: `${property.suburb} sits in Sydney's inner ring with ${trainStations.length > 0 || transitScore >= 70 ? 'strong' : 'moderate'} public transport links and ${parks.length >= 2 ? 'plenty of green space' : 'a handful of nearby parks'} for everyday use.`,
    commuteNotes: trainStations.length > 0
      ? `The closest station is roughly a ${Math.round(Math.min(...trainStations.map(s => s.distance)) / 80)}-minute walk, putting the Sydney CBD within about 15-25 minutes by train.`
      : `Train access is limited, so bus connections or driving will be the main commute option.`,
    lifestyleVibe: `${property.suburb} has a relaxed, residential feel with a small village centre.`,
    highlights: [
      parks.length > 0 ? `${parks[0].name} is the closest park${parks.length > 1 ? ' (plus ' + (parks.length - 1) + ' more nearby)' : ''}` : 'Quiet residential street',
      trainStations.length > 0 ? `Train station reachable on foot (${Math.round(Math.min(...trainStations.map(s => s.distance)))}m)` : (busStops.length >= 3 ? 'Several bus stops within walking distance' : 'Bus coverage in the area'),
      `Listed at $${property.price}/week — a ${property.bedrooms}-bedroom place in ${property.suburb}`,
    ].filter(Boolean),
    recommendation: transitScore >= 70 
      ? `Solid pick at this price point — good transport links and a liveable neighbourhood.`
      : `Worth a closer look if transport links suit your commute.`
  };
}

// ============================================
// OpenStreetMap Data Fetching (unchanged)
// ============================================

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
      console.error(`🗺️ [Map Agent] Overpass API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error('🗺️ [Map Agent] Overpass query failed:', error);
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
async function findTrainStations(lat: number, lng: number, radiusMeters: number = 2000): Promise<POI[]> {
  const query = `
    [out:json][timeout:30];
    (
      node["railway"="station"](around:${radiusMeters},${lat},${lng});
      node["railway"="halt"](around:${radiusMeters},${lat},${lng});
      node["station"="subway"](around:${radiusMeters},${lat},${lng});
      way["railway"="station"](around:${radiusMeters},${lat},${lng});
      node["public_transport"="station"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;

  const results = await queryOverpass(query);
  console.log(`🗺️ [Map Agent] Train stations found: ${results.length}`);
  return results.map((el: any) => ({
    name: el.tags?.name || 'Train Station',
    type: 'train_station' as const,
    lat: el.lat || el.center?.lat,
    lng: el.lon || el.center?.lon,
    distance: calculateDistance(lat, lng, el.lat || el.center?.lat, el.lon || el.center?.lon) * 1000
  }));
}

// Calculate basic scores (used as fallback or supplementary)
function calculateBasicScores(parks: POI[], busStops: POI[], trainStations: POI[], property?: Property) {
  // Check if property is advertised as close to station
  const isAdvertisedNearStation = property && hasStationFeature(property.features);
  
  // Sydney suburb-based transit intelligence (for fallback when OSM data is limited)
  const suburbTransitScores: { [key: string]: number } = {
    'newtown': 85, 'glebe': 75, 'haymarket': 90, 'waterloo': 80,
    'surry hills': 85, 'pyrmont': 75, 'zetland': 80, 'redfern': 90,
    'parramatta': 95, 'chatswood': 95, 'bondi junction': 90
  };
  
  const suburbKey = property?.suburb?.toLowerCase() || '';
  const suburbDefaultTransit = suburbTransitScores[suburbKey] || 60;
  
  // Park score
  let parkScore = 40; // Baseline - most inner-Sydney areas have some green
  if (parks.length >= 3) parkScore = 100;
  else if (parks.length === 2) parkScore = 85;
  else if (parks.length === 1) parkScore = parks[0].distance < 300 ? 80 : 65;

  // Bus score - inner city areas have excellent bus coverage
  let busScore = 45; // Baseline - Sydney inner city always has buses
  if (busStops.length >= 8) busScore = 100;
  else if (busStops.length >= 5) busScore = 85;
  else if (busStops.length >= 3) busScore = 70;
  else if (busStops.length === 2) busScore = 60;
  else if (busStops.length === 1) busScore = busStops[0].distance < 200 ? 55 : 45;

  // Walkability based on parks/green spaces - pedestrian-friendly areas have greenery
  let walkability = 50; // Baseline
  if (parks.length >= 3) walkability = 95;
  else if (parks.length === 2) walkability = 85;
  else if (parks.length === 1) {
    walkability = parks[0].distance < 400 ? 80 : 60;
  } else {
    // Use suburb knowledge for walkability
    const suburbWalkability: { [key: string]: number } = {
      'newtown': 95, 'glebe': 90, 'haymarket': 65, 'waterloo': 85,
      'surry hills': 88, 'pyrmont': 82, 'zetland': 85
    };
    walkability = suburbWalkability[suburbKey] || 55;
  }
  
  // Extra walkability bonus for inner-city areas with good bus coverage (mixed use)
  if (busStops.length >= 5 && parks.length >= 1) {
    walkability = Math.min(100, walkability + 8);
  }

  // Train score - with fallback for suburb knowledge and advertised proximity
  let trainScore = suburbDefaultTransit; // Use suburb knowledge as baseline
  if (trainStations.length > 0) {
    const closest = Math.min(...trainStations.map(s => s.distance));
    // Use OSM data if available
    if (closest < 300) trainScore = 100;
    else if (closest < 600) trainScore = 90;
    else if (closest < 1000) trainScore = 80;
    else if (closest < 1500) trainScore = 70;
    else if (closest < 2000) trainScore = 60;
  } else if (isAdvertisedNearStation) {
    // OSM didn't find stations, but property is advertised as near station
    trainScore = Math.max(trainScore, 65);
  }

  // Combined transit score: trains weighted heavily, but good buses add value
  let transitScore = trainScore;
  if (trainScore < 50 && busScore >= 50) {
    transitScore = Math.round((trainScore * 0.4 + busScore * 0.6)); // Good buses can compensate
  } else if (trainScore >= 70 && busScore >= 70) {
    transitScore = Math.round(trainScore * 1.1); // Bonus for good bus coverage
  }

  const basicMapScore = Math.round(
    (transitScore * 0.40) +  // Transit (train + bus)
    (walkability * 0.35) + 
    (parkScore * 0.25)
  );

  return { parkScore, busScore, trainScore, basicMapScore, transitScore };
}

// ============================================
// Main Export Functions
// ============================================

// Main function to calculate map scores for a property
export async function calculateMapScores(property: Property): Promise<{
  parkScore: number;
  busScore: number;
  trainScore: number;
  mapScore: number;
  nearbyParks: POI[];
  nearbyBusStops: POI[];
  nearbyTrainStations: POI[];
  llmAnalysis?: LLMAnalysisResult;
  staticMapUrl: string;
}> {
  console.log(`🗺️ [Map Agent] Processing: ${property.suburb}...`);
  
  // Get OSM data
  console.log(`🗺️ [Map Agent] Fetching OSM data for ${property.suburb} (${property.lat}, ${property.lng})...`);
  const [parks, busStops, trainStations] = await Promise.all([
    findParks(property.lat, property.lng),
    findBusStops(property.lat, property.lng),
    findTrainStations(property.lat, property.lng)
  ]);

  // Generate static map URL for UI display
  const staticMapUrl = generateAnnotatedMapUrl(property.lat, property.lng, parks, trainStations, busStops);

  console.log(`🗺️ [Map Agent] OSM Raw Data: Parks=${parks.length}, Bus=${busStops.length}, Trains=${trainStations.length}`);
  if (trainStations.length > 0) {
    trainStations.forEach(s => console.log(`🗺️ [Map Agent]   🚆 ${s.name} - ${Math.round(s.distance)}m`));
  }
  if (busStops.length > 0) {
    console.log(`🗺️ [Map Agent]   🚌 First few: ${busStops.slice(0, 3).map(b => b.name).join(', ')}`);
  }

  // Calculate basic scores from OSM data
  const { parkScore, busScore, trainScore, basicMapScore, transitScore } = calculateBasicScores(parks, busStops, trainStations, property);
  
  console.log(`🗺️ [Map Agent] Basic Scores: Parks=${parkScore}, Bus=${busScore}, Train=${trainScore}, Transit=${transitScore}, Map=${basicMapScore}`);

  // Get LLM-enhanced analysis (Member B feature)
  console.log(`🗺️ [Map Agent] 🔮 Calling LLM to analyze location...`);
  const llmAnalysis = await analyzeLocationWithLLM(property, parks, busStops, trainStations);

  // Use LLM score if available, otherwise use basic score
  const mapScore = llmAnalysis?.enhancedMapScore || basicMapScore;

  console.log(`🗺️ [Map Agent] ${property.suburb}: Basic=${basicMapScore}, LLM=${llmAnalysis?.enhancedMapScore || 'N/A'} => Final=${mapScore}`);

  return {
    parkScore,
    busScore,
    trainScore,
    mapScore,
    nearbyParks: parks,
    nearbyBusStops: busStops,
    nearbyTrainStations: trainStations,
    llmAnalysis,
    staticMapUrl
  };
}

// Calculate map scores for multiple properties
export async function calculateMapScoresForProperties(
  properties: Property[]
): Promise<ScoredProperty[]> {
  console.log(`🗺️ [Map Agent] ═══ START (${properties.length} properties) ═══`);
  console.log(`🗺️ [Map Agent] Using LLM API: ${LLM_API_KEY ? 'YES ✅' : 'NO ❌ (using basic scores)'}`);
  
  const results: ScoredProperty[] = [];
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    console.log(`🗺️ [Map Agent] [${i + 1}/${properties.length}] ${property.suburb}...`);
    
    try {
      const scores = await calculateMapScores(property);
      results.push({
        ...property,
        matchScore: property.matchScore || 0,
        priceScore: property.priceScore || 0,
        ...scores,
        totalScore: 0,
        staticMapUrl: scores.staticMapUrl
      });
      
      // Delay between LLM calls
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`🗺️ [Map Agent] ERROR ${property.suburb}:`, error);
      const fallbackStaticMapUrl = generateAnnotatedMapUrl(
        property.lat, property.lng, [], [], []
      );
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
        totalScore: 0,
        staticMapUrl: fallbackStaticMapUrl
      });
    }
  }

  // Calculate total scores
  const finalResults = results.map(property => {
    const totalScore = Math.round(
      (property.matchScore * 0.4) +
      (property.mapScore * 0.4) +
      (property.priceScore * 0.2)
    );
    console.log(`🗺️ [Map Agent] ✓ ${property.suburb}: Match=${property.matchScore}, Map=${property.mapScore}, Price=${property.priceScore} => TOTAL=${totalScore}`);
    return { ...property, totalScore };
  });

  console.log(`🗺️ [Map Agent] ═══ END ═══`);
  return finalResults;
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
    lines.push('🚆 Train: No stations within 1.5km');
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
  const breakdown = [
    { category: 'Match Score', score: property.matchScore, maxScore: 100, icon: '🎯' },
    { category: 'Map Score', score: property.mapScore, maxScore: 100, icon: '🗺️' },
    { category: '  - Parks', score: property.parkScore, maxScore: 100, icon: '🌳' },
    { category: '  - Bus', score: property.busScore, maxScore: 100, icon: '🚌' },
    { category: '  - Train', score: property.trainScore, maxScore: 100, icon: '🚆' },
    { category: 'Price Fit', score: property.priceScore, maxScore: 100, icon: '💰' },
    { category: 'TOTAL', score: property.totalScore, maxScore: 100, icon: '⭐' },
  ];

  // Add LLM analysis if available
  if (property.llmAnalysis) {
    const llm = property.llmAnalysis;
    breakdown.splice(2, 0,
      { category: '  - LLM Walk', score: llm.walkabilityScore, maxScore: 100, icon: '🚶' },
      { category: '  - LLM Transit', score: llm.transitScore, maxScore: 100, icon: '🚇' },
      { category: '  - LLM Lifestyle', score: llm.lifestyleScore, maxScore: 100, icon: '🏙️' }
    );
  }

  return breakdown;
}
