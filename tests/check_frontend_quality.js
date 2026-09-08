const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '../frontend-user/dist/assets');
const files = fs.readdirSync(dist);
const jsFiles = files.filter(file => file.endsWith('.js')).map(file => ({ file, bytes: fs.statSync(path.join(dist, file)).size }));
const initial = jsFiles.filter(item => item.file.startsWith('index-')).sort((a, b) => b.bytes - a.bytes)[0];
const routeChunks = jsFiles.filter(item => /^(Home|ServiceBooking|Products|TechnicianPortal|Login)-/.test(item.file));
if (!initial || initial.bytes > 450 * 1024) throw new Error(`Initial JS budget exceeded: ${initial?.bytes || 0} bytes`);
if (routeChunks.length < 5) throw new Error(`Route splitting missing: only ${routeChunks.length} route chunks`);

const hero = fs.readFileSync(path.join(__dirname, '../frontend-user/src/components/home/HeroBanner.tsx'), 'utf8');
if (!hero.includes('image/avif') || !hero.includes('image/webp') || !hero.includes('fetchPriority="high"')) throw new Error('Responsive hero image sources are incomplete');
const css = fs.readFileSync(path.join(__dirname, '../frontend-user/src/index.css'), 'utf8');
if (!css.includes('prefers-reduced-motion: reduce') || !css.includes(':focus-visible')) throw new Error('Accessibility motion/focus safeguards are missing');

console.log(`FRONTEND QUALITY PASSED: initial JS ${(initial.bytes / 1024).toFixed(1)}KB, ${routeChunks.length} lazy route chunks`);
