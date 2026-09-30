'use client';

import { Message } from '@/lib/types';

interface ChatBubbleProps {
  message: Message;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isAgent = message.role === 'agent';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`${isAgent ? 'chat-bubble-agent' : 'chat-bubble-user'}`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className={`text-xs ${isAgent ? 'text-gray-400' : 'text-blue-200'} block mt-1`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
