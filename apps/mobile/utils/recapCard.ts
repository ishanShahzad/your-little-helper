interface HuntData {
  theme: string;
  stops: { name: string; photoUrl?: string; completed: boolean }[];
  route: { distance: number };
}

export function generateRecapCard(hunt: HuntData): string {
  const themeIcons: Record<string, string> = {
    pirate: '🏴‍☠️',
    spy: '🕵️',
    fairy: '🧚',
    explorer: '🧭',
  };

  const icon = themeIcons[hunt.theme] || '🐝';
  const completedStops = hunt.stops.filter((s) => s.completed).length;
  const distanceKm = (hunt.route.distance / 1000).toFixed(1);
  const giggles = Math.floor(Math.random() * 16) + 10;

  const photoGrid = hunt.stops
    .filter((s) => s.photoUrl)
    .slice(0, 4)
    .map(
      (s) =>
        `<img src="${s.photoUrl}" style="width:48%;aspect-ratio:1;object-fit:cover;border-radius:8px;" />`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; font-family: 'Nunito', sans-serif; }
    .card {
      width: 360px; padding: 24px; border-radius: 20px;
      background: linear-gradient(135deg, #FFF8E1, #FFD54F);
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      position: relative;
    }
    h1 { font-family: 'Fredoka', sans-serif; font-size: 24px; margin: 0 0 8px; }
    .stats { font-size: 16px; margin: 4px 0; color: #5D4037; }
    .photos { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
    .footer { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #8D6E63; margin-top: 16px; }
    .logo { font-family: 'Fredoka', sans-serif; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${icon} ${hunt.theme.charAt(0).toUpperCase() + hunt.theme.slice(1)} Adventure!</h1>
    <p class="stats">📍 ${completedStops} stops explored</p>
    <p class="stats">🚶 ${distanceKm} km walked</p>
    <p class="stats">😂 ${giggles} giggles estimated</p>
    <div class="photos">${photoGrid}</div>
    <div class="footer">
      <span>© 2025 Bumbee Ltd</span>
      <span class="logo">🐝 Bumbee</span>
    </div>
  </div>
</body>
</html>`;
}
