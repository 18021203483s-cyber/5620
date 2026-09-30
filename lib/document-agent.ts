// ============================================
// Document Recognition Agent (护照识别Agent)
// Uses Vision LLM to extract information from passport images
// ============================================

import { PassportInfo } from './types';

// Check if API key is configured
function isApiKeyConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  return !!apiKey && apiKey.length > 10;
}

// Extract passport information using Google Gemini Vision API
export async function extractPassportInfo(imageBase64: string): Promise<PassportInfo> {
  // Check if we should use real API
  if (isApiKeyConfigured()) {
    return await extractPassportInfoWithGemini(imageBase64, process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
  }
  
  // Fallback to mock data (for demo when no API key)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    fullName: 'John Smith',
    passportNumber: 'PA1234567',
    nationality: 'Australian',
    dateOfBirth: '1990-05-15',
    expiryDate: '2030-05-15',
    confidence: 0.95,
    verified: true
  };
}

// Real implementation using Google Gemini with passport validation
export async function extractPassportInfoWithGemini(
  imageBase64: string, 
  apiKey: string
): Promise<PassportInfo> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `You are an expert document recognition system. Analyze this image carefully.

First, determine if this is a PASSPORT (a government-issued travel document with a burgundy/red cover or bio-data page showing machine-readable zone at the bottom).

CRITICAL: If this is NOT a passport, respond with:
{"isPassport": false, "error": "This appears to be [describe what you see]. Please upload a passport image."}

If it IS a passport, extract the following information from the bio-data page:
- Full Name (as shown on the passport)
- Passport Number (alphanumeric code)
- Nationality (country name)
- Date of Birth (in YYYY-MM-DD format)
- Expiry Date (in YYYY-MM-DD format)

Respond ONLY with a valid JSON object in this exact format:
{
  "isPassport": true,
  "fullName": "value",
  "passportNumber": "value",
  "nationality": "value",
  "dateOfBirth": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD",
  "confidence": 0.0-1.0,
  "verified": true/false
}

If you cannot read certain fields, set confidence lower.`;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg'
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      
      // Check if it's actually a passport
      if (data.isPassport === false) {
        throw new Error(data.error || 'This does not appear to be a passport. Please upload a passport image.');
      }
      
      return {
        fullName: data.fullName || '',
        passportNumber: data.passportNumber || '',
        nationality: data.nationality || '',
        dateOfBirth: data.dateOfBirth || '',
        expiryDate: data.expiryDate || '',
        confidence: data.confidence || 0,
        verified: data.verified || false
      };
    }

    throw new Error('Failed to parse document information. Please ensure you uploaded a clear passport image.');
  } catch (error: any) {
    console.error('Passport extraction error:', error);
    
    // Re-throw specific errors for better user feedback
    if (error.message.includes('passport') || error.message.includes('PASSPORT') || error.message.includes('does not appear')) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to process passport image. Please try again with a clearer photo of your passport.');
  }
}

// Validate passport information
export function validatePassportInfo(info: PassportInfo): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!info.fullName || info.fullName.length < 2) {
    errors.push('Invalid or missing full name');
  }

  if (!info.passportNumber || info.passportNumber.length < 6) {
    errors.push('Invalid passport number');
  }

  if (!info.nationality) {
    errors.push('Missing nationality');
  }

  // Check if passport is expired
  if (info.expiryDate) {
    const expiryDate = new Date(info.expiryDate);
    const today = new Date();
    if (expiryDate < today) {
      errors.push('Passport has expired');
    }
  }

  // Check confidence level
  if (info.confidence < 0.7) {
    errors.push('Low confidence in extracted data - please verify manually');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Generate passport info summary for display
export function formatPassportSummary(info: PassportInfo): string {
  return `
📄 Passport Information:
━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${info.fullName}
🔢 Passport No: ${info.passportNumber}
🌍 Nationality: ${info.nationality}
📅 Date of Birth: ${info.dateOfBirth}
⏰ Expiry: ${info.expiryDate}
✅ Verification: ${info.verified ? 'Verified' : 'Pending Review'}
📊 Confidence: ${Math.round(info.confidence * 100)}%
`;
}
