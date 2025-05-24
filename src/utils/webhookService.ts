
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

const WEBHOOK_URL = 'https://proj3cts.app.n8n.cloud/webhook-test/e7d77626-7f71-41da-8a12-0945a59df666';

export const sendUserPreferences = async (profile: WebhookUserProfile): Promise<WebhookResponse> => {
  console.log('Sending user preferences to webhook:', WEBHOOK_URL);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_profile: profile,
        timestamp: new Date().toISOString(),
        source: 'smartcart_onboarding'
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Webhook response received:', data);
    
    return data;
  } catch (error) {
    console.error('Error calling webhook:', error);
    throw error;
  }
};
