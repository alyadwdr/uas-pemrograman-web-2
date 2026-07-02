/* ============================================
   DEAR SKIN — calendar.js
   Calendar rendering, popup, checklist logic
   ============================================ */

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];
const DAYS_ID   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

const todayDate    = new Date();
let   currentYear  = todayDate.getFullYear();
let   currentMonth = todayDate.getMonth();
let   currentPopupDs = null;

function ds(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ===== TREATMENTS FOR DATE =====
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
      const ref = t.startDate ? new Date(t.startDate) : new Date(2024, 0, 1);
      ref.setHours(0,0,0,0);
      const diff = Math.round((date - ref) / 86400000);
      return diff >= 0 && diff % t.interval === 0;
    }
    return false;
  });
}

// ===== CALENDAR RENDER =====
function renderCalendar(direction) {
  const grid  = document.getElementById('calGrid');
  const label = document.getElementById('monthLabel');
  const stat  = document.getElementById('doneNum');
  if (!grid) return;

  label.textContent = `${MONTHS_ID[currentMonth]} ${currentYear}`;

  // Slide animation
  if (direction) {
    const outClass = direction === 'left' ? 'slide-left-out' : 'slide-right-out';
    const inClass  = direction === 'left' ? 'slide-left-in'  : 'slide-right-in';
    grid.classList.add(outClass);
    setTimeout(() => {
      grid.classList.remove(outClass);
      grid.classList.add(inClass);
      buildCalendarCells(grid);
      requestAnimationFrame(() => {
        grid.classList.remove(inClass);
      });
    }, 280);
  } else {
    buildCalendarCells(grid);
  }

  // Stat: count full-routine days this month
  let fullDays = 0;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const key  = ds(currentYear, currentMonth, d);
    const data = getChecks()[key];
    if (!data) continue;
    const morItems   = load(KEY.morningDef, DEFAULT_MORNING);
    const ngtItems   = load(KEY.nightDef,   DEFAULT_NIGHT);
    const morDone    = morItems.every(i => data.morning && data.morning[i]);
    const ngtDone    = ngtItems.every(i => data.night   && data.night[i]);
    const custMorDone = (data.customMorning||[]).every((_,i) =>
      (data.checkedCustomMorning||[]).includes(i));
    const custNgtDone = (data.customNight||[]).every((_,i) =>
      (data.checkedCustomNight||[]).includes(i));
    if (morDone && ngtDone && custMorDone && custNgtDone) fullDays++;
  }
  if (stat) stat.textContent = fullDays;

  // Treatment legend
  renderTreatLegend();
}

function buildCalendarCells(grid) {
  // Remove existing day cells (keep DOW headers)
  const headers = Array.from(grid.querySelectorAll('.cal-dow'));
  grid.innerHTML = '';
  headers.forEach(h => grid.appendChild(h));

  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today       = todayDate;
  const locks       = getLocks();

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dsKey  = ds(currentYear, currentMonth, d);
    const isToday = (d === today.getDate() &&
                     currentMonth === today.getMonth() &&
                     currentYear  === today.getFullYear());
    const isFuture = new Date(currentYear, currentMonth, d) > today;
    const isLocked = locks[dsKey];

    const cell = document.createElement('div');
    cell.className = 'cal-day' +
      (isToday  ? ' today'  : '') +
      (isLocked ? ' locked' : '');

    // Progress
    const data    = getChecks()[dsKey];
    let progress  = 0;
    let isComplete = false;
    if (data) {
      const morItems = load(KEY.morningDef, DEFAULT_MORNING);
      const ngtItems = load(KEY.nightDef,   DEFAULT_NIGHT);
      const total    = morItems.length + ngtItems.length;
      const done     = morItems.filter(i => data.morning && data.morning[i]).length
                     + ngtItems.filter(i => data.night   && data.night[i]).length;
      progress   = total > 0 ? done / total : 0;
      isComplete = progress === 1;
    }

    // Treatments chips
    const treats    = treatmentsForDate(currentYear, currentMonth, d);
    const chipsHTML = treats.map(t =>
      `<div class="treat-chip" style="background:${t.color||'#C084FC'}" title="${t.name}"></div>`
    ).join('');

    // Lock icon SVG
    const lockSVG = `<div class="day-lock-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg></div>`;

    const dayNumHTML = isToday
      ? `<div class="day-num" style="background:var(--brown);color:var(--cream);width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.82rem">${d}</div>`
      : `<div class="day-num">${d}</div>`;

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
  const el     = document.getElementById('treatLegend');
  if (!el) return;
  const treats = getTreatments();

  const treatHTML = treats.map(t =>
    `<div class="legend-item">
      <div class="legend-dot" style="background:${t.color||'#C084FC'}"></div>
      ${t.name}
    </div>`
  ).join('');

  el.innerHTML = treatHTML + `
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

// ===== SWIPE SUPPORT =====
(function initSwipe() {
  let startX = 0;
  const wrapper = document.getElementById('calSwipeWrapper');
  if (!wrapper) return;
  wrapper.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  wrapper.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) changeMonth(diff > 0 ? 1 : -1);
  }, { passive: true });
})();

// ===== DAY POPUP =====
function openDayPopup(y, m, d) {
  currentPopupDs = ds(y, m, d);
  const dateObj  = new Date(y, m, d);
  document.getElementById('popupDateLabel').textContent =
    `${d} ${MONTHS_ID[m]} ${y}`;
  document.getElementById('popupDateSub').textContent =
    DAYS_ID[dateObj.getDay()];

  renderPopupBody();
  updateLockBtn();
  document.getElementById('dayOverlay').classList.add('open');
}

function closeDayPopup(e) {
  if (e.target === document.getElementById('dayOverlay')) closeDayPopupBtn();
}
function closeDayPopupBtn() {
  document.getElementById('dayOverlay').classList.remove('open');
  renderCalendar();
}

function updateLockBtn() {
  const locks  = getLocks();
  const locked = locks[currentPopupDs];
  const btn    = document.getElementById('popupLockBtn');
  const txt    = document.getElementById('lockBtnText');
  if (!btn) return;
  if (locked) {
    btn.classList.add('is-locked');
    txt.textContent = 'Terkunci';
  } else {
    btn.classList.remove('is-locked');
    txt.textContent = 'Kunci';
  }
}

function toggleDayLock() {
  const locks = getLocks();
  locks[currentPopupDs] = !locks[currentPopupDs];
  saveLocks(locks);
  updateLockBtn();
  renderPopupBody();
  showToast(locks[currentPopupDs] ? 'Hari ini dikunci' : 'Kunci dibuka');
}

function renderPopupBody() {
  const body   = document.getElementById('popupBody');
  const locked = getLocks()[currentPopupDs];
  const data   = getDayData(currentPopupDs);
  const morDef = load(KEY.morningDef, DEFAULT_MORNING);
  const ngtDef = load(KEY.nightDef,   DEFAULT_NIGHT);
  const treats = treatmentsForDate(...currentPopupDs.split('-').map(Number).map((v,i) => i===1 ? v-1 : v));

  const makeCheckItem = (label, checked, onChange, onDelete, extraClass='') => {
    const div = document.createElement('div');
    div.className = `check-item${checked ? ' checked' : ''}${extraClass ? ' '+extraClass : ''}`;
    div.innerHTML = `
      <div class="check-box"></div>
      <span class="check-label">${label}</span>
      ${!locked && onDelete ? `<button class="delete-item-btn" title="Hapus">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>` : ''}
    `;
    if (!locked) {
      div.querySelector('.check-box').addEventListener('click', () => {
        div.classList.toggle('checked');
        div.classList.add('just-checked');
        setTimeout(() => div.classList.remove('just-checked'), 300);
        onChange(!div.classList.contains('checked') ? false : true);
      });
      if (onDelete) {
        div.querySelector('.delete-item-btn')?.addEventListener('click', e => {
          e.stopPropagation();
          onDelete();
        });
      }
    }
    return div;
  };

  const makeSection = (session, defItems, title, iconSVG) => {
    const sec = document.createElement('div');
    sec.className = `routine-section ${session}`;
    sec.innerHTML = `<div class="routine-title">${iconSVG} ${title}</div>`;

    defItems.forEach(item => {
      const checked = data[session] && data[session][item];
      sec.appendChild(makeCheckItem(item, checked, (val) => {
        if (!data[session]) data[session] = {};
        data[session][item] = val;
        saveDayData(currentPopupDs, data);
      }, null));
    });

    const customKey     = session === 'morning' ? 'customMorning'        : 'customNight';
    const checkedCustom = session === 'morning' ? 'checkedCustomMorning' : 'checkedCustomNight';
    (data[customKey] || []).forEach((item, idx) => {
      const checked = (data[checkedCustom] || []).includes(idx);
      sec.appendChild(makeCheckItem(item, checked, (val) => {
        let arr = data[checkedCustom] || [];
        arr     = val ? [...new Set([...arr, idx])] : arr.filter(i => i !== idx);
        data[checkedCustom] = arr;
        saveDayData(currentPopupDs, data);
      }, () => {
        data[customKey].splice(idx, 1);
        let arr = (data[checkedCustom] || []).filter(i => i !== idx).map(i => i > idx ? i-1 : i);
        data[checkedCustom] = arr;
        saveDayData(currentPopupDs, data);
        renderPopupBody();
      }));
    });

    if (!locked) {
      const addRow = document.createElement('div');
      addRow.className = 'add-item-row';
      const inputId = `addCustom_${session}`;
      addRow.innerHTML = `
        <input class="add-item-input" id="${inputId}" placeholder="Tambah item...">
        <button class="add-item-btn">+</button>
      `;
      addRow.querySelector('button').addEventListener('click', () => {
        const val = document.getElementById(inputId).value.trim();
        if (!val) return;
        if (!data[customKey]) data[customKey] = [];
        data[customKey].push(val);
        saveDayData(currentPopupDs, data);
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

  body.appendChild(makeSection('morning', morDef, '☀️ Pagi', sunIcon));
  body.appendChild(makeSection('night',   ngtDef, '🌙 Malam', moonIcon));

  // Treatments (read-only checkboxes)
  if (treats.length > 0) {
    const treatSec = document.createElement('div');
    treatSec.className = 'routine-section';
    treatSec.style.borderLeft = '4px solid var(--coral)';
    treatSec.innerHTML = `<div class="routine-title">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      Treatment Malam
    </div>`;

    const treatChecks = data.treatmentChecks || {};
    treats.forEach(t => {
      const checked = treatChecks[t.id] || false;
      const item    = makeCheckItem(t.name, checked, (val) => {
        if (!data.treatmentChecks) data.treatmentChecks = {};
        data.treatmentChecks[t.id] = val;
        saveDayData(currentPopupDs, data);
      }, null, 'treatment');
      treatSec.appendChild(item);
    });
    body.appendChild(treatSec);
  }

  // Notes
  const savedNote = (getNotes())[currentPopupDs] || '';
  const noteArea  = document.createElement('div');
  noteArea.className = 'popup-note-area';
  noteArea.innerHTML = `
    <div class="popup-note-label">📝 Catatan hari ini</div>
    <textarea class="popup-note-textarea" id="dayNote" placeholder="Tulis catatan, reaksi kulit, dll..."
      ${locked ? 'disabled' : ''}>${savedNote}</textarea>
  `;
  noteArea.querySelector('textarea').addEventListener('input', e => {
    const notes  = getNotes();
    notes[currentPopupDs] = e.target.value;
    saveNotes(notes);
  });
  body.appendChild(noteArea);
}
