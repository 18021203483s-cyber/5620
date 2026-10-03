'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/types';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import PropertyCard from './PropertyCard';
import PassportUpload from './PassportUpload';
import ApplicationForm from './ApplicationForm';
import MapView from './MapView';
import { processUserMessageWithLLM } from '@/lib/conversation-agent';
import { matchProperties } from '@/lib/matching-agent';
import { calculateMapScoresForProperties } from '@/lib/map-agent';
import { ScoredProperty, UserProfile, PassportInfo, ConversationStage, SystemState } from '@/lib/types';

interface ChatInterfaceProps {
  initialMessages?: Message[];
}

export default function ChatInterface({ initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [matchedProperties, setMatchedProperties] = useState<ScoredProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<ScoredProperty | null>(null);
  const [showPassportUpload, setShowPassportUpload] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const [passportInfo, setPassportInfo] = useState<PassportInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPropertyForMap, setSelectedPropertyForMap] = useState<ScoredProperty | null>(null);
  const [showDebug, setShowDebug] = useState(false); // Toggle debug panel
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Debug logging helper
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`🎯 [UI] ${message}`);
  };
  
  const [state, setState] = useState<SystemState>({
    conversationStage: 'GREETING',
    userProfile: {},
    passportInfo: {},
    messages: [],
    availableProperties: [],
    matchedProperties: [],
    selectedProperty: null,
    isProcessing: false
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send greeting message on mount
  useEffect(() => {
    if (messages.length === 0) {
      handleSendMessage('');
    }
  }, []);

  // Process user message
  const handleSendMessage = async (input: string) => {
    if (!input.trim() && state.conversationStage !== 'GREETING') return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Process with conversation agent (uses LLM if available)
    setIsTyping(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = await processUserMessageWithLLM(input, state.userProfile, state.conversationStage);

    // Update state
    setState(prev => ({
      ...prev,
      userProfile: result.updatedProfile as UserProfile,
      conversationStage: result.stage
    }));

    // If we should search for properties
    if (result.shouldSearch) {
      addDebugLog('🎯 Matching Agent TRIGGERED!');
      setIsSearching(true);
      
      // Add searching message
      const searchingMessage: Message = {
        id: `agent-searching-${Date.now()}`,
        role: 'agent',
        content: '🔍 Searching for properties that match your requirements...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, searchingMessage]);

      // Wait a bit for realism
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get matched properties
      addDebugLog('📊 Running matchProperties()...');
      const matched = matchProperties(result.updatedProfile);
      addDebugLog(`✅ Matched ${matched.length} properties`);
      addDebugLog('Top 3 matches:');
      matched.slice(0, 3).forEach((p, i) => {
        addDebugLog(`   ${i + 1}. ${p.suburb} - Score: ${p.matchScore}% (Area:${p.areaScore || 'calc'} Price:${p.priceScore} Bed:${p.bedrooms})`);
      });
      
      // Calculate map scores
      addDebugLog('🗺️ Calling Map Agent...');
      const scoredProperties = await calculateMapScoresForProperties(matched);
      addDebugLog('✅ Map Agent complete!');
      addDebugLog('');
      addDebugLog('📊 Final Results:');
      scoredProperties.slice(0, 5).forEach((p, i) => {
        addDebugLog(`   ${i + 1}. ${p.suburb} - ${p.address}`);
        addDebugLog(`      TOTAL: ${p.totalScore}%`);
        addDebugLog(`      Match: ${p.matchScore} | Map: ${p.mapScore} (Train:${p.trainScore} Bus:${p.busScore}) | Price: ${p.priceScore}`);
        if (p.llmAnalysis) {
          addDebugLog(`      🧠 LLM: "${p.llmAnalysis.locationDescription}"`);
        }
      });
      
      setMatchedProperties(scoredProperties);
      setIsSearching(false);
    }

    // Add agent response
    const agentMessage: Message = {
      id: `agent-${Date.now()}`,
      role: 'agent',
      content: result.reply,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
    setIsTyping(false);
  };

  // Handle property selection — show location info, do NOT jump to application
  const handlePropertySelect = (property: ScoredProperty) => {
    setSelectedProperty(property);
    setSelectedPropertyForMap(property);
    
    const selectMessage: Message = {
      id: `user-select-${Date.now()}`,
      role: 'user',
      content: `I'm interested in ${property.address}, ${property.suburb}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, selectMessage]);

    // Show property details in sidebar + map, but DON'T jump to passport
    setShowPassportUpload(false);
    
    const agentMessage: Message = {
      id: `agent-${Date.now()}`,
      role: 'agent',
      content: `Great choice! ${property.address} in ${property.suburb} — ${property.bedrooms} bed at $${property.price}/week.

${property.description}

Type "apply" to start your rental application, or ask me anything about this property!`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
  };

  // Handle "apply" keyword in chat to start the application flow
  const handleApplyKeyword = () => {
    if (!selectedProperty) return;
    
    setShowPassportUpload(true);
    const agentMessage: Message = {
      id: `agent-${Date.now()}`,
      role: 'agent',
      content: `To submit your application for ${selectedProperty.address}, I'll need to verify your identity.

📄 Please upload a photo of your passport to continue.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
  };

  // Check for "apply" keyword in user messages
  useEffect(() => {
    const lastUserMsg = messages.filter(m => m.role === 'user').at(-1);
    if (
      lastUserMsg &&
      lastUserMsg.content.toLowerCase().trim() === 'apply' &&
      selectedProperty &&
      !showPassportUpload &&
      !showApplication
    ) {
      handleApplyKeyword();
    }
  }, [messages]);

  // Handle passport upload
  const handlePassportUpload = (info: PassportInfo) => {
    setPassportInfo(info);
    setShowPassportUpload(false);
    setShowApplication(true);

    const agentMessage: Message = {
      id: `agent-${Date.now()}`,
      role: 'agent',
      content: `✅ Passport verified!

Thank you, ${info.fullName}. Your identity has been confirmed.

Now let me generate your rental application...`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
  };

  // Handle skip passport
  const handleSkipPassport = () => {
    setShowPassportUpload(false);
    setShowApplication(true);

    const agentMessage: Message = {
      id: `agent-${Date.now()}`,
      role: 'agent',
      content: `No problem! You can upload your passport later.

Let me prepare your rental application now...`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
  };

  // Handle application submission
  const handleSubmitApplication = () => {
    setShowApplication(false);
    
    const agentMessage: Message = {
      id: `agent-${Date.now()}`,
      role: 'agent',
      content: `🎉 Congratulations! Your rental application has been submitted successfully!

Your application for ${selectedProperty?.address}, ${selectedProperty?.suburb} has been sent to the landlord.

The landlord will review your application and contact you at ${state.userProfile.contact || 'your provided email'} soon.

Is there anything else I can help you with?`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, agentMessage]);
  };

  // Get current stage for UI rendering
  const showProperties = state.conversationStage === 'SHOWING_RESULTS' || 
                         state.conversationStage === 'AWAITING_SELECTION' ||
                         matchedProperties.length > 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">HomeMatch AI</h1>
              <p className="text-sm text-gray-500">Your Smart Rental Assistant</p>
            </div>
          </div>
          {state.userProfile.name && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Welcome, {state.userProfile.name}</p>
              <p className="text-xs text-gray-500">
                {matchedProperties.length > 0 
                  ? `${matchedProperties.length} properties found` 
                  : 'Tell me about your ideal home'}
              </p>
            </div>
          )}
          {/* Debug Toggle Button */}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showDebug 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {showDebug ? '🐛 Debug: ON' : '🐛 Debug: OFF'}
          </button>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-gray-900 text-green-400 p-4 text-xs font-mono border-b border-gray-700">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-300 font-bold">🔧 Agent Debug Console</span>
              <button 
                onClick={() => setDebugLogs([])}
                className="text-gray-500 hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            <div className="bg-gray-800 rounded p-2 h-32 overflow-y-auto space-y-1">
              {debugLogs.length === 0 ? (
                <span className="text-gray-500">No logs yet. Complete the conversation to see Matching Agent logs...</span>
              ) : (
                debugLogs.map((log, i) => (
                  <div key={i} className="break-all">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            
            {/* Property Cards */}
            {showProperties && matchedProperties.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  🏠 Matching Properties ({matchedProperties.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onSelect={() => handlePropertySelect(property)}
                      isSelected={selectedProperty?.id === property.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="chat-bubble-agent">
                <div className="typing-indicator flex gap-1">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Passport Upload Modal */}
          {showPassportUpload && selectedProperty && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <PassportUpload
                  onUpload={handlePassportUpload}
                  onSkip={handleSkipPassport}
                  propertyAddress={`${selectedProperty.address}, ${selectedProperty.suburb}`}
                />
              </div>
            </div>
          )}

          {/* Application Form Modal */}
          {showApplication && selectedProperty && passportInfo && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <ApplicationForm
                  userProfile={state.userProfile}
                  passportInfo={passportInfo}
                  property={selectedProperty}
                  onSubmit={handleSubmitApplication}
                />
              </div>
            </div>
          )}

          {/* Input */}
          <ChatInput 
            onSend={handleSendMessage}
            disabled={isTyping || showPassportUpload || showApplication}
            placeholder={
              state.conversationStage === 'GREETING' 
                ? 'Type a message to start...' 
                : 'Type your response...'
            }
          />
        </div>

        {/* Map Sidebar */}
        <div className="w-96 bg-gray-100 p-4 hidden lg:block">
          <h3 className="font-semibold text-gray-700 mb-4">
            {selectedPropertyForMap ? '📍 Property Location' : '🗺️ Sydney Rental Map'}
          </h3>
          <div className="h-64 rounded-xl overflow-hidden shadow-lg">
            <MapView 
              properties={selectedPropertyForMap ? [selectedPropertyForMap] : matchedProperties}
              selectedProperty={selectedPropertyForMap}
              onPropertySelect={handlePropertySelect}
            />
          </div>
          
          {selectedPropertyForMap && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">🏠 Selected Property</h4>
              <div className="bg-white rounded-lg p-3 shadow">
                <p className="font-medium text-gray-900">{selectedPropertyForMap.address}</p>
                <p className="text-sm text-gray-500">{selectedPropertyForMap.suburb}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-blue-600 font-medium">${selectedPropertyForMap.price}/week</span>
                  <span className="text-gray-500">{selectedPropertyForMap.bedrooms} bed</span>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Score: {selectedPropertyForMap.totalScore}%
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    🚆 {selectedPropertyForMap.trainScore}%
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    🚌 {selectedPropertyForMap.busScore}%
                  </span>
                </div>
                {/* Apply Now button - only show when not already applying */}
                {!showPassportUpload && !showApplication && (
                  <button
                    onClick={() => handleApplyKeyword()}
                    className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    📝 Apply Now
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
