
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
    'tacos': '1565299507177-b0ac66763828'
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
