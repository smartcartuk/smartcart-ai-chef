
// Helper function to generate better meal images based on recipe name
export const generateMealImage = (recipeName: string): string => {
  const recipeNameLower = recipeName.toLowerCase();
  
  // Map common recipe types to appropriate Unsplash search terms
  const imageMap: Record<string, string> = {
    'pasta': 'pasta-dish',
    'salad': 'fresh-salad',
    'soup': 'soup-bowl',
    'pizza': 'homemade-pizza',
    'stir-fry': 'stir-fry-vegetables',
    'quinoa': 'quinoa-bowl',
    'chickpea': 'chickpea-curry',
    'lentil': 'lentil-soup',
    'bean': 'bean-dish',
    'pepper': 'stuffed-peppers',
    'chili': 'vegetarian-chili',
    'curry': 'vegetable-curry',
    'rice': 'rice-bowl',
    'noodle': 'asian-noodles',
    'wrap': 'healthy-wrap',
    'sandwich': 'fresh-sandwich',
    'burger': 'veggie-burger',
    'tacos': 'vegetarian-tacos'
  };
  
  // Find matching image category
  let imageCategory = 'healthy-meal'; // default
  for (const [key, value] of Object.entries(imageMap)) {
    if (recipeNameLower.includes(key)) {
      imageCategory = value;
      break;
    }
  }
  
  // Generate a consistent seed based on recipe name for consistent images
  const seed = recipeName.replace(/\s+/g, '-').toLowerCase();
  
  return `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop&q=80&auto=format&seed=${seed}&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&${imageCategory}`;
};
