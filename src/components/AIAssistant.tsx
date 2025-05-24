
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AIAssistantProps {
  userProfile: any;
}

const mockConversation = [
  {
    role: 'assistant',
    content: "Hello! I'm your AI meal planning assistant. I can help you modify recipes, suggest alternatives, optimize your shopping list, or answer any questions about your meal plan. What would you like to know?",
    timestamp: '10:30 AM'
  },
  {
    role: 'user', 
    content: "Can you make the Thai Green Curry recipe dairy-free? My partner is lactose intolerant.",
    timestamp: '10:32 AM'
  },
  {
    role: 'assistant',
    content: "Absolutely! I've updated your Thai Green Curry to be completely dairy-free. Here's what I changed:\n\n✅ Replaced coconut milk (already dairy-free) - no change needed\n✅ Removed any fish sauce containing dairy\n✅ Added extra vegetables to maintain creaminess\n✅ Updated shopping list automatically\n\nThe recipe will still be delicious and actually saves you £1.20! Would you like me to suggest any other dairy-free alternatives for this week?",
    timestamp: '10:33 AM'
  }
];

const quickActions = [
  { text: "Swap a meal for tonight", icon: "🔄" },
  { text: "Make everything gluten-free", icon: "🌾" },
  { text: "Find cheaper alternatives", icon: "💰" },
  { text: "Add more protein options", icon: "💪" },
  { text: "Suggest leftover recipes", icon: "♻️" },
  { text: "Plan next week", icon: "📅" }
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ userProfile }) => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState(mockConversation);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Add user message
    const newUserMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };

    setConversation(prev => [...prev, newUserMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant' as const,
        content: "I understand your request! Let me analyze your current meal plan and preferences to provide the best recommendation. This would typically integrate with OpenAI's GPT-4 to provide intelligent, personalized responses based on your dietary preferences, budget, and shopping history.",
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      };
      
      setConversation(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleQuickAction = (action: string) => {
    setMessage(action);
  };

  return (
    <div className="space-y-6">
      {/* AI Assistant Header */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Assistant</h2>
            <p className="text-gray-600">
              Powered by OpenAI • Personalized for {userProfile?.name?.split(' ')[0] || 'you'}
            </p>
          </div>
          <div className="ml-auto">
            <Badge className="bg-green-100 text-green-700 border-green-300">
              Online
            </Badge>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 justify-start text-left hover:bg-indigo-50"
              onClick={() => handleQuickAction(action.text)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm">{action.text}</span>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Chat Interface */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Chat Messages */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-line">{msg.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 ml-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex space-x-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything about your meal plan..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isTyping}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              Send
            </Button>
          </div>
        </div>
      </Card>

      {/* AI Capabilities */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="font-semibold text-lg mb-4">What I can help you with:</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Recipe modifications & substitutions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Dietary restriction adaptations</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Budget optimization suggestions</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Shopping list adjustments</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Meal planning for special occasions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-sm">Nutrition and calorie guidance</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
