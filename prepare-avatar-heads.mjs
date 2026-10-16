import {createRequire} from 'node:module';
import path from 'node:path';
const sharp = createRequire(import.meta.url)('../miao-cloud/node_modules/sharp');

// Preserve the whole quadrant, including the hand-drawn outer strokes.
// The former hand-picked rectangles cut into the cheeks and bottom outline.
const assets = path.join(import.meta.dirname, 'docs/assets');
const source = path.join(assets, 'cat-heads-v5.webp');
const {width, height} = await sharp(source).metadata();
const splitX = Math.floor(width / 2), splitY = Math.round(height * 0.538);
for (let i = 0; i < 4; i++) {
  const left = i % 2 ? splitX : 0, top = i < 2 ? 0 : splitY;
  const quadrant = await sharp(source).extract({left, top,
    width: i % 2 ? width - splitX : splitX,
    height: i < 2 ? splitY : height - splitY
  }).png().toBuffer();
  const input = await sharp(quadrant).trim().resize(224, 224, {fit: 'inside'}).png().toBuffer();
  const meta = await sharp(input).metadata();
  await sharp({create: {width: 256, height: 256, channels: 4, background: '#00000000'}})
    .composite([{input, left: Math.round((256-meta.width)/2), top: Math.round((256-meta.height)/2)}])
    .webp({quality: 94, alphaQuality: 100})
    .toFile(path.join(assets, 'home-parts', `head-${i}-v2.webp`));
}
