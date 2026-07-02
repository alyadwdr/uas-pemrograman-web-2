/* ============================================
   DEAR SKIN — calendar.js
   Calendar rendering, popup, checklist
   — rutinitas harian via API
   ============================================ */

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];
const DAYS_ID   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

const todayDate      = new Date();
let   currentYear    = todayDate.getFullYear();
let   currentMonth   = todayDate.getMonth();
let   currentPopupDs = null;

// Cache rutinitas per bulan: { 'YYYY-MM': [ ...rows ] }
let _routineCache = {};

// Konversi date dari DB ke string lokal (hindari timezone offset)
function toLocalDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function ds(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ===== FETCH RUTINITAS BULAN INI =====
async function fetchMonthRoutines(year, month) {
  const key = `${year}-${String(month+1).padStart(2,'0')}`;
  if (_routineCache[key]) return _routineCache[key];
  try {
    const rows = await apiFetch(`/routines/month?year=${year}&month=${month+1}`);
    _routineCache[key] = rows;
    return rows;
  } catch { return []; }
}

function invalidateMonthCache(dateStr) {
  const key = dateStr.slice(0, 7);
  delete _routineCache[key];
}

// ===== TREATMENTS FOR DATE (localStorage) =====
function treatmentsForDate(y, m, d) {
  const date = new Date(y, m, d);
  const dow  = date.getDay();
  return getTreatments().filter(t => {
    if (t.startDate) {
      const start = new Date(t.startDate);
      start.setHours(0,0,0,0);
      if (date < start) return false;
    }
    if (t.type === 'days')     return t.days.includes(dow);
    if (t.type === 'interval') {
      const ref = t.startDate ? new Date(t.startDate) : new Date(2024,0,1);
      ref.setHours(0,0,0,0);
      const diff = Math.round((date - ref) / 86400000);
      return diff >= 0 && diff % t.interval === 0;
    }
    return false;
  });
}

// ===== CALENDAR RENDER =====
async function renderCalendar(direction) {
  const grid  = document.getElementById('calGrid');
  const label = document.getElementById('monthLabel');
  const stat  = document.getElementById('doneNum');
  if (!grid) return;

  label.textContent = `${MONTHS_ID[currentMonth]} ${currentYear}`;

  const monthRows = await fetchMonthRoutines(currentYear, currentMonth);

  // Hitung full-routine days
  const morItems = load(KEY.morningDef, DEFAULT_MORNING);
  const ngtItems = load(KEY.nightDef,   DEFAULT_NIGHT);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let fullDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = ds(currentYear, currentMonth, d);
    const dayRows = monthRows.filter(r => toLocalDate(r.date) === dateStr);
    if (dayRows.length === 0) continue;

    const morDone = morItems.every(item =>
      dayRows.some(r => r.session === 'morning' && r.item_name === item && r.is_checked));
    const ngtDone = ngtItems.every(item =>
      dayRows.some(r => r.session === 'night' && r.item_name === item && r.is_checked));
    if (morDone && ngtDone) fullDays++;
  }
  if (stat) stat.textContent = fullDays;

  renderTreatLegend();

  // Slide animation
  const build = () => buildCalendarCells(grid, monthRows);
  if (direction) {
    const outClass = direction === 'left' ? 'slide-left-out'  : 'slide-right-out';
    const inClass  = direction === 'left' ? 'slide-left-in'   : 'slide-right-in';
    grid.classList.add(outClass);
    setTimeout(() => {
      grid.classList.remove(outClass);
      grid.classList.add(inClass);
      build();
      requestAnimationFrame(() => grid.classList.remove(inClass));
    }, 280);
  } else {
    build();
  }
}

function buildCalendarCells(grid, monthRows) {
  const headers = Array.from(grid.querySelectorAll('.cal-dow'));
  grid.innerHTML = '';
  headers.forEach(h => grid.appendChild(h));

  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const locks       = getLocks();
  const morItems    = load(KEY.morningDef, DEFAULT_MORNING);
  const ngtItems    = load(KEY.nightDef,   DEFAULT_NIGHT);

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dsKey    = ds(currentYear, currentMonth, d);
    const isToday  = d === todayDate.getDate() &&
                     currentMonth === todayDate.getMonth() &&
                     currentYear  === todayDate.getFullYear();
    const isFuture = new Date(currentYear, currentMonth, d) > todayDate;
    const isLocked = locks[dsKey];

    // Hitung progress dari cache bulan
    const dayRows = (monthRows || []).filter(r => toLocalDate(r.date) === dsKey);
    const total   = morItems.length + ngtItems.length;
    const done    = [...morItems.map(i => dayRows.some(r => r.session==='morning' && r.item_name===i && r.is_checked)),
                     ...ngtItems.map(i => dayRows.some(r => r.session==='night'   && r.item_name===i && r.is_checked))]
                    .filter(Boolean).length;
    const progress   = total > 0 && dayRows.length > 0 ? done / total : 0;
    const isComplete = progress === 1;

    const treats    = treatmentsForDate(currentYear, currentMonth, d);
    const chipsHTML = treats.map(t =>
      `<div class="treat-chip" style="background:${t.color||'#C084FC'}" title="${t.name}"></div>`
    ).join('');

    const lockSVG = `<div class="day-lock-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg></div>`;

    const dayNumHTML = isToday
      ? `<div class="day-num" style="background:var(--brown);color:var(--cream);width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.82rem">${d}</div>`
      : `<div class="day-num">${d}</div>`;

    const cell = document.createElement('div');
    cell.className = 'cal-day' + (isToday ? ' today' : '') + (isLocked ? ' locked' : '');
    cell.innerHTML = `
      ${dayNumHTML}
      <div class="day-treat-chips">${chipsHTML}</div>
      <div class="day-progress-bar">
        <div class="day-progress-fill ${isComplete ? 'complete' : 'partial'}"
             style="width:${progress * 100}%"></div>
      </div>
      ${lockSVG}
    `;

    if (!isFuture) {
      cell.addEventListener('click', () => openDayPopup(currentYear, currentMonth, d));
    } else {
      cell.style.opacity = '0.45';
      cell.style.cursor  = 'default';
    }
    grid.appendChild(cell);
  }
}

function renderTreatLegend() {
  const el = document.getElementById('treatLegend');
  if (!el) return;
  const treats = getTreatments();
  el.innerHTML = treats.map(t =>
    `<div class="legend-item"><div class="legend-dot" style="background:${t.color||'#C084FC'}"></div>${t.name}</div>`
  ).join('') + `
    <div class="legend-item"><div class="legend-bar partial"></div> Sebagian</div>
    <div class="legend-item"><div class="legend-bar complete"></div> Lengkap</div>
  `;
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth > 11) { currentMonth = 0;  currentYear++; }
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  renderCalendar(dir === 1 ? 'left' : 'right');
}

// Swipe
(function initSwipe() {
  let startX = 0;
  const wrapper = document.getElementById('calSwipeWrapper');
  if (!wrapper) return;
  wrapper.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  wrapper.addEventListener('touchend',   e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) changeMonth(diff > 0 ? 1 : -1);
  }, { passive: true });
})();

// ===== DAY POPUP =====
let _popupRows = []; // rutinitas rows untuk hari yang dibuka

async function openDayPopup(y, m, d) {
  currentPopupDs = ds(y, m, d);
  document.getElementById('popupDateLabel').textContent = `${d} ${MONTHS_ID[m]} ${y}`;
  document.getElementById('popupDateSub').textContent   = DAYS_ID[new Date(y,m,d).getDay()];

  // Load rows dari API
  try {
    _popupRows = await apiFetch(`/routines?date=${currentPopupDs}`);
  } catch { _popupRows = []; }

  renderPopupBody();
  updateLockBtn();
  document.getElementById('dayOverlay').classList.add('open');
}

function closeDayPopup(e) {
  if (e.target === document.getElementById('dayOverlay')) closeDayPopupBtn();
}
function closeDayPopupBtn() {
  document.getElementById('dayOverlay').classList.remove('open');
  invalidateMonthCache(currentPopupDs);
  renderCalendar();
}

function updateLockBtn() {
  const locked = getLocks()[currentPopupDs];
  const btn    = document.getElementById('popupLockBtn');
  const txt    = document.getElementById('lockBtnText');
  if (!btn) return;
  btn.classList.toggle('is-locked', !!locked);
  txt.textContent = locked ? 'Terkunci' : 'Kunci';
}

function toggleDayLock() {
  const locks = getLocks();
  locks[currentPopupDs] = !locks[currentPopupDs];
  saveLocks(locks);
  updateLockBtn();
  renderPopupBody();
  showToast(locks[currentPopupDs] ? 'Hari ini dikunci 🔒' : 'Kunci dibuka 🔓');
}

// ===== UPSERT RUTINITAS KE API =====
async function upsertRoutine(date, session, item_name, is_checked) {
  try {
    const row = await apiFetch('/routines', {
      method: 'POST',
      body: JSON.stringify({ date, session, item_name, is_checked }),
    });
    // Update cache lokal _popupRows
    const idx = _popupRows.findIndex(r => r.session === session && r.item_name === item_name);
    if (idx >= 0) _popupRows[idx] = row;
    else _popupRows.push(row);
  } catch { /* toast sudah ditampilkan oleh apiFetch */ }
}

async function deleteRoutineItem(id) {
  try {
    await apiFetch(`/routines/${id}`, { method: 'DELETE' });
    _popupRows = _popupRows.filter(r => r.id !== id);
  } catch {}
}

// ===== RENDER POPUP BODY =====
function renderPopupBody() {
  const body   = document.getElementById('popupBody');
  const locked = getLocks()[currentPopupDs];
  const morDef = load(KEY.morningDef, DEFAULT_MORNING);
  const ngtDef = load(KEY.nightDef,   DEFAULT_NIGHT);
  const treats = treatmentsForDate(...currentPopupDs.split('-').map((v,i) => i===1 ? Number(v)-1 : Number(v)));

  function getRow(session, item_name) {
    return _popupRows.find(r => r.session === session && r.item_name === item_name);
  }

  const makeCheckItem = (label, checked, onToggle, onDelete, extraClass='') => {
    const div = document.createElement('div');
    div.className = `check-item${checked ? ' checked' : ''}${extraClass ? ' '+extraClass : ''}`;
    div.innerHTML = `
      <div class="check-box"></div>
      <span class="check-label">${label}</span>
      ${!locked && onDelete ? `<button class="delete-item-btn" title="Hapus">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg></button>` : ''}
    `;
    if (!locked) {
      div.querySelector('.check-box').addEventListener('click', () => {
        const nowChecked = !div.classList.contains('checked');
        div.classList.toggle('checked', nowChecked);
        div.classList.add('just-checked');
        setTimeout(() => div.classList.remove('just-checked'), 300);
        onToggle(nowChecked);
      });
      div.querySelector('.delete-item-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        onDelete();
      });
    }
    return div;
  };

  const makeSection = (session, defItems, title, iconSVG) => {
    const sec = document.createElement('div');
    sec.className = `routine-section ${session}`;
    sec.innerHTML = `<div class="routine-title">${iconSVG} ${title}</div>`;

    // Default items
    defItems.forEach(item => {
      const row     = getRow(session, item);
      const checked = row ? row.is_checked : false;
      sec.appendChild(makeCheckItem(item, checked, async (val) => {
        await upsertRoutine(currentPopupDs, session, item, val);
      }, null));
    });

    // Custom items (item_name tidak ada di defItems)
    const customRows = _popupRows.filter(r =>
      r.session === session && !defItems.includes(r.item_name)
    );
    customRows.forEach(r => {
      sec.appendChild(makeCheckItem(r.item_name, r.is_checked, async (val) => {
        await upsertRoutine(currentPopupDs, session, r.item_name, val);
      }, async () => {
        await deleteRoutineItem(r.id);
        renderPopupBody();
      }));
    });

    // Add custom item input
    if (!locked) {
      const addRow  = document.createElement('div');
      addRow.className = 'add-item-row';
      const inputId = `addCustom_${session}`;
      addRow.innerHTML = `
        <input class="add-item-input" id="${inputId}" placeholder="Tambah item...">
        <button class="add-item-btn">+</button>
      `;
      addRow.querySelector('button').addEventListener('click', async () => {
        const val = document.getElementById(inputId)?.value.trim();
        if (!val) return;
        await upsertRoutine(currentPopupDs, session, val, false);
        renderPopupBody();
        showToast('Item ditambahkan');
      });
      addRow.querySelector('input').addEventListener('keydown', e => {
        if (e.key === 'Enter') addRow.querySelector('button').click();
      });
      sec.appendChild(addRow);
    }
    return sec;
  };

  body.innerHTML = '';

  const sunIcon  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>`;
  const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  body.appendChild(makeSection('morning', morDef, '☀️ Pagi',   sunIcon));
  body.appendChild(makeSection('night',   ngtDef, '🌙 Malam', moonIcon));

  // Treatments
  if (treats.length > 0) {
    const treatSec = document.createElement('div');
    treatSec.className = 'routine-section';
    treatSec.style.borderLeft = '4px solid var(--coral)';
    treatSec.innerHTML = `<div class="routine-title">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg> Treatment Malam
    </div>`;
    treats.forEach(t => {
      const row     = getRow('night', `[treatment] ${t.name}`);
      const checked = row ? row.is_checked : false;
      treatSec.appendChild(makeCheckItem(t.name, checked, async (val) => {
        await upsertRoutine(currentPopupDs, 'night', `[treatment] ${t.name}`, val);
      }, null, 'treatment'));
    });
    body.appendChild(treatSec);
  }

  // Catatan — simpan via API (note di row morning pertama)
  const noteRow  = _popupRows.find(r => r.note);
  const savedNote = noteRow?.note || '';
  const noteArea  = document.createElement('div');
  noteArea.className = 'popup-note-area';
  noteArea.innerHTML = `
    <div class="popup-note-label">📝 Catatan hari ini</div>
    <textarea class="popup-note-textarea" id="dayNote"
      placeholder="Tulis catatan, reaksi kulit, dll..."
      ${locked ? 'disabled' : ''}>${savedNote}</textarea>
  `;
  let noteTimer;
  noteArea.querySelector('textarea').addEventListener('input', async e => {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(async () => {
      // Simpan note ke rutinitas morning Cleanser (item pertama)
      const firstItem = load(KEY.morningDef, DEFAULT_MORNING)[0] || 'Cleanser';
      await apiFetch('/routines', {
        method: 'POST',
        body: JSON.stringify({
          date: currentPopupDs,
          session: 'morning',
          item_name: firstItem,
          is_checked: getRow('morning', firstItem)?.is_checked || false,
          note: e.target.value,
        }),
      });
    }, 800);
  });
  body.appendChild(noteArea);
}