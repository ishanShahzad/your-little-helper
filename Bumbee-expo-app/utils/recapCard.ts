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
    body { margin:0; padding:24px; background:#FFFFFF; font-family:'Nunito',sans-serif; }
    .card { max-width:400px; margin:auto; border:3px solid #1A8FE3; border-radius:12px; padding:24px; background:#E8F4FD; }
    h1 { font-family:'Fredoka',sans-serif; color:#1A2332; text-align:center; margin:0 0 8px; }
    .stats { text-align:center; color:#6B7A8D; font-size:14px; }
    .giggles { text-align:center; color:#F5C518; font-size:18px; margin:12px 0; }
    .photos { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin:16px 0; }
    .footer { display:flex; justify-content:space-between; align-items:center; margin-top:16px; }
    .logo { color:#1A8FE3; font-family:'Fredoka',sans-serif; font-size:16px; }
    .copy { color:#6B7A8D; font-size:10px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🐝 ${hunt.theme} Adventure</h1>
    <p class="stats">${hunt.stops.length} stops · ${distKm} km walked</p>
    <p class="giggles">${giggles} giggles estimated 😄</p>
    <div class="photos">${photos}</div>
    <div class="footer">
      <span class="copy">© 2025 Bumbee. All rights reserved.</span>
      <span class="logo">🐝 Bumbee</span>
    </div>
  </div>
</body>
</html>`;
}
