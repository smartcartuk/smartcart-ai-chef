
// Helper function to generate better meal images based on recipe name
export const generateMealImage = (recipeName: string): string => {
  const recipeNameLower = recipeName.toLowerCase();
  
  // Map common recipe types to appropriate Unsplash search terms with food-specific photo IDs
  const imageMap: Record<string, string> = {
    'pasta': '1551782367-19ded58aea74',
    'salad': '1512621776402-57ad84f617e6',
    'soup': '1547592180-85f173990554',
    'pizza': '1513104890-7415063b982f',
    'stir-fry': '1512058564366-4f692b3b70e2',
    'stir fry': '1512058564366-4f692b3b70e2',
    'stirfry': '1512058564366-4f692b3b70e2',
    'quinoa': '1511690743698-d9d85f2fbeb7',
    'chickpea': '1546833999-b9fcb8a93c5e',
    'lentil': '1547592166-23ac45744acd',
    'bean': '1506368249209-abb61b0f9e5f',
    'pepper': '1518779578993-19c2c9f98429',
    'chili': '1574484595643-86a41ad44961',
    'curry': '1565299585323-38174c8c84bf',
    'rice': '1586201375761-83865001e26f',
    'noodle': '1552611052-33e04de1a2bb',
    'wrap': '1565299624946-b28f40334309',
    'sandwich': '1539252554453-80ab65ce3586',
    'burger': '1571091718767-18b5b1457add',
    'tacos': '1565299507177-b0ac66763828',
    'chicken': '1598514982346-46d1c5a7e77a',
    'beef': '1546833999-b9fcb8a93c5e',
    'fish': '1544551763-77ef2d0f2476',
    'salmon': '1467003909585-2f8a72700288',
    'vegetarian': '1512621776402-57ad84f617e6',
    'vegan': '1511690743698-d9d85f2fbeb7',
    'protein': '1546833999-b9fcb8a93c5e',
    'bowl': '1512621776402-57ad84f617e6',
    'buddha': '1511690743698-d9d85f2fbeb7',
    'caesar': '1512621776402-57ad84f617e6',
    'mediterranean': '1540420773982-4bda69aea8eb',
    'asian': '1512058564366-4f692b3b70e2',
    'greek': '1540420773982-4bda69aea8eb',
    'italian': '1551782367-19ded58aea74',
    'mexican': '1565299507177-b0ac66763828',
    'indian': '1565299585323-38174c8c84bf',
    'thai': '1512058564366-4f692b3b70e2',
    'chinese': '1552611052-33e04de1a2bb'
  };
  
  // Find matching image category
  let photoId = '1565299624946'; // default healthy meal
  for (const [key, value] of Object.entries(imageMap)) {
    if (recipeNameLower.includes(key)) {
      photoId = value;
      break;
    }
  }
  
  return `https://images.unsplash.com/photo-${photoId}?w=400&h=300&fit=crop&q=80&auto=format&ixlib=rb-4.0.3`;
};

// Helper function to get ingredient image from Unsplash
export const getIngredientImage = (ingredientName: string): string => {
  const ingredient = ingredientName.toLowerCase();
  
  const ingredientImages: Record<string, string> = {
    'tomato': '1592841200221-21374d7bb7ae',
    'tomatoes': '1592841200221-21374d7bb7ae',
    'cherry tomatoes': '1592841200221-21374d7bb7ae',
    'onion': '1618512496248-a07fe8a645c5',
    'onions': '1618512496248-a07fe8a645c5',
    'garlic': '1583203188411-c7325806b70c',
    'carrot': '1598170845058-32b9d6a5da37',
    'carrots': '1598170845058-32b9d6a5da37',
    'potato': '1518977676601-b5a5f04e3948',
    'potatoes': '1518977676601-b5a5f04e3948',
    'chicken': '1604503468506-a8da13de3abd',
    'chicken breast': '1604503468506-a8da13de3abd',
    'chicken thighs': '1604503468506-a8da13de3abd',
    'beef': '1603048588665-791ca8aea617',
    'beef strips': '1603048588665-791ca8aea617',
    'salmon': '1467003909585-2f8a72700288',
    'fish': '1544551763-77ef2d0f2476',
    'rice': '1586201375761-83865001e26f',
    'brown rice': '1586201375761-83865001e26f',
    'basmati rice': '1586201375761-83865001e26f',
    'pasta': '1551782367-19ded58aea74',
    'cheese': '1486297678162-ce23b3eb5ebf',
    'mozzarella': '1486297678162-ce23b3eb5ebf',
    'parmesan': '1486297678162-ce23b3eb5ebf',
    'feta cheese': '1486297678162-ce23b3eb5ebf',
    'milk': '1550583808-6a8c4e6b4e9a',
    'coconut milk': '1550583808-6a8c4e6b4e9a',
    'bread': '1549931319-a545dcf3bc73',
    'sourdough bread': '1549931319-a545dcf3bc73',
    'lettuce': '1622103967-82b04e83a8f7',
    'romaine lettuce': '1622103967-82b04e83a8f7',
    'mixed greens': '1622103967-82b04e83a8f7',
    'spinach': '1576045057222-48018c31ab7a',
    'cucumber': '1449824904-23a37de5cf3e',
    'bell pepper': '1518779578993-19c2c9f98429',
    'peppers': '1518779578993-19c2c9f98429',
    'red peppers': '1518779578993-19c2c9f98429',
    'mushroom': '1589628391284-2a3b9e5d4d8f',
    'mushrooms': '1589628391284-2a3b9e5d4d8f',
    'quinoa': '1511690743698-d9d85f2fbeb7',
    'chickpeas': '1546833999-b9fcb8a93c5e',
    'lentils': '1547592166-23ac45744acd',
    'red lentils': '1547592166-23ac45744acd',
    'tofu': '1546833999-b9fcb8a93c5e',
    'paneer': '1486297678162-ce23b3eb5ebf',
    'avocado': '1523049673857-eb18f1d7b578',
    'olive oil': '1474979266903-7a0f9a094d05',
    'sesame oil': '1474979266903-7a0f9a094d05',
    'soy sauce': '1474979266903-7a0f9a094d05',
    'herbs': '1536431311719-398b6704d4cc',
    'basil': '1536431311719-398b6704d4cc',
    'celery': '1607142547490-eaef80eaa6e5',
    'zucchini': '1449824904-23a37de5cf3e',
    'broccoli': '1628773822503-e6b7c0ff51d8',
    'mixed vegetables': '1628773822503-e6b7c0ff51d8',
    'mixed asian vegetables': '1628773822503-e6b7c0ff51d8',
    'turkey': '1604503468506-a8da13de3abd',
    'ham': '1603048588665-791ca8aea617',
    'hemp seeds': '1511690743698-d9d85f2fbeb7',
    'nutritional yeast': '1511690743698-d9d85f2fbeb7',
    'ginger': '1583203188411-c7325806b70c',
    'sesame seeds': '1511690743698-d9d85f2fbeb7',
    'lime': '1523049673857-eb18f1d7b578',
    'lemon': '1523049673857-eb18f1d7b578',
    'curry spices': '1536431311719-398b6704d4cc',
    'spices': '1536431311719-398b6704d4cc',
    'vegetable stock': '1547592180-85f173990554',
    'chicken stock': '1547592180-85f173990554',
    'olives': '1540420773982-4bda69aea8eb',
    'croutons': '1549931319-a545dcf3bc73'
  };
  
  // First try exact match
  if (ingredientImages[ingredient]) {
    return `https://images.unsplash.com/photo-${ingredientImages[ingredient]}?w=80&h=80&fit=crop&q=80&auto=format&ixlib=rb-4.0.3`;
  }
  
  // Then try partial match
  for (const [key, photoId] of Object.entries(ingredientImages)) {
    if (ingredient.includes(key) || key.includes(ingredient)) {
      return `https://images.unsplash.com/photo-${photoId}?w=80&h=80&fit=crop&q=80&auto=format&ixlib=rb-4.0.3`;
    }
  }
  
  // Default ingredient image - fresh vegetables
  return `https://images.unsplash.com/photo-1506368249209-abb61b0f9e5f?w=80&h=80&fit=crop&q=80&auto=format&ixlib=rb-4.0.3`;
};
