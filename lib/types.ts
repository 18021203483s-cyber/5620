// ============================================
// Core Types for HomeMatch AI System
// ============================================

// Message types for conversation
export type MessageRole = 'user' | 'agent' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

// User Profile extracted from conversation
export interface UserProfile {
  name: string;
  contact: string;
  budget: {
    min: number;
    max: number;
  };
  preferredAreas: string[];
  bedrooms: number;
  moveInDate: string;
  specialRequirements: string[];
  transportationNeeds: string[];
}

// Document verification info
export interface PassportInfo {
  fullName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  expiryDate: string;
  confidence: number;
  verified: boolean;
}

// Property/Rental listing
export interface Property {
  id: string;
  address: string;
  suburb: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  lat: number;
  lng: number;
  features: string[];
  imageUrl: string;
  description: string;
}

// Property with scores
export interface ScoredProperty extends Property {
  matchScore: number;        // 0-100: how well it matches user needs
  mapScore: number;         // 0-100: based on nearby amenities
  parkScore: number;        // 0-100: parks nearby
  busScore: number;         // 0-100: bus stations nearby
  trainScore: number;       // 0-100: train stations nearby
  priceScore: number;        // 0-100: price reasonableness
  totalScore: number;        // 0-100: combined score
}

// Application for landlord
export interface RentalApplication {
  userProfile: UserProfile;
  passportInfo: PassportInfo;
  selectedProperty: ScoredProperty;
  additionalNotes: string;
  submittedAt: Date;
}

// Conversation state machine
export type ConversationStage = 
  | 'GREETING'
  | 'COLLECTING_BASIC_INFO'
  | 'COLLECTING_BUDGET'
  | 'COLLECTING_LOCATION'
  | 'COLLECTING_BEDROOMS'
  | 'COLLECTING_MOVE_DATE'
  | 'COLLECTING_SPECIAL'
  | 'SEARCHING_PROPERTIES'
  | 'SHOWING_RESULTS'
  | 'AWAITING_SELECTION'
  | 'AWAITING_PASSPORT'
  | 'GENERATING_APPLICATION'
  | 'COMPLETE';

// System state
export interface SystemState {
  conversationStage: ConversationStage;
  userProfile: Partial<UserProfile>;
  passportInfo: Partial<PassportInfo>;
  messages: Message[];
  availableProperties: Property[];
  matchedProperties: ScoredProperty[];
  selectedProperty: ScoredProperty | null;
  isProcessing: boolean;
}

// Map POI types
export interface POI {
  name: string;
  type: 'park' | 'bus_stop' | 'train_station';
  lat: number;
  lng: number;
  distance: number;
}

// API Response types
export interface GeminiResponse {
  text: string;
  candidates?: any[];
}

// Application form for display
export interface ApplicationForm {
  personalInfo: {
    fullName: string;
    passportNumber: string;
    nationality: string;
    dateOfBirth: string;
    contactEmail: string;
  };
  rentalDetails: {
    selectedProperty: string;
    propertyAddress: string;
    weeklyRent: number;
    preferredMoveInDate: string;
  };
  scores: {
    matchScore: number;
    mapScore: number;
    totalScore: number;
  };
}
