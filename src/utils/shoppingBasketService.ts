import { supabase } from '@/integrations/supabase/client';

interface ShoppingItem {
  name: string;
  quantity: string;
}

interface MatchedProduct {
  title: string;
  price: string;
  source: string;
  url?: string;
}

interface BasketItemResponse {
  name: string;
  quantity: number;
  matched_product?: MatchedProduct;
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
  items?: BasketItemResponse[];
}

const AI_FN = 'ai-shopping-agent';

export const addItemsToBasket = async (
  supermarket: string,
  credentials: BasketCredentials,
  items: ShoppingItem[]
): Promise<AddToBasketResponse> => {
  console.log('Adding items to basket via edge function:', { supermarket, itemCount: items.length });

  try {
    const { data, error } = await supabase.functions.invoke(AI_FN, {
      body: {
        action: 'execute',
        store: supermarket,
        credentials,
        items
      }
    });

    if (error) throw error;

    return {
      success: true,
      basketUrl: data?.basketUrl,
      message: data?.message,
      items: data?.items
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
