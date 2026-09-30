# HomeMatch AI 🏠

> An intelligent multi-agent rental assistant that helps users find and apply for properties through conversational AI.

## Overview

HomeMatch AI is a smart rental assistant built with multi-agent architecture. It simulates a conversation with a rental agent to understand your needs, matches you with suitable properties, scores them based on location amenities, and generates applications for landlords.

## Features

### 🤖 Multi-Agent System

| Agent | Description |
|-------|-------------|
| **Conversation Agent** | Collects user requirements through multi-turn dialogue |
| **Document Agent** | Extracts information from passport photos using Vision AI |
| **Matching Agent** | Matches user needs with available properties |
| **Map Agent** | Scores properties based on nearby amenities (parks, bus, train) |
| **Communication Agent** | Generates and formats rental applications |

### 🗺️ Smart Property Scoring

Properties are scored based on:
- **Match Score (40%)**: How well the property matches user requirements
- **Map Score (40%)**: Quality of location based on nearby amenities
  - Parks (20%): Green spaces within 500m
  - Bus stops (25%): Public transit within 300m
  - Train stations (35%): Railway access within 800m
- **Price Score (20%)**: Budget fit

### 💬 Conversational Interface

- Multi-turn dialogue to collect requirements
- Natural language understanding
- Real-time property recommendations
- Interactive map sidebar

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│                    (React + Tailwind)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Chat Interface                           │
│              (Multi-turn Conversation)                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐  ┌────────────────┐  ┌──────────────────┐
│  Conversation │  │    Document    │  │     Matching     │
│    Agent      │  │     Agent      │  │     Agent        │
│ (Requirement  │  │   (Vision)    │  │  (Tag Matching)  │
│  Collection)  │  │               │  │                  │
└───────────────┘  └────────────────┘  └──────────────────┘
                                              │
                                              ▼
                              ┌────────────────────────────┐
                              │        Map Agent           │
                              │  (OSM + Overpass API)      │
                              │  - Parks                   │
                              │  - Bus Stops               │
                              │  - Train Stations          │
                              └────────────────────────────┘
                                              │
                                              ▼
                              ┌────────────────────────────┐
                              │   Communication Agent       │
                              │  (Application Generation)   │
                              └────────────────────────────┘
```

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── ChatInterface.tsx   # Main chat UI
│   ├── ChatBubble.tsx      # Message bubbles
│   ├── ChatInput.tsx       # Input component
│   ├── PropertyCard.tsx    # Property display
│   ├── PassportUpload.tsx  # Document upload
│   ├── ApplicationForm.tsx # Application review
│   └── MapView.tsx         # Leaflet map
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── properties.ts       # Property data
│   ├── conversation-agent.ts # User profile collection
│   ├── document-agent.ts   # Passport extraction
│   ├── matching-agent.ts   # Property matching
│   ├── map-agent.ts        # Location scoring
│   └── communication-agent.ts # Application generation
└── package.json
```

## API Integration

### Free Services Used

| Service | Purpose | Cost |
|---------|---------|------|
| OpenStreetMap | Map tiles | Free |
| Overpass API | POI queries | Free |
| Google Gemini | LLM + Vision | Free tier available |

### Adding Your Own Data

To use the team's property data from `homepilot-ai-black.vercel.app`:

1. Create an API endpoint to fetch properties
2. Update `lib/properties.ts` to fetch from your API
3. Map the response to the `Property` interface

```typescript
// Example API integration
async function fetchProperties(): Promise<Property[]> {
  const response = await fetch('YOUR_API_ENDPOINT');
  const data = await response.json();
  return data.map(mapToPropertyInterface);
}
```

## Customization

### Adding More Agents

Create a new agent file in `lib/` and integrate it into `ChatInterface.tsx`:

```typescript
// lib/new-agent.ts
export async function newAgent(input: any): Promise<any> {
  // Agent logic here
}
```

### Extending Property Data

Update the `Property` interface in `lib/types.ts` and modify `properties.ts`:

```typescript
// lib/types.ts
interface Property {
  // ... existing fields
  newField: string;
}
```

## Troubleshooting

### Map Not Loading
- Check if Overpass API is accessible
- Consider adding a fallback for offline mode

### Passport Recognition Not Working
- Ensure you're passing a valid base64 image
- Check API key configuration

### Properties Not Showing
- Verify the data format matches the `Property` interface
- Check browser console for errors

## Team Collaboration

This project can be updated by teammates:

1. **Frontend updates**: Modify components in `/components`
2. **Agent logic**: Update files in `/lib`
3. **Data changes**: Update `properties.ts` or create new data sources
4. **Styling**: Modify `globals.css` and component classes

## License

MIT License - See LICENSE file for details

---

Built with ❤️ for ELEC5620 - Intelligent Agents Assignment
