import { useMemo } from 'react';

const tzCurrencyMap: Record<string, { currency: string; symbol: string }> = {
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
  'Australia/Sydney': { currency: 'AUD', symbol: 'A$' },
  'Australia/Melbourne': { currency: 'AUD', symbol: 'A$' },
  'Asia/Tokyo': { currency: 'JPY', symbol: '¥' },
  'Asia/Kolkata': { currency: 'INR', symbol: '₹' },
  'America/Sao_Paulo': { currency: 'BRL', symbol: 'R$' },
  'America/Toronto': { currency: 'CAD', symbol: 'C$' },
  'America/Vancouver': { currency: 'CAD', symbol: 'C$' },
  'Pacific/Auckland': { currency: 'NZD', symbol: 'NZ$' },
};

const fahrenheitZones = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Dublin',
];

export function useLocale() {
  return useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = tzCurrencyMap[tz] || { currency: 'USD', symbol: '$' };
    return {
      ...match,
      useFahrenheit: fahrenheitZones.includes(tz),
      timezone: tz,
    };
  }, []);
}
