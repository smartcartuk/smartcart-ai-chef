
interface ShoppingItem {
  name: string;
  quantity: string;
}

interface BasketCredentials {
  username: string;
  password: string;
}

interface AddToBasketRequest {
  supermarket: string;
  credentials: BasketCredentials;
  items: ShoppingItem[];
}

interface AddToBasketResponse {
  success: boolean;
  basketUrl?: string;
  message?: string;
  error?: string;
}

const BASKET_API_URL = 'https://smartcart-operator.vercel.app/api/add-to-basket';

export const addItemsToBasket = async (
  supermarket: string,
  credentials: BasketCredentials,
  items: ShoppingItem[]
): Promise<AddToBasketResponse> => {
  console.log('Adding items to basket:', { supermarket, itemCount: items.length });
  
  try {
    const requestBody: AddToBasketRequest = {
      supermarket: supermarket.toLowerCase(),
      credentials,
      items
    };

    const response = await fetch(BASKET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Basket API response:', data);
    
    return {
      success: true,
      basketUrl: data.basketUrl,
      message: data.message
    };
  } catch (error) {
    console.error('Error adding items to basket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add items to basket'
    };
  }
};

export const formatItemsForBasket = (shoppingItems: {[key: string]: any[]}): ShoppingItem[] => {
  const items: ShoppingItem[] = [];
  
  Object.values(shoppingItems).forEach(categoryItems => {
    categoryItems.forEach(item => {
      items.push({
        name: item.name,
        quantity: item.amount || '1'
      });
    });
  });
  
  return items;
};
