import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Lightbulb, Clock, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIAssistantProps {
  userProfile: any;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ userProfile }) => {
  const { toast } = useToast();

  const suggestions = [
    {
      title: "Recipe Substitutions",
      description: "Find alternatives for ingredients you don't have",
      icon: <Lightbulb className="h-5 w-5" />,
      action: () => toast({ title: "Recipe suggestions coming soon!" })
    },
    {
      title: "Meal Prep Tips",
      description: "Get advice on batch cooking and meal prep",
      icon: <Clock className="h-5 w-5" />,
      action: () => toast({ title: "Meal prep tips coming soon!" })
    },
    {
      title: "Budget Optimization",
      description: "Ways to reduce your weekly grocery bill",
      icon: <ShoppingCart className="h-5 w-5" />,
      action: () => toast({ title: "Budget optimization coming soon!" })
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          <CardDescription>
            Get personalized help with your meal planning and shopping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">👋 Hi there!</p>
            <p>I'm your AI meal planning assistant. I can help you with recipe suggestions, 
            substitutions, meal prep tips, and budget optimization.</p>
          </div>

          <div className="grid gap-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={suggestion.action}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-primary">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Badge variant="secondary" className="w-fit">
            🚧 Coming Soon - Full AI Chat Interface
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};