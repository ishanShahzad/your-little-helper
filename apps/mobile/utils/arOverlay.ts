/**
 * Composite an AR-style character onto a photo.
 * Uses offscreen canvas (works in React Native with expo-canvas or web).
 */
export function compositeARCharacter(
  photoBase64: string,
  theme: string,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw photo
      ctx.drawImage(img, 0, 0);

      // Pick position: bottom-left or bottom-right randomly
      const isLeft = Math.random() > 0.5;
      const charWidth = img.width * 0.25;
      const charHeight = charWidth;
      const x = isLeft ? img.width * 0.05 : img.width * 0.65;
      const y = img.height * 0.6;

      // Draw character placeholder (themed colour circle)
      const themeColors: Record<string, string> = {
        pirate: '#8B4513',
        spy: '#2F4F4F',
        fairy: '#FF69B4',
        explorer: '#228B22',
      };
      ctx.fillStyle = themeColors[theme] || '#FFD700';
      ctx.beginPath();
      ctx.arc(x + charWidth / 2, y + charHeight / 2, charWidth / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw emoji character
      ctx.font = `${charWidth * 0.6}px serif`;
      ctx.textAlign = 'center';
      const emojis: Record<string, string> = {
        pirate: '🏴‍☠️',
        spy: '🕵️',
        fairy: '🧚',
        explorer: '🧭',
      };
      ctx.fillText(emojis[theme] || '🐝', x + charWidth / 2, y + charHeight * 0.7);

      // Draw text overlay
      ctx.font = '18px Fredoka, sans-serif';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(
        `${emojis[theme] || '🐝'} was hiding here!`,
        x + charWidth / 2,
        y + charHeight + 24,
      );

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = `data:image/jpeg;base64,${photoBase64}`;
  });
}
