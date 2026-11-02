// Generates the share image and app icon from the original logo (public/assets). Run inside web/:
//   node scripts/make-brand-images.mjs
import sharp from "sharp";

const LOGO = "public/assets/bravesyntax_for_black.png";
const BG = "#09090b";
const GREEN = "#10b981";

// ── public/brand/og-default.png: shown when a page is shared and has no image of its own (1200×630) ──
const background = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="${GREEN}" stop-opacity=".22"/><stop offset="1" stop-color="${GREEN}" stop-opacity="0"/></radialGradient>
    <pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity=".045"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="${BG}"/><rect width="1200" height="630" fill="url(#p)"/><rect width="1200" height="630" fill="url(#g)"/>
  <text x="600" y="400" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="600" fill="#ffffff">Websites, Web Apps &amp; Brands That Convert</text>
  <text x="600" y="456" text-anchor="middle" font-family="Consolas, monospace" font-size="24" fill="#a1a1aa">Design &amp; Development Agency · bravesyntax.com</text>
</svg>`);
const logo = await sharp(LOGO).trim().resize({ width: 760 }).png().toBuffer();
const { height: logoH } = await sharp(logo).metadata();
await sharp(background)
  .composite([{ input: logo, left: 220, top: Math.round(290 - logoH) }])
  .png({ compressionLevel: 9, palette: true })
  .toFile("public/brand/og-default.png");

// ── app/icon.png + app/apple-icon.png: the "</>" cut out of the original logo, so the brush lettering is the real one ──
// Coordinates are for the logo scaled to 2000px wide. The mask follows the gap between "/" and the "S" of "Syntax".
const scaled = await sharp(LOGO).resize({ width: 2000 }).png().toBuffer();
const H = (await sharp(scaled).metadata()).height;
const openWidth = 335;
const maskSvg = Buffer.from(`<svg width="${openWidth}" height="${H}" xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 ${1025 - 690},0 ${925 - 690},${H} 0,${H}" fill="#fff"/></svg>`);
const open = await sharp(scaled).extract({ left: 690, top: 0, width: openWidth, height: H }).composite([{ input: maskSvg, blend: "dest-in" }]).png().toBuffer();
// Same idea for ">": the mask leaves out the tail of the "x" just before it.
const closeMask = Buffer.from(`<svg width="200" height="${H}" xmlns="http://www.w3.org/2000/svg"><polygon points="${1850 - 1800},0 200,0 200,${H} ${1800 - 1800},${H}" fill="#fff"/></svg>`);
const close = await sharp(scaled).extract({ left: 1800, top: 0, width: 200, height: H }).composite([{ input: closeMask, blend: "dest-in" }]).png().toBuffer();
const closeLeft = openWidth - 40;
const glyph = await sharp({ create: { width: closeLeft + 200, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: open, left: 0, top: 0 }, { input: close, left: closeLeft, top: 0 }])
  .png()
  .toBuffer();
const mark = await sharp(glyph).trim().png().toBuffer();

async function icon(size, radius, file) {
  const inner = Math.round(size * 0.82);
  const art = await sharp(mark).resize({ width: inner, height: inner, fit: "inside" }).png().toBuffer();
  const m = await sharp(art).metadata();
  const plate = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/></svg>`);
  await sharp(plate)
    .composite([{ input: art, left: Math.round((size - m.width) / 2), top: Math.round((size - m.height) / 2) }])
    .png()
    .toFile(file);
}
await icon(512, 112, "app/icon.png");
await icon(180, 0, "app/apple-icon.png"); // iOS rounds the corners itself
console.log("brand images written");
