interface HuntData {
  theme: string;
  stops: Array<{ name: string; photoUrl?: string }>;
  route?: { distance: number };
}

export function generateRecapCard(hunt: HuntData): string {
  const giggles = Math.floor(Math.random() * 15) + 10;
  const distKm = ((hunt.route?.distance || 0) / 1000).toFixed(1);
  const photos = hunt.stops
    .filter((s) => s.photoUrl)
    .slice(0, 4)
    .map((s) => `<img src="${s.photoUrl}" style="width:48%;border-radius:8px;object-fit:cover;aspect-ratio:1;" />`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { margin:0; padding:24px; background:#FFFBF0; font-family:'Nunito',sans-serif; }
    .card { max-width:400px; margin:auto; border:3px solid #F5A623; border-radius:16px; padding:24px; background:#FFFBF0; }
    h1 { font-family:'Fredoka',sans-serif; color:#2C2200; text-align:center; margin:0 0 8px; }
    .stats { text-align:center; color:#8A7A66; font-size:14px; }
    .giggles { text-align:center; color:#F5A623; font-size:18px; margin:12px 0; }
    .photos { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin:16px 0; }
    .footer { display:flex; justify-content:space-between; align-items:center; margin-top:16px; }
    .logo { color:#F5A623; font-family:'Fredoka',sans-serif; font-size:16px; }
    .copy { color:#8A7A66; font-size:10px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🐝 ${hunt.theme} Adventure</h1>
    <p class="stats">${hunt.stops.length} stops · ${distKm} km walked</p>
    <p class="giggles">${giggles} giggles estimated 😄</p>
    <div class="photos">${photos}</div>
    <div class="footer">
      <span class="copy">© 2025 Bumbee Ltd</span>
      <span class="logo">🐝 Bumbee</span>
    </div>
  </div>
</body>
</html>`;
}
