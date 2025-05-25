
export interface WebhookUserProfile {
  name: string;
  email: string;
  address: {
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
  dietaryPreferences: string[];
  allergies: string[];
  householdSize: number;
  weeklyBudget: number;
  connectedStores: Array<{
    name: string;
    credentials: {
      username: string;
      password: string;
      loyaltyCard: string;
    };
  }>;
}

export interface WebhookResponse {
  meals: Array<{
    id: number;
    day: string;
    name: string;
    image: string;
    cookTime: string;
    difficulty: string;
    calories: number;
    cost: number;
    tags: string[];
    description: string;
  }>;
  priceComparisons: Array<{
    item: string;
    prices: Array<{
      store: string;
      price: number;
      discount: string | null;
      savings: number;
      clubcard: boolean;
    }>;
  }>;
  shoppingList: Array<{
    item: string;
    quantity: string;
    category: string;
    estimated_cost: number;
  }>;
}

const WEBHOOK_URL = 'https://proj3cts.app.n8n.cloud/webhook-test/generate-meal-plan';

export const sendUserPreferences = async (profile: WebhookUserProfile): Promise<WebhookResponse> => {
  console.log('Sending user preferences to n8n webhook:', WEBHOOK_URL);
  console.log('Profile data:', {
    householdSize: profile.householdSize,
    weeklyBudget: profile.weeklyBudget,
    dietaryPreferences: profile.dietaryPreferences,
    allergies: profile.allergies,
    connectedStores: profile.connectedStores.map(store => store.name)
  });
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: `user_${Date.now()}`, // Generate a unique user ID
        userProfile: {
          ...profile,
          household_size: profile.householdSize,
          weekly_budget: profile.weeklyBudget,
          dietary_preferences: profile.dietaryPreferences,
          allergies: profile.allergies,
          connected_stores: profile.connectedStores.map(store => ({
            name: store.name,
            has_loyalty_card: Boolean(store.credentials.loyaltyCard)
          }))
        },
        timestamp: new Date().toISOString(),
        source: 'smartcart_onboarding'
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('n8n webhook response received:', data);
    
    return data;
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    throw error;
  }
};
