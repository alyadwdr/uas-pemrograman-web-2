/* ============================================
   DEAR SKIN — app.js
   Core: storage, navigation, toast, shared data
   ============================================ */

// ===== STORAGE KEYS =====
const KEY = {
  checks:         'ds_checks',
  notes:          'ds_notes',
  treatments:     'ds_treatments',
  products:       'ds_products',
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

// ===== STORAGE HELPERS =====
function load(k, d) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
  catch { return d; }
}
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

function getTreatments()    { return load(KEY.treatments, []); }
function saveTreatments(t)  { save(KEY.treatments, t); }
function getProducts()      { return load(KEY.products, []); }
function saveProducts(p)    { save(KEY.products, p); }
function getChecks()        { return load(KEY.checks, {}); }
function saveChecks(c)      { save(KEY.checks, c); }
function getNotes()         { return load(KEY.notes, {}); }
function saveNotes(n)       { save(KEY.notes, n); }
function getCategories()    { return load(KEY.categories, BASE_CATEGORIES); }
function saveCategories(c)  { save(KEY.categories, c); }
function getLocks()         { return load(KEY.locks, {}); }
function saveLocks(l)       { save(KEY.locks, l); }
function getCustomCatColors()   { return load(KEY.customCatColors, {}); }
function saveCustomCatColors(c) { save(KEY.customCatColors, c); }

// ===== DAY DATA =====
function getDayData(dsStr) {
  const all = getChecks();
  const mor = load(KEY.morningDef, DEFAULT_MORNING);
  const ngt = load(KEY.nightDef,   DEFAULT_NIGHT);
  if (!all[dsStr]) {
    all[dsStr] = {
      morning: Object.fromEntries(mor.map(i => [i, false])),
      night:   Object.fromEntries(ngt.map(i => [i, false])),
      customMorning: [], customNight: [],
      checkedCustomMorning: [], checkedCustomNight: [],
    };
    saveChecks(all);
  }
  return all[dsStr];
}
function saveDayData(ds, data) {
  const all = getChecks();
  all[ds] = data;
  saveChecks(all);
}
function applyDefaultRoutinesToAll() {
  const mor = load(KEY.morningDef, DEFAULT_MORNING);
  const ngt = load(KEY.nightDef,   DEFAULT_NIGHT);
  const all = getChecks();
  for (const dsStr of Object.keys(all)) {
    const d = all[dsStr];
    const newMor = {};
    for (const item of mor) newMor[item] = (d.morning && d.morning[item]) || false;
    const newNgt = {};
    for (const item of ngt) newNgt[item] = (d.night   && d.night[item])   || false;
    d.morning = newMor;
    d.night   = newNgt;
    all[dsStr] = d;
  }
  saveChecks(all);
}

// ===== NAVIGATION =====
function showPage(id, linkEl) {
  // Hide all pages
  document.querySelectorAll('.page-container').forEach(p => p.style.display = 'none');
  // Show target
  const page = document.getElementById('page-' + id);
  if (page) { page.style.display = 'block'; page.classList.add('fade-in-up'); }

  // Update nav active state
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');

  // Page-specific init
  if (id === 'inventory') renderInventory();
  if (id === 'settings')  {
    renderTreatments();
    renderDefaultRoutines();
    renderCategoryList();
  }

  return false; // prevent anchor jump
}

// ===== TOAST =====
let toastTimer;
function showToast(msg) {
  const el  = document.getElementById('toast');
  const txt = document.getElementById('toastMsg');
  txt.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Set today as default treat start date
  const tsd = document.getElementById('treatStartDate');
  if (tsd) tsd.value = new Date().toISOString().slice(0, 10);

  renderCalendar();
});
