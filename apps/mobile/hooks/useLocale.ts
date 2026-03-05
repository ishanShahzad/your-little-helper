interface LocaleInfo {
  currency: string;
  symbol: string;
  useFahrenheit: boolean;
}

export function useLocale(): LocaleInfo {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const currencyMap: Record<string, { currency: string; symbol: string }> = {
    'America/New_York': { currency: 'USD', symbol: '$' },
    'America/Chicago': { currency: 'USD', symbol: '$' },
    'America/Denver': { currency: 'USD', symbol: '$' },
    'America/Los_Angeles': { currency: 'USD', symbol: '$' },
    'Europe/London': { currency: 'GBP', symbol: '£' },
    'Europe/Dublin': { currency: 'EUR', symbol: '€' },
    'Europe/Paris': { currency: 'EUR', symbol: '€' },
    'Europe/Berlin': { currency: 'EUR', symbol: '€' },
    'Europe/Rome': { currency: 'EUR', symbol: '€' },
    'Europe/Madrid': { currency: 'EUR', symbol: '€' },
    'Asia/Tokyo': { currency: 'JPY', symbol: '¥' },
    'Asia/Kolkata': { currency: 'INR', symbol: '₹' },
    'America/Sao_Paulo': { currency: 'BRL', symbol: 'R$' },
    'America/Toronto': { currency: 'CAD', symbol: 'C$' },
    'America/Vancouver': { currency: 'CAD', symbol: 'C$' },
    'Pacific/Auckland': { currency: 'NZD', symbol: 'NZ$' },
  };

  // Check Australia
  const match = tz.startsWith('Australia/')
    ? { currency: 'AUD', symbol: 'A$' }
    : currencyMap[tz] || { currency: 'USD', symbol: '$' };

  const fahrenheitZones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Dublin',
  ];

  return {
    ...match,
    useFahrenheit: fahrenheitZones.includes(tz),
  };
}
