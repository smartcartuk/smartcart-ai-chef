import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeeklyPlan } from '@/components/WeeklyPlan';
import { ShoppingList } from '@/components/ShoppingList';
import { EnhancedPriceComparison } from '@/components/EnhancedPriceComparison';
import { PriceAnalyticsDashboard } from '@/components/PriceAnalyticsDashboard';
import { SmartNotifications } from '@/components/SmartNotifications';
import { PerformanceOptimizer } from '@/components/PerformanceOptimizer';
import { SupermarketCredentialsModal } from '@/components/SupermarketCredentialsModal';
import { ShoppingBasketExporter } from '@/components/ShoppingBasketExporter';
import { AIShoppingAgent } from '@/components/AIShoppingAgent';
import { AIAssistant } from '@/components/AIAssistant';
import { WeeklyPlanTester } from '@/components/WeeklyPlanTester';
import { MealPlanConfirmationModal } from '@/components/MealPlanConfirmationModal';
import { CheckoutSummary } from '@/components/CheckoutSummary';
import { RecipeFavorites } from '@/components/RecipeFavorites';
import { MealSelectionStep } from '@/components/MealSelectionStep';
import { ShoppingListReview } from '@/components/ShoppingListReview';
import { WebhookResponse } from '@/utils/webhookService';
import { useToast } from '@/hooks/use-toast';
import { getConnectedStores } from '@/utils/profileService';
import { ensureSuggesticAuth } from '@/utils/suggesticAuthService';
import { supabase } from '@/integrations/supabase/client';
interface MealPlanDashboardProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
}
export const MealPlanDashboard: React.FC<MealPlanDashboardProps> = ({
  userProfile,
  generatedData
}) => {
  const [activeTab, setActiveTab] = useState('select');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [totalWeeklyCosts, setTotalWeeklyCosts] = useState<any>(null);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [basketUrls, setBasketUrls] = useState<{
    [store: string]: string;
  }>({});
  const [userCredentials, setUserCredentials] = useState({});
  const [connectedStores, setConnectedStores] = useState<any[]>([]);
  const [isTestingSuggestic, setIsTestingSuggestic] = useState(false);
  const [suggesticShoppingList, setSuggesticShoppingList] = useState<any>(null);
  const {
    toast
  } = useToast();
  React.useEffect(() => {
    loadConnectedStores();
  }, []);

  const testSuggesticIntegration = async () => {
    setIsTestingSuggestic(true);
    try {
      console.log('🧪 Testing Suggestic integration...');
      
      // Step 1: Ensure authentication
      const authResult = await ensureSuggesticAuth(userProfile);
      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }
      console.log('✅ Step 1: Authentication successful');
      
      // Step 2: Fetch shopping list
      const { data, error } = await supabase.functions.invoke('suggestic-meal-planner', {
        body: {
          action: 'shopping-list'
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to fetch shopping list');
      
      console.log('✅ Step 2: Shopping list fetched:', data);
      setSuggesticShoppingList(data);
      
      toast({
        title: "Suggestic Integration Working! ✅",
        description: `Shopping list has ${data.shoppingList?.items?.length || 0} items`,
      });
    } catch (error: any) {
      console.error('❌ Suggestic integration test failed:', error);
      toast({
        title: "Integration Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTestingSuggestic(false);
    }
  };
  const loadConnectedStores = async () => {
    const result = await getConnectedStores();
    if (result.success && result.data) {
      setConnectedStores(result.data);
    }
  };
  const handleRecipesChange = (newRecipes: any[]) => {
    setRecipes(newRecipes);
  };
  const handleWeeklyCostsChange = (costs: any) => {
    setTotalWeeklyCosts(costs);
    console.log('📊 Weekly costs updated in dashboard:', costs);
  };
  const handleFinalizeAndShop = () => {
    if (recipes.length === 0) {
      toast({
        title: "No recipes selected",
        description: "Please add recipes to your meal plan first",
        variant: "destructive"
      });
      return;
    }
    setShowConfirmationModal(true);
  };
  const handleConfirmMealPlan = async () => {
    setShowConfirmationModal(false);
    toast({
      title: "Adding items to carts...",
      description: "Please wait while we populate your shopping carts"
    });

    // Simulate adding items to baskets
    const mockBasketUrls = {
      Tesco: "https://tesco.com/basket",
      "Sainsburys": "https://sainsburys.co.uk/basket",
      Asda: "https://asda.com/trolley"
    };
    setBasketUrls(mockBasketUrls);
    setShowCheckout(true);
    setActiveTab('checkout');
    toast({
      title: "Carts Ready! 🎉",
      description: "Your shopping carts have been populated"
    });
  };

  // Mock function to simulate saving user credentials
  const handleSaveCredentials = (storeName: string, credentials: any) => {
    setUserCredentials(prev => ({
      ...prev,
      [storeName]: credentials
    }));
    toast({
      title: "Credentials Saved",
      description: `Credentials for ${storeName} saved successfully`
    });
    setShowCredentialsModal(false);
  };
  const handleOpenCredentialsModal = () => {
    setShowCredentialsModal(true);
  };
  const totalCost = totalWeeklyCosts?.tesco || generatedData?.meals?.reduce((sum, meal) => sum + meal.cost, 0) || 46.95;
  const totalMeals = recipes.length || 7;
  const avgSavings = totalWeeklyCosts ? Math.max(0, totalWeeklyCosts.sainsburys - totalWeeklyCosts.aldi) : 12.50;
  return <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userProfile?.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Your AI-powered meal plan for the week
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <div className="space-y-2">
              <div className="text-2xl">💰</div>
              <div className="text-2xl font-bold text-emerald-700">£{avgSavings.toFixed(2)}</div>
              <div className="text-sm text-emerald-600">Weekly Savings</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="space-y-2">
              <div className="text-2xl">🍽️</div>
              <div className="text-2xl font-bold text-blue-700">{totalMeals}</div>
              <div className="text-sm text-blue-600">Meals Planned</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 cursor-pointer hover:from-purple-100 hover:to-purple-200 transition-all duration-200 hover:shadow-md" onClick={() => setShowCredentialsModal(true)}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-2xl">📱</div>
                <div className="text-xs text-purple-500 font-medium">Click to manage</div>
              </div>
              <div className="text-2xl font-bold text-purple-700">{connectedStores.length}</div>
              <div className="text-sm text-purple-600">Stores Connected</div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <Button 
              onClick={testSuggesticIntegration} 
              disabled={isTestingSuggestic}
              className="w-full"
              variant="outline"
            >
              {isTestingSuggestic ? '🔄 Testing...' : '🧪 Test Suggestic'}
            </Button>
            {suggesticShoppingList && (
              <div className="text-xs text-orange-600 mt-2">
                {suggesticShoppingList.shoppingList?.items?.length || 0} items
              </div>
            )}
          </Card>
          
          
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="select">Select Meals</TabsTrigger>
            <TabsTrigger value="review">Review List</TabsTrigger>
            <TabsTrigger value="plan">Meal Plan</TabsTrigger>
            <TabsTrigger value="shopping">Shopping</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
          </TabsList>

          <TabsContent value="select">
            <MealSelectionStep userProfile={userProfile} onComplete={() => setActiveTab('review')} />
          </TabsContent>

          <TabsContent value="review">
            <ShoppingListReview userProfile={userProfile} onComparePrices={() => setActiveTab('shopping')} />
          </TabsContent>

          <TabsContent value="plan">
            <WeeklyPlan userProfile={userProfile} generatedData={generatedData} onRecipesChange={handleRecipesChange} onWeeklyCostsChange={handleWeeklyCostsChange} />
          </TabsContent>

          <TabsContent value="shopping">
            <ShoppingList userProfile={userProfile} recipes={recipes} totalWeeklyCosts={totalWeeklyCosts} />
          </TabsContent>

          <TabsContent value="favorites">
            <RecipeFavorites />
          </TabsContent>

          <TabsContent value="checkout">
            {showCheckout ? <CheckoutSummary basketUrls={basketUrls} totalCosts={totalWeeklyCosts || {}} onMarkAsOrdered={() => {
            toast({
              title: "Order marked complete! 🎉"
            });
            setShowCheckout(false);
          }} /> : <Card className="p-8 text-center">
                <p className="text-muted-foreground">Complete meal plan confirmation to see checkout</p>
              </Card>}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <MealPlanConfirmationModal isOpen={showConfirmationModal} onClose={() => setShowConfirmationModal(false)} onConfirm={handleConfirmMealPlan} recipes={recipes} connectedStores={connectedStores} />

        <SupermarketCredentialsModal isOpen={showCredentialsModal} onClose={() => setShowCredentialsModal(false)} onSave={credentials => {
        setUserCredentials(credentials);
        loadConnectedStores();
      }} />
      </div>
    </div>;
};