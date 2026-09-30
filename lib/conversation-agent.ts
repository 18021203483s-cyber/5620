// ============================================
// Information Collection Agent (采集Agent)
// Uses LLM for intelligent multi-turn conversation
// ============================================

import { UserProfile, ConversationStage } from './types';

// Check if API key is configured
function isApiKeyConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  console.log('[DEBUG] API Key present:', !!apiKey, apiKey?.substring(0, 10) + '...');
  return !!apiKey && apiKey.length > 10;
}

export interface ConversationResult {
  updatedProfile: Partial<UserProfile>;
  reply: string;
  stage: ConversationStage;
  shouldSearch: boolean;
}

// Process with LLM - this is the main entry point
export async function processUserMessageWithLLM(
  message: string,
  currentProfile: Partial<UserProfile>,
  currentStage: ConversationStage
): Promise<ConversationResult> {
  console.log('[DEBUG] processUserMessageWithLLM called, stage:', currentStage);
  
  // ALWAYS try LLM first if API key is available
  if (isApiKeyConfigured()) {
    try {
      console.log('[DEBUG] Calling Gemini...');
      const result = await processWithGemini(message, currentProfile, currentStage);
      console.log('[DEBUG] Gemini success:', result.stage);
      return result;
    } catch (error: any) {
      console.error('[DEBUG] Gemini error:', error?.message || error);
      // Fall back to simple rules - they're actually pretty good now!
      console.log('[DEBUG] Falling back to rules-based processing');
      return processWithSimpleRules(message, currentProfile, currentStage);
    }
  }
  
  console.log('[DEBUG] No API key, using simple rules');
  return processWithSimpleRules(message, currentProfile, currentStage);
}

// Use Gemini to understand user input and extract information
async function processWithGemini(
  message: string,
  currentProfile: Partial<UserProfile>,
  currentStage: ConversationStage
): Promise<ConversationResult> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
  
  console.log('[DEBUG] Creating Gemini instance with key:', apiKey.substring(0, 10) + '...');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try different model names (API key might have different model access)
  let model: any;
  const modelNames = [
    'gemini-1.5-pro',
    'gemini-1.5-pro-preview-0514', 
    'gemini-1.5-pro-preview-0324',
    'gemini-1.0-pro',
    'gemini-pro',
  ];
  
  for (const modelName of modelNames) {
    try {
      console.log('[DEBUG] Trying model:', modelName);
      model = genAI.getGenerativeModel({ model: modelName });
      console.log('[DEBUG] Successfully using model:', modelName);
      break;
    } catch (e: any) {
      console.log('[DEBUG] Model', modelName, 'failed:', e?.message?.substring(0, 100));
    }
  }
  
  if (!model) {
    throw new Error('No available Gemini model found. Using rules instead.');
  }

  // Build conversation history from profile
  const history = buildConversationHistory(currentProfile);
  
  const prompt = `You are HomeMatch AI, a friendly rental assistant helping users find properties in Sydney, Australia.

CONVERSATION CONTEXT (what we've already collected):
${history}

CURRENT STAGE: ${currentStage}
USER'S MESSAGE: "${message}"

YOUR TASK:
1. Intelligently understand what information the user is providing
2. Look for typos/spelling errors and infer the correct meaning
3. Extract ALL useful information from their message
4. Ask for the next piece of information in a natural, friendly way

SUBURB RECOGNITION - Common typos and variations:
- "chatwood", "chats" = "Chatswood" (north shore)
- "nwetown", "newtow" = "Newtown" (inner west)
- "surry" = "Surry Hills" (east)
- "paddo" = "Paddington" (east)

BUDGET RECOGNITION:
- "100-200" or "$100-200" = Budget $100-200 per week
- "around 500", "500 pw" = Budget ~$500 per week
- "400 to 600", "450" = Budget range around that amount

Respond ONLY with valid JSON:
{
  "updatedProfile": {
    "name": "extracted name or null",
    "contact": "extracted contact or null", 
    "budget": {"min": number, "max": number} or null,
    "preferredAreas": ["array of Sydney suburb names"] or null,
    "bedrooms": number or null,
    "moveInDate": "string or null",
    "specialRequirements": ["array"] or null
  },
  "reply": "Your friendly 1-2 sentence response",
  "nextStage": "COLLECTING_BUDGET" or "COLLECTING_LOCATION" or "COLLECTING_BEDROOMS" or "COLLECTING_MOVE_DATE" or "COLLECTING_SPECIAL" or "SEARCHING_PROPERTIES",
  "shouldSearch": boolean
}`;

  console.log('[DEBUG] Generating content...');
  const result = await model.generateContent(prompt);
  console.log('[DEBUG] Content generated');
  
  const response = await result.response;
  const text = response.text();
  console.log('[DEBUG] LLM Response:', text.substring(0, 200));
  
  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response: ' + text.substring(0, 100));
  }
  
  const data = JSON.parse(jsonMatch[0]);
  
  // Merge with existing profile
  const updatedProfile: Partial<UserProfile> = { ...currentProfile };
  
  if (data.updatedProfile) {
    if (data.updatedProfile.name) updatedProfile.name = data.updatedProfile.name;
    if (data.updatedProfile.contact) updatedProfile.contact = data.updatedProfile.contact;
    if (data.updatedProfile.budget) updatedProfile.budget = data.updatedProfile.budget;
    if (data.updatedProfile.preferredAreas) updatedProfile.preferredAreas = data.updatedProfile.preferredAreas;
    if (data.updatedProfile.bedrooms !== null && data.updatedProfile.bedrooms !== undefined) {
      updatedProfile.bedrooms = data.updatedProfile.bedrooms;
    }
    if (data.updatedProfile.moveInDate) updatedProfile.moveInDate = data.updatedProfile.moveInDate;
    if (data.updatedProfile.specialRequirements) {
      updatedProfile.specialRequirements = data.updatedProfile.specialRequirements;
    }
  }
  
  return {
    updatedProfile,
    reply: data.reply || 'Got it!',
    stage: data.nextStage || currentStage,
    shouldSearch: data.shouldSearch || false
  };
}

// Build conversation history from collected profile
function buildConversationHistory(profile: Partial<UserProfile>): string {
  const lines: string[] = [];
  
  if (profile.name) lines.push(`- User name: ${profile.name}`);
  if (profile.contact) lines.push(`- Contact: ${profile.contact}`);
  if (profile.budget) {
    lines.push(`- Budget: $${Math.round(profile.budget.min)}-${Math.round(profile.budget.max)}/week`);
  }
  if (profile.preferredAreas?.length) {
    lines.push(`- Preferred areas: ${profile.preferredAreas.join(', ')}`);
  }
  if (profile.bedrooms !== undefined) {
    lines.push(`- Bedrooms needed: ${profile.bedrooms === 0 ? 'Studio' : profile.bedrooms}`);
  }
  if (profile.moveInDate) lines.push(`- Move-in date: ${profile.moveInDate}`);
  if (profile.specialRequirements?.length) {
    lines.push(`- Special requirements: ${profile.specialRequirements.join(', ')}`);
  }
  
  if (lines.length === 0) {
    return 'Nothing collected yet - starting fresh';
  }
  
  return lines.join('\n');
}

// Smart fallback
function processWithSimpleRules(
  message: string,
  currentProfile: Partial<UserProfile>,
  currentStage: ConversationStage
): ConversationResult {
  const updatedProfile = { ...currentProfile };
  let reply = '';
  let nextStage = currentStage;
  let shouldSearch = false;

  // Suburb recognition with comprehensive typo handling
  const suburbMap: { [key: string]: string } = {
    // Chatswood variations
    'chatwood': 'Chatswood', 'chats': 'Chatswood', 'chatswood': 'Chatswood', 
    'chatwood': 'Chatswood', 'catswood': 'Chatswood', 'chatswood': 'Chatswood',
    // Newtown variations
    'newtown': 'Newtown', 'nwetown': 'Newtown', 'newtow': 'Newtown', 
    'newtow n': 'Newtown', 'new town': 'Newtown', 'nwetown': 'Newtown',
    // Surry Hills
    'surry': 'Surry Hills', 'surry hills': 'Surry Hills', 'surrey': 'Surry Hills',
    'surrey hills': 'Surry Hills',
    // Paddington
    'paddington': 'Paddington', 'paddo': 'Paddington',
    // CBD
    'sydney': 'Sydney CBD', 'city': 'Sydney CBD', 'sydney cbd': 'Sydney CBD',
    'town hall': 'Sydney CBD', 'central': 'Sydney CBD',
    // Others
    'redfern': 'Redfern', 'ultimo': 'Ultimo', 'pyrmont': 'Pyrmont',
    'glebe': 'Glebe', 'zetland': 'Zetland', 'waterloo': 'Waterloo',
    'bondi': 'Bondi Junction', 'bondi junction': 'Bondi Junction',
    'manly': 'Manly', 'parramatta': 'Parramatta',
    'coogee': 'Coogee', 'marrickville': 'Marrickville', 'ashfield': 'Ashfield',
    'strathfield': 'Strathfield', 'chippendale': 'Chippendale',
    'darlinghurst': 'Darlinghurst', 'haymarket': 'Haymarket',
    'potts point': 'Potts Point', 'potts': 'Potts Point',
    'mascot': 'Mascot', 'rosebery': 'Rosebery',
  };

  const extractBudget = (msg: string) => {
    const rangeMatch = msg.match(/(\d+)\s*[-–to]+\s*(\d+)/);
    if (rangeMatch) return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
    const numMatch = msg.match(/\b(\d{3,4})\b/);
    if (numMatch) { const val = parseInt(numMatch[1]); if (val >= 100 && val <= 2000) return { min: val * 0.85, max: val * 1.15 }; }
    return null;
  };

  const extractAreas = (msg: string): string[] => {
    const lower = msg.toLowerCase();
    const found: string[] = [];
    
    // Sort by length descending to match longer names first
    const sortedEntries = Object.entries(suburbMap).sort((a, b) => b[0].length - a[0].length);
    
    for (const [key, value] of sortedEntries) {
      if (lower.includes(key) || fuzzyMatch(lower, key)) {
        if (!found.includes(value)) {
          found.push(value);
        }
      }
    }
    
    return found;
  };
  
  // Simple fuzzy matching for typos
  function fuzzyMatch(text: string, pattern: string): boolean {
    if (text.includes(pattern)) return true;
    // Allow 1 character difference for short words
    if (pattern.length <= 6 && LevenshteinDistance(text, pattern) <= 1) return true;
    return false;
  }
  
  function LevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  const extractBedrooms = (msg: string): number | null => {
    const lower = msg.toLowerCase().trim();
    
    // Handle single number (0, 1, 2, 3) - most common case!
    const singleNum = lower.match(/^(\d+)$/);
    if (singleNum) {
      const num = parseInt(singleNum[1]);
      if (num >= 0 && num <= 5) return num;
    }
    
    // Handle "one", "two", etc.
    const wordMap: { [key: string]: number } = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'a': 1, 'studio': 0
    };
    for (const [word, num] of Object.entries(wordMap)) {
      if (lower === word || lower.includes(word + ' ') || lower.includes(' ' + word)) {
        return num;
      }
    }
    
    // Handle "1 bed", "2 bedrooms", "3br", "1br", etc.
    const numMatch = lower.match(/(\d+)\s*(?:bed|bedroom|br|bdr)?/);
    if (numMatch) return parseInt(numMatch[1]);
    
    return null;
  };

  switch (currentStage) {
    case 'GREETING':
      reply = `Hello! 👋 Welcome to HomeMatch AI! I'm your rental assistant.
I can understand typos and abbreviations - like "chatwood" → Chatswood or "nwetown" → Newtown. 🏠
What is your name? (Optional)`;
      nextStage = 'COLLECTING_BASIC_INFO';
      break;
    case 'COLLECTING_BASIC_INFO':
      const nameMatch = message.match(/(?:my name is|i[' ]?m|i am)\s+([a-zA-Z\s]+)/i);
      if (nameMatch) { updatedProfile.name = nameMatch[1].trim(); reply = `Nice to meet you, ${updatedProfile.name}! `; }
      else reply = 'Great! ';
      reply += 'What is your budget range for weekly rent? (e.g., $400-600, 450, 100-200)';
      nextStage = 'COLLECTING_BUDGET';
      break;
    case 'COLLECTING_BUDGET':
      const budget = extractBudget(message);
      if (budget) { updatedProfile.budget = budget; reply = `Perfect! Looking for around $${Math.round(budget.min)}-${Math.round(budget.max)} per week. `; }
      else reply = 'No problem, we can skip the budget for now. ';
      reply += 'Which area(s) would you like to live in? (e.g., Sydney CBD, Surry Hills, Newtown, Chatswood)';
      nextStage = 'COLLECTING_LOCATION';
      break;
    case 'COLLECTING_LOCATION':
      const areas = extractAreas(message);
      if (areas.length > 0) { updatedProfile.preferredAreas = areas; reply = `Great choices! I'll look for properties in ${areas.join(', ')}. `; }
      else { reply = "I didn't recognize that area. Could you please spell out the suburb? (e.g., Chatswood, Surry Hills)"; break; }
      reply += 'How many bedrooms do you need? (0 for studio, 1, 2, or 3+)';
      nextStage = 'COLLECTING_BEDROOMS';
      break;
    case 'COLLECTING_BEDROOMS':
      const bedrooms = extractBedrooms(message);
      console.log('[DEBUG] extractBedrooms result:', bedrooms, 'for message:', message);
      if (bedrooms !== null) {
        updatedProfile.bedrooms = bedrooms;
        reply = bedrooms === 0 
          ? 'A studio - compact but efficient! ' 
          : `Looking for ${bedrooms} bedroom${bedrooms > 1 ? 's' : ''}. `;
      } else {
        console.log('[DEBUG] Could not extract bedrooms, staying at same stage');
        reply = "I didn't catch that. How many bedrooms? (0 for studio, 1, 2, or 3+)";
        break;
      }
      reply += 'When do you plan to move in? (e.g., ASAP, next month, flexible)';
      nextStage = 'COLLECTING_MOVE_DATE';
      break;
    case 'COLLECTING_MOVE_DATE':
      const lower = message.toLowerCase();
      let moveDate = null;
      if (lower.includes('asap') || lower.includes('immediately')) moveDate = 'ASAP';
      else if (lower.match(/next month/i)) moveDate = 'Next Month';
      else { const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']; for (const m of months) { if (lower.includes(m)) { moveDate = `${m.charAt(0).toUpperCase() + m.slice(1)} 2026`; break; } } }
      if (moveDate) { updatedProfile.moveInDate = moveDate; reply = `Moving in ${moveDate}. `; }
      else reply = "We'll keep flexibility on move-in date. ";
      reply += 'Do you have any special requirements? (e.g., pet friendly, parking, near train)';
      nextStage = 'COLLECTING_SPECIAL';
      break;
    case 'COLLECTING_SPECIAL':
      const lowerMsg = message.toLowerCase();
      const special: string[] = [];
      if (lowerMsg.includes('pet') || lowerMsg.includes('dog') || lowerMsg.includes('cat')) special.push('Pet Friendly');
      if (lowerMsg.includes('parking')) special.push('Parking Required');
      if (lowerMsg.includes('train') || lowerMsg.includes('bus')) special.push('Near Transport');
      if (special.length > 0) { updatedProfile.specialRequirements = special; reply = `I'll make sure to find properties that are ${special.join(' and ')}. `; }
      else reply = 'No special requirements noted. ';
      reply += `Based on what you've told me, I'll now search for matching properties! 🏠`;
      nextStage = 'SEARCHING_PROPERTIES';
      shouldSearch = true;
      break;
    default:
      reply = 'How can I help you further?';
  }

  return { updatedProfile, reply, stage: nextStage, shouldSearch };
}

// Legacy sync function
export function processUserMessage(
  message: string,
  currentProfile: Partial<UserProfile>,
  currentStage: ConversationStage
): ConversationResult {
  return processWithSimpleRules(message, currentProfile, currentStage);
}

// Generate a summary of collected information
export function generateProfileSummary(profile: Partial<UserProfile>): string {
  const parts: string[] = [];
  if (profile.name) parts.push(`Name: ${profile.name}`);
  if (profile.contact) parts.push(`Contact: ${profile.contact}`);
  if (profile.budget) parts.push(`Budget: $${Math.round(profile.budget.min)}-${Math.round(profile.budget.max)}/week`);
  if (profile.preferredAreas?.length) parts.push(`Preferred Areas: ${profile.preferredAreas.join(', ')}`);
  if (profile.bedrooms !== undefined) parts.push(`Bedrooms: ${profile.bedrooms === 0 ? 'Studio' : profile.bedrooms}`);
  if (profile.moveInDate) parts.push(`Move-in: ${profile.moveInDate}`);
  if (profile.specialRequirements?.length) parts.push(`Special: ${profile.specialRequirements.join(', ')}`);
  return parts.length > 0 ? parts.join('\n') : 'No info yet';
}
