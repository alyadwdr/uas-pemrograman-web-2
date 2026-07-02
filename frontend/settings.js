/* ============================================
   DEAR SKIN — settings.js
   Treatment scheduler, default routines,
   category management (no notifications)
   ============================================ */

// ===== TREATMENT SCHEDULER =====
function updateTreatFields() {
  const type = document.getElementById('treatType').value;
  document.getElementById('intervalField').style.display = type === 'interval' ? '' : 'none';
  document.getElementById('daysField').style.display     = type === 'days'     ? '' : 'none';
}

function addTreatment() {
  const name = document.getElementById('treatName').value.trim();
  if (!name) { showToast('Nama treatment wajib diisi'); return; }

  const type      = document.getElementById('treatType').value;
  const color     = document.getElementById('treatColor').value;
  const startDate = document.getElementById('treatStartDate').value;

  const t = { id: Date.now().toString(), name, type, color, startDate };
  if (type === 'interval') {
    t.interval = parseInt(document.getElementById('treatInterval').value) || 3;
  } else {
    t.days = Array.from(document.getElementById('treatDays').selectedOptions).map(o => parseInt(o.value));
    if (t.days.length === 0) { showToast('Pilih minimal 1 hari'); return; }
  }

  const treats = getTreatments();
  treats.push(t);
  saveTreatments(treats);
  renderTreatments();
  renderCalendar();

  document.getElementById('treatName').value = '';
  showToast('Treatment dijadwalkan');
}

function deleteTreatment(id) {
  saveTreatments(getTreatments().filter(t => t.id !== id));
  renderTreatments();
  renderCalendar();
  showToast('Treatment dihapus');
}

function updateTreatColor(id, color) {
  const treats = getTreatments().map(t => t.id === id ? { ...t, color } : t);
  saveTreatments(treats);
  renderCalendar();
}

function renderTreatments() {
  const list   = document.getElementById('treatmentList');
  if (!list) return;
  const treats = getTreatments();

  if (treats.length === 0) {
    list.innerHTML = `<div style="color:var(--brown-light);font-style:italic;font-size:0.85rem;text-align:center;padding:12px 0">
      Belum ada treatment terjadwal
    </div>`;
    return;
  }

  list.innerHTML = treats.map(t => {
    const desc     = t.type === 'interval'
      ? `Tiap ${t.interval} hari`
      : (t.days || []).map(d => ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][d]).join(', ');
    const startTxt = t.startDate ? ` · Mulai ${t.startDate}` : '';
    return `
      <div class="treatment-tag">
        <div>
          <div style="display:flex;align-items:center;gap:7px">
            <div style="width:12px;height:12px;border-radius:50%;background:${t.color||'#C084FC'};flex-shrink:0;border:2px solid rgba(61,43,31,0.15)"></div>
            <div class="treatment-tag-name">${t.name}</div>
          </div>
          <div class="treatment-tag-desc">${desc}${startTxt} · Malam hari</div>
        </div>
        <div class="treatment-tag-actions">
          <input type="color" value="${t.color||'#C084FC'}" class="color-swatch-btn"
            onchange="updateTreatColor('${t.id}', this.value)">
          <button class="btn-icon" onclick="deleteTreatment('${t.id}')" title="Hapus">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>`;
  }).join('');
}

// ===== DEFAULT ROUTINES =====
function renderDefaultRoutines() {
  renderDefList('morning');
  renderDefList('night');
}

function renderDefList(session) {
  const elId  = session === 'morning' ? 'defaultMorningList' : 'defaultNightList';
  const el    = document.getElementById(elId);
  if (!el) return;
  const key   = session === 'morning' ? KEY.morningDef : KEY.nightDef;
  const def   = session === 'morning' ? DEFAULT_MORNING : DEFAULT_NIGHT;
  const items = load(key, def);
  const addId = session === 'morning' ? 'addDefMor' : 'addDefNgt';

  el.innerHTML = items.map((item, i) => `
    <div class="check-item" style="cursor:default">
      <div style="width:20px;height:20px;border:2px solid var(--brown-light);border-radius:5px;flex-shrink:0;background:white"></div>
      <span class="check-label" style="text-decoration:none;opacity:1;color:var(--brown)">${item}</span>
      <button class="delete-item-btn" style="opacity:1" onclick="removeDefaultItem('${session}', ${i})" title="Hapus">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('') + `
    <div class="add-item-row" style="margin-top:10px">
      <input class="add-item-input" id="${addId}" placeholder="Tambah item...">
      <button class="add-item-btn" onclick="addDefaultItem('${session}')">+</button>
    </div>
  `;

  const input = document.getElementById(addId);
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') addDefaultItem(session);
    });
  }
}

function addDefaultItem(session) {
  const id  = session === 'morning' ? 'addDefMor' : 'addDefNgt';
  const val = document.getElementById(id)?.value.trim();
  if (!val) return;
  const key = session === 'morning' ? KEY.morningDef : KEY.nightDef;
  const def = session === 'morning' ? DEFAULT_MORNING : DEFAULT_NIGHT;
  const items = load(key, def);
  items.push(val);
  save(key, items);
  applyDefaultRoutinesToAll();
  renderDefList(session);
  showToast('Item ditambahkan ke semua tanggal');
}

function removeDefaultItem(session, idx) {
  const key   = session === 'morning' ? KEY.morningDef : KEY.nightDef;
  const def   = session === 'morning' ? DEFAULT_MORNING : DEFAULT_NIGHT;
  const items = load(key, def);
  items.splice(idx, 1);
  save(key, items);
  applyDefaultRoutinesToAll();
  renderDefList(session);
  showToast('Item dihapus dari semua tanggal');
}

// ===== CATEGORY MANAGEMENT =====
function addCategory() {
  const name = document.getElementById('newCatName').value.trim();
  if (!name) { showToast('Nama kategori wajib diisi'); return; }
  const key  = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const cats = getCategories();
  if (cats.find(c => c.key === key)) { showToast('Kategori sudah ada'); return; }
  cats.push({ key, label: name });
  saveCategories(cats);
  renderCategoryList();
  document.getElementById('newCatName').value = '';
  showToast('Kategori ditambahkan');
}

function deleteCategory(key) {
  const cats     = getCategories().filter(c => c.key !== key);
  const products = getProducts().filter(p => p.cat !== key);
  saveCategories(cats);
  saveProducts(products);
  renderCategoryList();
  showToast('Kategori dihapus');
}

function renderCategoryList() {
  const el   = document.getElementById('categoryList');
  if (!el) return;
  const cats = getCategories();

  el.innerHTML = cats.map(c => `
    <div class="cat-tag">
      ${c.label}
      <button class="cat-tag-remove" onclick="deleteCategory('${c.key}')" title="Hapus">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');
}
