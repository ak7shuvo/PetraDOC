// Dev-only: regenerates public/icons/*.png and public/icon.svg with headless Chromium.
//   node scripts/make-icons.mjs
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const svg = (size, { rounded = true, scale = 1 } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
<rect width="512" height="512" ${rounded ? 'rx="96"' : ""} fill="#0F766E"/>
<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
<path d="M216 100h80v108h108v80H296v108h-80V288H108v-80h108z" fill="#fff"/><circle cx="400" cy="112" r="30" fill="#F97316"/></g></svg>`;

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icon.svg", svg(512));
const b = await chromium.launch();
const jobs = [["icon-192.png", 192, {}], ["icon-512.png", 512, {}], ["icon-maskable-512.png", 512, { rounded: false, scale: 0.72 }], ["apple-touch-icon.png", 180, { rounded: false, scale: 0.9 }]];
for (const [file, size, opt] of jobs) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<body style="margin:0;background:transparent">${svg(size, opt)}</body>`);
  await p.screenshot({ path: `public/icons/${file}`, omitBackground: true });
  await p.close();
}
await b.close();
console.log("icons written");
