
// Supermarket logo URLs (using publicly available logos)
export const supermarketLogos: Record<string, string> = {
  tesco: 'https://logos-world.net/wp-content/uploads/2020/11/Tesco-Logo.png',
  sainsburys: 'https://logos-world.net/wp-content/uploads/2020/11/Sainsburys-Logo.png',
  asda: 'https://logos-world.net/wp-content/uploads/2020/11/ASDA-Logo.png',
  aldi: 'https://logos-world.net/wp-content/uploads/2020/11/Aldi-Logo.png'
};

// Fallback emojis in case images don't load
export const supermarketEmojis: Record<string, string> = {
  tesco: '🔵',
  sainsburys: '🟠',
  asda: '🟢',
  aldi: '🟣'
};

export const getSupermarketLogo = (storeName: string): { logo: string; emoji: string } => {
  const normalizedName = storeName.toLowerCase();
  return {
    logo: supermarketLogos[normalizedName] || '',
    emoji: supermarketEmojis[normalizedName] || '🏪'
  };
};
