/* ============================================
   DEAR SKIN — bg-pattern.js
   Background pattern switcher
   ============================================ */

const PATTERNS = [
  { id: 'none',     label: 'Polos',    icon: '○' },
  { id: 'dots',     label: 'Polkadot', icon: '⬤' },
  { id: 'stripes',  label: 'Garis',    icon: '☰' },
  { id: 'stars',    label: 'Bintang',  icon: '✦' },
  { id: 'spiral',   label: 'Spiral',   icon: '◎' },
  { id: 'cloud',    label: 'Awan',     icon: '◉' },
  { id: 'flower',   label: 'Bunga',    icon: '✿' },
  { id: 'heart',    label: 'Hati',     icon: '♡' },
  { id: 'diamond',  label: 'Wajik',    icon: '◇' },
  { id: 'wave',     label: 'Ombak',    icon: '〜' },
];

let currentPattern = localStorage.getItem('ds_bg_pattern') || 'dots';
let patternCanvas  = null;

// ===== SVG SHAPES =====
const SVGS = {
  star: (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>`,

  sparkle: (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l1.5 9.5L21 12l-7.5 2.5L12 24l-1.5-9.5L3 12l7.5-2.5z"/></svg>`,

  spiral: (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5-1.5 3.5-3.5 3.5S8 14 8 12s2-5 5-5 7 2.5 7 7-3 8-8 8-9-4-9-10S7 2 12 2"/></svg>`,

  cloud: (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,

  flower: (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="5" rx="2" ry="3.5"/><ellipse cx="12" cy="19" rx="2" ry="3.5"/><ellipse cx="5" cy="12" rx="3.5" ry="2"/><ellipse cx="19" cy="12" rx="3.5" ry="2"/><ellipse cx="7.05" cy="7.05" rx="2" ry="3.5" transform="rotate(-45 7.05 7.05)"/><ellipse cx="16.95" cy="16.95" rx="2" ry="3.5" transform="rotate(-45 16.95 16.95)"/><ellipse cx="16.95" cy="7.05" rx="2" ry="3.5" transform="rotate(45 16.95 7.05)"/><ellipse cx="7.05" cy="16.95" rx="2" ry="3.5" transform="rotate(45 7.05 16.95)"/></svg>`,

  heart: (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,

  diamond: (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 22,12 12,22 2,12"/></svg>`,

  wave: (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 8" fill="none" stroke="${color}" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg"><path d="M0 4 Q3 0 6 4 Q9 8 12 4 Q15 0 18 4 Q21 8 24 4"/></svg>`,
};

// ===== COLOR PALETTE (muted, on-cream) =====
const COLORS = [
  'rgba(61,43,31,0.08)',
  'rgba(124,140,90,0.1)',
  'rgba(240,196,196,0.35)',
  'rgba(232,209,112,0.3)',
  'rgba(122,92,74,0.08)',
  'rgba(164,178,117,0.15)',
];

function randColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// ===== CANVAS PATTERN RENDERER =====
function clearPattern() {
  if (patternCanvas) { patternCanvas.remove(); patternCanvas = null; }
  const old = document.getElementById('ds-bg-pattern');
  if (old) old.remove();
}

function drawPattern(id) {
  clearPattern();
  if (id === 'none') return;

  const layer = document.createElement('div');
  layer.id    = 'ds-bg-pattern';
  layer.style.cssText = `
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    overflow: hidden;
  `;
  document.body.insertBefore(layer, document.body.firstChild);

  const W = window.innerWidth;
  const H = window.innerHeight + 200;

  if (id === 'dots') {
    // Zigzag polkadot via SVG pattern
    const size   = 60;
    const gap    = 150;
    const color  = 'rgba(61,43,31,0.09)';
    let dots     = '';
    for (let row = 0, y = gap/2; y < H + gap; row++, y += gap) {
      const offset = (row % 2 === 0) ? 0 : gap / 2;
      for (let x = offset; x < W + gap; x += gap) {
        dots += `<circle cx="${x}" cy="${y}" r="${size/2}" fill="${color}"/>`;
      }
    }
    layer.innerHTML = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">${dots}</svg>`;
    return;
  }

  if (id === 'stripes') {
    const stripeW = 28;
    const gap2    = 28;
    const color   = 'rgba(61,43,31,0.055)';
    let stripes   = '';
    for (let x = -stripeW; x < W + stripeW; x += stripeW + gap2) {
      stripes += `<rect x="${x}" y="0" width="${stripeW}" height="${H}" fill="${color}"/>`;
    }
    layer.innerHTML = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">${stripes}</svg>`;
    return;
  }

  // Random scatter patterns
  const SHAPE_MAP = {
    stars:   ['star', 'sparkle'],
    spiral:  ['spiral'],
    cloud:   ['cloud'],
    flower:  ['flower'],
    heart:   ['heart'],
    diamond: ['diamond'],
    wave:    ['wave'],
  };

  const shapeTypes = SHAPE_MAP[id] || ['star'];
  const count = Math.floor((W * H) / 14000);

  let svgItems = '';
  for (let i = 0; i < count; i++) {
    const x       = Math.random() * W;
    const y       = Math.random() * H;
    const size    = 14 + Math.random() * 28;
    const rot     = Math.random() * 360;
    const opacity = 0.18 + Math.random() * 1.3;
    const color   = randColor();
    const type    = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const svgStr  = SVGS[type]?.(size, color) || '';

    // Encode SVG for use in foreignObject or image
    const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
    svgItems += `<image href="${encoded}" x="${x - size/2}" y="${y - size/2}" width="${size}" height="${size}"
      transform="rotate(${rot} ${x} ${y})" opacity="${opacity}"/>`;
  }

  layer.innerHTML = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0"
    xmlns:xlink="http://www.w3.org/1999/xlink">${svgItems}</svg>`;
}

// ===== SWITCHER UI =====
function createPatternSwitcher() {
  const wrap = document.createElement('div');
  wrap.id = 'pattern-switcher';
  wrap.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 20px;
    z-index: 500;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    font-family: 'DM Sans', sans-serif;
  `;

  // Toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
    Pattern
  `;
  toggleBtn.style.cssText = `
    background: #3D2B1F; color: #FDF6E3;
    border: none; border-radius: 999px;
    padding: 8px 16px; font-size: 0.78rem; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; gap: 6px;
    box-shadow: 3px 3px 0 rgba(61,43,31,0.3);
    transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  `;
  toggleBtn.onmouseenter = () => { toggleBtn.style.background = '#7C8C5A'; };
  toggleBtn.onmouseleave = () => { toggleBtn.style.background = '#3D2B1F'; };

  // Panel
  const panel = document.createElement('div');
  panel.style.cssText = `
    background: #FAF3E0;
    border: 2px solid #3D2B1F;
    border-radius: 18px;
    padding: 14px;
    box-shadow: 4px 4px 0 rgba(61,43,31,0.2);
    display: none;
    flex-direction: column;
    gap: 6px;
    min-width: 140px;
  `;

  const title = document.createElement('div');
  title.textContent = 'Background';
  title.style.cssText = `font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.6px; color: #7A5C4A; margin-bottom: 4px; font-family: 'DM Sans', sans-serif;`;
  panel.appendChild(title);

  PATTERNS.forEach(p => {
    const btn = document.createElement('button');
    btn.dataset.pid = p.id;
    btn.style.cssText = `
      background: ${currentPattern === p.id ? '#3D2B1F' : '#FDF6E3'};
      color: ${currentPattern === p.id ? '#FDF6E3' : '#3D2B1F'};
      border: 1.5px solid ${currentPattern === p.id ? '#3D2B1F' : 'rgba(61,43,31,0.15)'};
      border-radius: 999px;
      padding: 5px 12px;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
      display: flex; align-items: center; gap: 7px;
      font-family: 'DM Sans', sans-serif;
    `;
    btn.innerHTML = `<span style="font-size:0.85rem">${p.icon}</span> ${p.label}`;
    btn.onclick = () => {
      currentPattern = p.id;
      localStorage.setItem('ds_bg_pattern', p.id);
      drawPattern(p.id);
      // Update active state
      panel.querySelectorAll('button[data-pid]').forEach(b => {
        const active = b.dataset.pid === p.id;
        b.style.background   = active ? '#3D2B1F' : '#FDF6E3';
        b.style.color        = active ? '#FDF6E3' : '#3D2B1F';
        b.style.borderColor  = active ? '#3D2B1F' : 'rgba(61,43,31,0.15)';
      });
    };
    btn.onmouseenter = () => {
      if (btn.dataset.pid !== currentPattern) {
        btn.style.background = '#F5E6A3';
        btn.style.borderColor = '#3D2B1F';
      }
    };
    btn.onmouseleave = () => {
      if (btn.dataset.pid !== currentPattern) {
        btn.style.background = '#FDF6E3';
        btn.style.borderColor = 'rgba(61,43,31,0.15)';
      }
    };
    panel.appendChild(btn);
  });

  // Toggle panel visibility
  let panelOpen = false;
  toggleBtn.onclick = () => {
    panelOpen = !panelOpen;
    panel.style.display = panelOpen ? 'flex' : 'none';
  };

  // Close on outside click
  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) {
      panelOpen = false;
      panel.style.display = 'none';
    }
  });

  wrap.appendChild(panel);
  wrap.appendChild(toggleBtn);
  document.body.appendChild(wrap);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  drawPattern(currentPattern);
  createPatternSwitcher();
});

// Re-draw on resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => drawPattern(currentPattern), 300);
});
