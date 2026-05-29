import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, "../public/Logo Académie.png");
const output = path.join(__dirname, "../public/Logo-Academie-fond-blanc.png");

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;

  // Fond noir → blanc
  if (max <= 18) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
    continue;
  }

  // Texte gris très foncé (peu saturé) → noir lisible sur fond blanc
  if (sat < 40 && max < 95) {
    data[i] = 26;
    data[i + 1] = 26;
    data[i + 2] = 26;
    data[i + 3] = 255;
  }
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(output);

console.log("Written:", output);
