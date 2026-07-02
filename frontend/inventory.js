/* ============================================
   DEAR SKIN — inventory.js
   Product CRUD via API
   ============================================ */

// Cache produk supaya tidak re-fetch berkali-kali
let _productsCache = null;

async function fetchProducts() {
  _productsCache = await apiFetch('/products');
  return _productsCache;
}

function openAddProduct() {
  const sel = document.getElementById('prodCat');
  sel.innerHTML = '';
  getCategories().forEach(c => {
    const opt = document.createElement('option');
    opt.value       = c.key;
    opt.textContent = c.label;
    sel.appendChild(opt);
  });
  document.getElementById('prodName').value = '';
  document.getElementById('prodNote').value = '';
  document.getElementById('addProductModal').classList.add('open');
}
function closeAddProduct() {
  document.getElementById('addProductModal').classList.remove('open');
}

async function saveProduct() {
  const name = document.getElementById('prodName').value.trim();
  if (!name) { showToast('Nama produk wajib diisi'); return; }

  const category = document.getElementById('prodCat').value;
  const note     = document.getElementById('prodNote').value.trim();

  await apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify({ name, category, note }),
  });

  _productsCache = null; // reset cache
  closeAddProduct();
  renderInventory();
  showToast('Produk ditambahkan ✨');
}

async function deleteProduct(id) {
  await apiFetch(`/products/${id}`, { method: 'DELETE' });
  _productsCache = null;
  renderInventory();
  showToast('Produk dihapus');
}

// ===== RENDER =====
async function renderInventory() {
  const container = document.getElementById('invCategories');
  if (!container) return;

  // Loading state
  container.innerHTML = `
    <div style="text-align:center;padding:48px;color:var(--brown-light);font-family:var(--font-hand);font-size:1rem">
      Memuat produk...
    </div>`;

  let products;
  try {
    products = await fetchProducts();
  } catch {
    container.innerHTML = `
      <div style="text-align:center;padding:48px;color:var(--coral);font-family:var(--font-hand);font-size:1rem">
        Gagal memuat produk. Pastikan backend berjalan.
      </div>`;
    return;
  }

  const cats    = getCategories();
  const colors  = getCustomCatColors();
  const catColorMap = {};
  cats.forEach((c, i) => {
    catColorMap[c.key] = colors[c.key] || PASTEL_POOL[i % PASTEL_POOL.length];
  });

  container.innerHTML = '';

  // Group by category
  cats.forEach(cat => {
    const catProds = products.filter(p => p.category === cat.key);
    if (catProds.length === 0) return;

    const section = document.createElement('div');
    section.className = 'inv-category-section fade-in-up';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'inv-category-label';
    labelDiv.innerHTML = `
      <div class="inv-cat-badge" style="background:${catColorMap[cat.key]}">
        ${cat.label}
      </div>
      <span class="inv-cat-count">${catProds.length} produk</span>
      <div class="inv-cat-line"></div>
    `;
    section.appendChild(labelDiv);

    const grid = document.createElement('div');
    grid.className = 'inv-product-grid';

    catProds.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-card-color" style="background:${catColorMap[cat.key]}"></div>
        <div class="product-card-name">${escHtml(p.name)}</div>
        ${p.note ? `<div class="product-card-note">${escHtml(p.note)}</div>` : ''}
        <div class="product-card-actions">
          <button class="btn-icon" title="Hapus" onclick="deleteProduct(${p.id})">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      `;
      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });

  // Produk tanpa kategori yang dikenal
  const unknownProds = products.filter(p => !cats.find(c => c.key === p.category));
  if (unknownProds.length > 0) {
    const section = document.createElement('div');
    section.className = 'inv-category-section fade-in-up';
    section.innerHTML = `
      <div class="inv-category-label">
        <div class="inv-cat-badge">Lainnya</div>
        <span class="inv-cat-count">${unknownProds.length} produk</span>
        <div class="inv-cat-line"></div>
      </div>
      <div class="inv-product-grid">
        ${unknownProds.map(p => `
          <div class="product-card">
            <div class="product-card-color" style="background:#DDD"></div>
            <div class="product-card-name">${escHtml(p.name)}</div>
            ${p.note ? `<div class="product-card-note">${escHtml(p.note)}</div>` : ''}
            <div class="product-card-actions">
              <button class="btn-icon" title="Hapus" onclick="deleteProduct(${p.id})">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </div>`).join('')}
      </div>`;
    container.appendChild(section);
  }

  // Empty state
  if (products.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--brown-light)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             style="width:48px;height:48px;margin-bottom:12px;opacity:0.4">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <div style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;margin-bottom:6px">
          Belum ada produk
        </div>
        <div style="font-family:var(--font-hand);font-size:0.95rem">
          Tambah produk skincaremupertama!
        </div>
      </div>`;
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}