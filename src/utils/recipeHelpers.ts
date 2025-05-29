
export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const buildPreferencesString = (userProfile: any) => {
  const dietary = userProfile?.dietaryPreferences?.length > 0 
    ? `dietary preferences: ${userProfile.dietaryPreferences.join(', ')}` 
    : '';
  
  const allergies = userProfile?.allergies?.length > 0 
    ? `avoid: ${userProfile.allergies.join(', ')}` 
    : '';
  
  const household = `serves ${userProfile?.householdSize || 2} people`;
  const budget = `budget-friendly (weekly budget: £${userProfile?.weeklyBudget || 50})`;
  
  return [dietary, allergies, household, budget].filter(Boolean).join(', ');
};

export const generateRecipeImage = (day: string) => {
  return `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop&seed=${day}`;
};
