/* ============================================
   DEAR SKIN — app.js
   Core: API config, navigation, toast, shared data
   (localStorage hanya untuk treatments, categories,
    locks — data produk & rutinitas via API)
   ============================================ */

// ===== API CONFIG =====
const API_BASE = 'http://localhost:3000/api';

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return await res.json();
  } catch (err) {
    showToast('❌ ' + err.message);
    throw err;
  }
}

// ===== STORAGE KEYS (localStorage — data ringan saja) =====
const KEY = {
  treatments:     'ds_treatments',
  morningDef:     'ds_morning_default',
  nightDef:       'ds_night_default',
  categories:     'ds_categories',
  locks:          'ds_locks',
  customCatColors:'ds_custom_cat_colors',
};

const DEFAULT_MORNING = ['Cleanser','Toner','Serum','Moisturizer','Sunscreen'];
const DEFAULT_NIGHT   = ['Double Cleansing','Cleanser','Toner','Moisturizer'];

const BASE_CATEGORIES = [
  { key:'cleanser',    label:'Cleanser' },
  { key:'toner',       label:'Toner' },
  { key:'serum',       label:'Serum' },
  { key:'treatment',   label:'Treatment' },
  { key:'moisturizer', label:'Moisturizer' },
  { key:'sunscreen',   label:'Sunscreen' },
  { key:'eye_cream',   label:'Eye Cream' },
  { key:'essence',     label:'Essence' },
];

const PASTEL_POOL = [
  '#FFB3BA','#FFDFBA','#FFFFBA','#BAFFC9','#BAE1FF',
  '#E8BAFF','#FFB3F0','#B3FFF0','#D4F0A8','#F0D4A8',
  '#A8D4F0','#F0A8C0','#C0F0A8','#A8C0F0','#F0C0A8',
];

// ===== LOCALSTORAGE HELPERS =====
function load(k, d) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
  catch { return d; }
}
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

function getTreatments()        { return load(KEY.treatments, []); }
function saveTreatments(t)      { save(KEY.treatments, t); }
function getCategories()        { return load(KEY.categories, BASE_CATEGORIES); }
function saveCategories(c)      { save(KEY.categories, c); }
function getLocks()             { return load(KEY.locks, {}); }
function saveLocks(l)           { save(KEY.locks, l); }
function getCustomCatColors()   { return load(KEY.customCatColors, {}); }
function saveCustomCatColors(c) { save(KEY.customCatColors, c); }

// ===== NAVIGATION =====
function showPage(id, linkEl) {
  document.querySelectorAll('.page-container').forEach(p => p.style.display = 'none');
  const page = document.getElementById('page-' + id);
  if (page) { page.style.display = 'block'; page.classList.add('fade-in-up'); }

  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');

  if (id === 'inventory') renderInventory();
  if (id === 'settings')  {
    renderTreatments();
    renderDefaultRoutines();
    renderCategoryList();
  }
  return false;
}

// ===== TOAST =====
let toastTimer;
function showToast(msg) {
  const el  = document.getElementById('toast');
  const txt = document.getElementById('toastMsg');
  txt.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const tsd = document.getElementById('treatStartDate');
  if (tsd) tsd.value = new Date().toISOString().slice(0, 10);
  renderCalendar();
});