import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(join(root, 'resources', 'rurinagi-logo.svg'), 'utf8');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = [];

for (const size of sizes) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>*{box-sizing:border-box}html,body,svg{width:100%;height:100%;margin:0;display:block}</style>${source}`);
  images.push(await page.screenshot({ type: 'png', omitBackground: true }));
}

await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(`<style>*{box-sizing:border-box}html,body,svg{width:100%;height:100%;margin:0;display:block}</style>${source}`);
await page.screenshot({ path: join(root, 'resources', 'rurinagi-logo.png'), type: 'png', omitBackground: true });
await browser.close();

const header = Buffer.alloc(6 + images.length * 16);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(sizes[index] === 256 ? 0 : sizes[index], entry);
  header.writeUInt8(sizes[index] === 256 ? 0 : sizes[index], entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});

await writeFile(join(root, 'resources', 'rurinagi-icon.ico'), Buffer.concat([header, ...images]));
