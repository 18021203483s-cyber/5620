// ============================================
// Mock Property Data
// ============================================
// This data is based on the team's homepilot-ai website
// Sydney CBD and surrounding areas

import { Property } from './types';

export const properties: Property[] = [
  // Sydney CBD
  {
    id: 'prop-001',
    address: '101 George Street',
    suburb: 'Sydney CBD',
    price: 650,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    lat: -33.8599,
    lng: 151.2090,
    features: ['City View', 'Pool', 'Gym', 'Concierge'],
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    description: 'Stunning 2 bedroom apartment in the heart of Sydney CBD with panoramic city views.'
  },
  {
    id: 'prop-002',
    address: '45 Liverpool Street',
    suburb: 'Sydney CBD',
    price: 520,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    lat: -33.8740,
    lng: 151.2050,
    features: ['Furnished', 'Close to Transport', 'Modern'],
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    description: 'Modern 1 bedroom apartment near Hyde Park and Central Station.'
  },
  {
    id: 'prop-003',
    address: '88 Pitt Street',
    suburb: 'Sydney CBD',
    price: 750,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    lat: -33.8615,
    lng: 151.2075,
    features: ['Luxury', 'Harbour View', 'Spa', '24/7 Security'],
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    description: 'Premium 3 bedroom luxury apartment with stunning harbour views.'
  },

  // Surry Hills
  {
    id: 'prop-004',
    address: '15 Fitzroy Street',
    suburb: 'Surry Hills',
    price: 480,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    lat: -33.8819,
    lng: 151.2127,
    features: ['Close to CBD', 'Cafes', 'Restaurants', 'Pet Friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    description: 'Charming 1 bedroom in vibrant Surry Hills, perfect for professionals.'
  },
  {
    id: 'prop-005',
    address: '42 Crown Street',
    suburb: 'Surry Hills',
    price: 620,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    lat: -33.8830,
    lng: 151.2155,
    features: [' courtyard', 'Pet Friendly', 'Close to Oxford Street'],
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    description: 'Spacious 2 bedroom with private courtyard in trendy Surry Hills.'
  },

  // Paddington
  {
    id: 'prop-006',
    address: '200 Oxford Street',
    suburb: 'Paddington',
    price: 580,
    bedrooms: 2,
    bathrooms: 1,
    parking: 0,
    lat: -33.8836,
    lng: 151.2269,
    features: ['Heritage Building', 'High Ceilings', 'Close to Centennial Park'],
    imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    description: 'Beautiful heritage apartment with original features near Centennial Park.'
  },
  {
    id: 'prop-007',
    address: '88 Jersey Road',
    suburb: 'Paddington',
    price: 720,
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    lat: -33.8855,
    lng: 151.2290,
    features: ['Garden', 'Quiet Street', 'Family Friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
    description: 'Family home with private garden in quiet Paddington street.'
  },

  // Newtown
  {
    id: 'prop-008',
    address: '256 King Street',
    suburb: 'Newtown',
    price: 420,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    lat: -33.8986,
    lng: 151.1798,
    features: ['Close to University', 'Cafes', 'Vibrant', 'Pet Friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
    description: 'Cosy 1 bedroom unit perfect for students and young professionals.'
  },
  {
    id: 'prop-009',
    address: '89 Erskineville Road',
    suburb: 'Newtown',
    price: 550,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    lat: -33.8960,
    lng: 151.1820,
    features: ['Renovated', 'Close to Station', 'Pet Friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800',
    description: 'Fully renovated 2 bedroom apartment near Erskineville Station.'
  },
  {
    id: 'prop-010',
    address: '145 Australia Street',
    suburb: 'Newtown',
    price: 680,
    bedrooms: 3,
    bathrooms: 1,
    parking: 1,
    lat: -33.8995,
    lng: 151.1780,
    features: ['Terrace House', 'Courtyard', 'Close to Station'],
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    description: 'Charming 3 bedroom terrace with courtyard in the heart of Newtown.'
  },

  // Redfern
  {
    id: 'prop-011',
    address: '78 Redfern Street',
    suburb: 'Redfern',
    price: 500,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    lat: -33.8924,
    lng: 151.1857,
    features: ['Close to University', 'Transport', 'Cafes'],
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    description: 'Modern 1 bedroom unit steps from Redfern Station and shops.'
  },
  {
    id: 'prop-012',
    address: '156 George Street',
    suburb: 'Redfern',
    price: 590,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    lat: -33.8900,
    lng: 151.1870,
    features: ['Renovated', 'Close to Park', 'Quiet'],
    imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    description: 'Recently renovated 2 bedroom apartment in peaceful Redfern area.'
  },

  // Ultimo
  {
    id: 'prop-013',
    address: '23 MacArthur Street',
    suburb: 'Ultimo',
    price: 460,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    lat: -33.8830,
    lng: 151.1970,
    features: ['Near UTS', 'Near TAFE', 'Study Area'],
    imageUrl: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800',
    description: 'Perfect student accommodation near UTS and UTS Library.'
  },
  {
    id: 'prop-014',
    address: '45 Wattle Street',
    suburb: 'Ultimo',
    price: 620,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    lat: -33.8810,
    lng: 151.1990,
    features: ['Near UTS', 'Harbourside', 'Pool', 'Gym'],
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    description: 'Luxury 2 bedroom near TAFE and Broadway Shopping Centre.'
  },

  // Pyrmont
  {
    id: 'prop-015',
    address: '88 Union Street',
    suburb: 'Pyrmont',
    price: 680,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    lat: -33.8690,
    lng: 151.1940,
    features: ['Water Views', 'Modern', 'Pool', 'Close to Star Casino'],
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    description: 'Modern 2 bedroom with waterfront views near The Star Casino.'
  },
  {
    id: 'prop-prop-016',
    address: '12 Miller Street',
    suburb: 'Pyrmont',
    price: 850,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    lat: -33.8660,
    lng: 151.1920,
    features: ['Penthouse', 'Panoramic Views', 'Luxury', 'Concierge'],
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    description: 'Stunning penthouse with 360-degree city and harbour views.'
  },

  // Chippendale
  {
    id: 'prop-017',
    address: '35 Abercrombie Street',
    suburb: 'Chippendale',
    price: 540,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    lat: -33.8850,
    lng: 151.2020,
    features: ['Trendy', 'Near UTS', 'Art District'],
    imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    description: 'Stylish 1 bedroom in the creative hub of Chippendale.'
  },
  {
    id: 'prop-018',
    address: '67 Kensington Street',
    suburb: 'Chippendale',
    price: 720,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    lat: -33.8860,
    lng: 151.2035,
    features: ['Warehouse Conversion', 'High Ceilings', 'Central'],
    imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    description: 'Stunning warehouse conversion with industrial chic aesthetics.'
  },

  // Darlinghurst
  {
    id: 'prop-019',
    address: '201 Oxford Street',
    suburb: 'Darlinghurst',
    price: 580,
    bedrooms: 2,
    bathrooms: 1,
    parking: 0,
    lat: -33.8780,
    lng: 151.2210,
    features: ['Vibrant', 'Nightlife', 'Cafes', 'Close to CBD'],
    imageUrl: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
    description: 'Bright 2 bedroom in the heart of Darlinghurst nightlife and dining.'
  },
  {
    id: 'prop-020',
    address: '45 Victoria Street',
    suburb: 'Darlinghurst',
    price: 450,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    lat: -33.8800,
    lng: 151.2180,
    features: ['Rooftop', 'Modern', 'Close to Kings Cross'],
    imageUrl: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
    description: 'Compact 1 bedroom with rooftop access and stunning city views.'
  },

  // Glebe
  {
    id: 'prop-021',
    address: '156 Glebe Point Road',
    suburb: 'Glebe',
    price: 510,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    lat: -33.8820,
    lng: 151.1850,
    features: ['Character', 'Close to Harbour', 'Markets'],
    imageUrl: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800',
    description: 'Classic 2 bedroom terrace house near Glebe markets and harbour.'
  },
  {
    id: 'prop-022',
    address: '89 St. Johns Road',
    suburb: 'Glebe',
    price: 650,
    bedrooms: 3,
    bathrooms: 1,
    parking: 1,
    lat: -33.8800,
    lng: 151.1860,
    features: ['Family Home', 'Garden', 'Near University'],
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    description: 'Spacious family home perfect for USYD students.'
  },

  // Haymarket
  {
    id: 'prop-023',
    address: '25 Harbour Street',
    suburb: 'Haymarket',
    price: 480,
    bedrooms: 1,
    bathrooms: 1,
    parking: 0,
    lat: -33.8790,
    lng: 151.2030,
    features: ['Near Central', 'China Town', 'Markets'],
    imageUrl: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800',
    description: 'Modern unit in the heart of Haymarket, perfect for food lovers.'
  },
  {
    id: 'prop-024',
    address: '88 Ultimo Road',
    suburb: 'Haymarket',
    price: 560,
    bedrooms: 2,
    bathrooms: 1,
    parking: 0,
    lat: -33.8770,
    lng: 151.2010,
    features: ['Near TAFE', 'Shopping', 'Transport'],
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    description: 'Convenient 2 bedroom unit steps from Central Station and TAFE.'
  },

  // Zetland
  {
    id: 'prop-025',
    address: '15 Gadigal Avenue',
    suburb: 'Zetland',
    price: 620,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    lat: -33.9050,
    lng: 151.2060,
    features: ['New Building', 'Pool', 'Gym', 'Near Green Square'],
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    description: 'Brand new 2 bedroom in luxury complex near Green Square Station.'
  },
  {
    id: 'prop-026',
    address: '23 Joynton Avenue',
    suburb: 'Zetland',
    price: 780,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    lat: -33.9070,
    lng: 151.2080,
    features: ['Penthouse', 'Terrace', 'City Views', 'New Development'],
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    description: 'Luxury penthouse with private terrace in new Green Square development.'
  },

  // Waterloo
  {
    id: 'prop-027',
    address: '45 Cope Street',
    suburb: 'Waterloo',
    price: 550,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    lat: -33.8980,
    lng: 151.2120,
    features: ['Modern', 'Near Moore Park', 'Pet Friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    description: 'Contemporary 2 bedroom apartment in vibrant Waterloo.'
  },
  {
    id: 'prop-028',
    address: '78 Storey Street',
    suburb: 'Waterloo',
    price: 700,
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    lat: -33.9000,
    lng: 151.2150,
    features: ['Family Friendly', 'Near Park', 'Quiet'],
    imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    description: 'Spacious 3 bedroom home perfect for families near Moore Park.'
  },
];

// Function to get property by ID
export function getPropertyById(id: string): Property | undefined {
  return properties.find(p => p.id === id);
}

// Function to filter properties by suburb
export function getPropertiesBySuburb(suburb: string): Property[] {
  return properties.filter(p => 
    p.suburb.toLowerCase().includes(suburb.toLowerCase())
  );
}

// Function to get all unique suburbs
export function getAllSuburbs(): string[] {
  return [...new Set(properties.map(p => p.suburb))];
}
