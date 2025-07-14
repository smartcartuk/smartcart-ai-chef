
// Supermarket logo URLs (using publicly available logos from reliable sources)
export const supermarketLogos: Record<string, string> = {
  tesco: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tesco_Logo.svg/200px-Tesco_Logo.svg.png',
  sainsburys: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Sainsbury%27s_Logo.svg/200px-Sainsbury%27s_Logo.svg.png',
  asda: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/ASDA_logo.svg/200px-ASDA_logo.svg.png',
  aldi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Aldi_logo.svg/200px-Aldi_logo.svg.png'
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
