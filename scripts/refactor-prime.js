#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const primePath = path.join(__dirname, '../assets/js/prime.js');
let content = fs.readFileSync(primePath, 'utf-8');

// Remove accidental "primes.js" token at start
content = content.replace(/^\s*primes\.js\s*\n/, '');

// Define page markers and guard conditions
const pageGuards = {
  '404': "document.querySelector('.stage') || document.querySelector('.links-bar')",
  'A.html': "document.getElementById('hl')",
  'about.html': "document.getElementById('stats-products')",
  'boutique-list.html': "document.getElementById('shops-grid')",
  'boutique.html': "document.getElementById('shop-name')",
  'cart.html': "document.getElementById('cart-content') || document.getElementById('cart-items-list')",
  'catalogue.html': "document.getElementById('catalogue-grid')",
  'contact.html': "document.getElementById('contact-form') || document.getElementById('ct')",
  'delivery.html': "document.getElementById('dv-wall')",
  'index.html': "document.getElementById('hero') || document.querySelector('.hero-search')",
  'invoice.html': "document.getElementById('invoice-container')",
  'login.html': "document.getElementById('form-login')",
  'messages.html': "document.getElementById('messages-container')",
  'product.html': "document.getElementById('ax-root')",
  'profile.html': "document.getElementById('tab-dashboard')",
  'register.html': "document.getElementById('rg')",
  'seller-application.html': "document.getElementById('seller-application-form')",
  'seller-onboarding.html': "document.getElementById('seller-onboarding-form')",
  'seller.html': "document.getElementById('sd')",
  'wishlist.html': "document.getElementById('wl-grid')"
};

// Find all section markers
const markerRegex = /\/\*[^\n]*script[^\n]*\*\//gi;
const markerMatches = Array.from(content.matchAll(markerRegex));
console.log(`Found ${markerMatches.length} section markers`);
if (markerMatches.length === 0) {
  console.log('Sample of file start (first 500 chars):');
  console.log(content.substring(0, 500));
  console.log('---');
}
const markers = markerMatches.map(m => ({
  marker: m[0],
  index: m.index,
  pageName: Object.keys(pageGuards).find(p => m[0].toLowerCase().includes(p.toLowerCase())) || null
}));

// Split content by markers into sections
const sections = [];
for (let i = 0; i < markers.length; i++) {
  const startIdx = markers[i].index;
  const endIdx = i + 1 < markers.length ? markers[i + 1].index : content.length;
  
  const sectionText = content.substring(startIdx, endIdx).trim();
  const markerLine = markers[i].marker;
  const pageName = markers[i].pageName || 'unknown';
  const guard = pageGuards[pageName] || 'true';
  
  // Extract body (everything after the first line)
  const lines = sectionText.split('\n');
  const body = lines.slice(1).join('\n').trim();
  
  if (body) {
    sections.push({ pageName, guard, body, markerLine });
  }
}

console.log(`Extracted ${sections.length} sections`);

// Build new unified structure
let output = `document.addEventListener('DOMContentLoaded', () => {
  // Global year and Lucide initialization
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.innerText = new Date().getFullYear();
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Unified cursor handler for all pages
  const cursorMap = {
    'cur-ring': 'cur-h', 'lg-ring': 'lg-h', 'rg-ring': 'rg-h', 'ct-ring': 'ct-h',
    'bp-ring': 'bp-h', 'wl-ring': 'wl-h', 'db-ring': 'db-h', 'pr-ring': 'pr-h',
    'bl-ring': 'bl-h', 'sd-ring': 'sd-h', 'tk-ring': 'tk-h', 'dv-ring': 'dv-h'
  };
  for (const [ringId, hoverClass] of Object.entries(cursorMap)) {
    const ring = document.getElementById(ringId);
    const dot = document.getElementById(ringId.replace('ring', 'dot'));
    if (ring && dot) {
      let mx=0, my=0, rx=0, ry=0;
      document.addEventListener('mousemove', (e) => {
        mx=e.clientX; my=e.clientY;
        dot.style.left=mx+'px'; dot.style.top=my+'px';
      });
      (function loop() {
        rx += (mx-rx)*.1; ry += (my-ry)*.1;
        ring.style.left=rx+'px'; ring.style.top=ry+'px';
        requestAnimationFrame(loop);
      })();
      document.addEventListener('mouseover', (e) => {
        if(e.target.closest('a,button,input,textarea,select,[onclick],.card')) {
          document.body.classList.add(hoverClass);
        }
      });
      document.addEventListener('mouseout', (e) => {
        if(e.target.closest('a,button,input,textarea,select,[onclick],.card')) {
          document.body.classList.remove(hoverClass);
        }
      });
      break;
    }
  }

  // Proxy to run legacy nested DOMContentLoaded handlers immediately
  const __runLegacyHandler = (fn) => {
    if (typeof fn !== 'function') return;
    const original = document.addEventListener.bind(document);
    document.addEventListener = (type, listener, opts) => {
      if (type === 'DOMContentLoaded' && typeof listener === 'function') {
        try { listener(); } catch(e) { console.error('Handler error:', e); }
        return;
      }
      return original(type, listener, opts);
    };
    try { fn(); } finally { document.addEventListener = original; }
  };

`;

// Add each section with guard
sections.forEach((sec) => {
  output += `\n  // Page: ${sec.pageName}\n`;
  output += `  if (${sec.guard}) {\n`;
  output += `    __runLegacyHandler(() => {\n`;
  // Indent body
  const indentedBody = sec.body.split('\n').map(line => '      ' + line).join('\n');
  output += indentedBody + '\n';
  output += `    });\n`;
  output += `  }\n`;
});

output += `\n});\n`;

// Write to new file
const outputPath = primePath;
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`Successfully refactored ${outputPath} (${sections.length} sections consolidated into single DOMContentLoaded)`);
