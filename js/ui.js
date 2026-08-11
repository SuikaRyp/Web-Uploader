// ============================================================
//  UI LAYER — navigation, rendering, dashboard/gallery/settings, utils
// ============================================================


function toggleDropdown(e, id, url, name, histIdx) {
  e.stopPropagation();
  // close all open dropdowns first
  document.querySelectorAll('.dropdown-menu').forEach(d => {
    if (d.id !== id) d.style.display = 'none';
  });
  const dd = document.getElementById(id);
  if (!dd) return;
  if (dd.style.display === 'block') { dd.style.display = 'none'; return; }
  dd.innerHTML = `
    <div class="dropdown-item" onclick="copyLink('${url}',this);closeDropdowns()">📋 Copy Link</div>
    <div class="dropdown-item" onclick="window.open('${url}','_blank');closeDropdowns()">↗ Open</div>
    <div class="dropdown-item" onclick="dlFile('${url}','${name}');closeDropdowns()">⬇️ Download</div>
    <div class="dropdown-item danger" onclick="deleteHistory(${histIdx})">🗑 Delete</div>`;
  dd.style.display = 'block';
}
function closeDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(d => d.style.display = 'none');
}
document.addEventListener('click', closeDropdowns);

const BOTTOM_NAV_GROUPS = {
  dashboard: 'bn-beranda',
  tools:     'bn-tools',
  upload:    'bn-tools',
  tiktok:    'bn-tools',
  instagram: 'bn-tools',
  gallery:   'bn-log',
  settings:  'bn-info',
};

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navEl = document.querySelector(`.nav-item[onclick="navigate('${page}')"]`);
  if (navEl) navEl.classList.add('active');

  document.querySelectorAll('.bn-item').forEach(n => n.classList.remove('active'));
  const bnId = BOTTOM_NAV_GROUPS[page];
  if (bnId) {
    const bnEl = document.getElementById(bnId);
    if (bnEl) bnEl.classList.add('active');
  }

  if (page === 'gallery')   loadGallery();
  if (page === 'settings')  { loadSettings(); refreshStats(); }
}

// ============================================================
//  DRAG AND DROP
// ============================================================

const dz = document.getElementById('drop-zone');
dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('drag'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
dz.addEventListener('drop',      e => { e.preventDefault(); dz.classList.remove('drag'); handleFiles(e.dataTransfer.files); });

function handleFiles(files) {
  if (!files.length) return;
  Array.from(files).forEach(f => {
    if (!queue.find(q => q.file.name === f.name && q.file.size === f.size)) {
      queue.push({ file: f, id: Math.random().toString(36).slice(2), status: 'ready', progress: 0 });
    }
  });
  renderQueue();
}


function renderQueue() {
  const card = document.getElementById('queue-card');
  const list = document.getElementById('queue-list');
  const sub  = document.getElementById('queue-sub');
  if (!queue.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  sub.textContent = `${queue.length} file${queue.length > 1 ? 's' : ''} ready`;
  list.innerHTML = queue.map(q => {
    const icon   = fileIcon(q.file.type);
    const isImg  = q.file.type.startsWith('image/');
    const isVid  = q.file.type.startsWith('video/');
    const isAud  = q.file.type.startsWith('audio/');
    const thumbHtml = isImg
      ? `<div class="q-thumb"><img id="thumb-${q.id}" /></div>`
      : isVid
      ? `<div class="q-thumb" style="background:#000;display:flex;align-items:center;justify-content:center;font-size:24px">🎬</div>`
      : isAud
      ? `<div class="q-thumb" style="display:flex;align-items:center;justify-content:center;font-size:24px">🎵</div>`
      : `<div class="q-thumb">${icon}</div>`;
    const clr    = { ready: 'var(--muted)', uploading: 'var(--lavender)', done: 'var(--success)', error: 'var(--error)' };
    const labels = { ready: '⏳ Ready', uploading: '⬆️ ...', done: '✅ Done', error: '❌ Error' };
    const shortUrl = q.rawUrl ? (q.rawUrl.split('/').pop() || q.rawUrl) : '';
    const linkBoxHtml = q.rawUrl
      ? `<div class="ql-box" id="ql-${q.id}" style="display:flex"><span class="ql-url" title="${q.rawUrl}">📎 ${shortUrl}</span><button class="ql-copy" onclick="copyLink('${q.rawUrl}',this)">📋</button><a class="ql-open" href="${q.rawUrl}" target="_blank">↗</a></div>`
      : `<div class="ql-box" id="ql-${q.id}" style="display:none"></div>`;
    return `<div class="queue-item" id="qi-${q.id}" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;align-items:center;gap:14px">
        ${thumbHtml}
        <div class="q-info">
          <div class="q-name">${q.file.name}</div>
          <div class="q-size">${fmtSize(q.file.size)}</div>
          <div class="q-progress-wrap"><div class="q-progress" id="qp-${q.id}" style="width:${q.progress}%"></div></div>
        </div>
        <div class="q-status" id="qs-${q.id}" style="color:${clr[q.status]}">${labels[q.status]}</div>
        <button class="q-remove" onclick="removeQueue('${q.id}')">✕</button>
      </div>
      ${linkBoxHtml}
      <div id="qmedia-${q.id}"></div>
    </div>`;
  }).join('');

  queue.forEach(q => {
    if (q.file.type.startsWith('image/')) {
      const el = document.getElementById('thumb-' + q.id);
      if (el) { const r = new FileReader(); r.onload = e => el.src = e.target.result; r.readAsDataURL(q.file); }
    }
  });
}


function removeQueue(id) { queue = queue.filter(q => q.id !== id); renderQueue(); }
function clearQueue()    { queue = []; renderQueue(); }

function updateQueueItem(item) {
  const el      = document.getElementById('qs-' + item.id);
  const pb      = document.getElementById('qp-' + item.id);
  const linkBox = document.getElementById('ql-' + item.id);
  const mediaEl = document.getElementById('qmedia-' + item.id);
  if (!el) return;
  const labels = { ready: '⏳ Ready', uploading: '⬆️ Uploading', done: '✅ Done', error: '❌ Error' };
  const clrs   = { ready: 'var(--muted)', uploading: 'var(--lavender)', done: 'var(--success)', error: 'var(--error)' };
  el.textContent  = labels[item.status];
  el.style.color  = clrs[item.status];
  if (pb) pb.style.width = item.progress + '%';
  if (item.status === 'done' && item.rawUrl && linkBox) {
    const shortUrl = item.rawUrl.split('/').pop() || item.rawUrl;
    linkBox.style.display = 'flex';
    linkBox.innerHTML = `
      <span class="ql-url" title="${item.rawUrl}">📎 ${shortUrl}</span>
      <button class="ql-copy" onclick="copyLink('${item.rawUrl}',this)">📋</button>
      <a class="ql-open" href="${item.rawUrl}" target="_blank">↗</a>`;

    // tampilkan video/audio player
    if (mediaEl) {
      const isVid = item.file.type.startsWith('video/');
      const isAud = item.file.type.startsWith('audio/');
      if (isVid) {
        mediaEl.innerHTML = `
          <div style="margin-top:12px;border-radius:12px;overflow:hidden;background:#000">
            <video controls style="width:100%;max-height:280px;display:block" preload="metadata">
              <source src="${item.rawUrl}" type="${item.file.type}">
            </video>
          </div>`;
      } else if (isAud) {
        mediaEl.innerHTML = `
          <div style="margin-top:12px;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;gap:12px">
            <div style="font-size:28px">🎵</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.file.name}</div>
              <audio controls style="width:100%;height:36px">
                <source src="${item.rawUrl}" type="${item.file.type}">
              </audio>
            </div>
          </div>`;
      }
    }
  }
}


function copyLink(url, btn) {
  navigator.clipboard.writeText(url).then(() => {
    btn.textContent = '✅';
    setTimeout(() => btn.textContent = '📋', 2000);
    toast('Link copied!', 'success');
  });
}

// ============================================================
//  DASHBOARD

function refreshStats() {
  const imgs = uploadHistory.filter(f => f.type.startsWith('image/')).length;
  const vids = uploadHistory.filter(f => f.type.startsWith('video/')).length;
  const auds = uploadHistory.filter(f => f.type.startsWith('audio/')).length;
  document.getElementById('stat-total').textContent = uploadHistory.length;
  document.getElementById('stat-img').textContent   = imgs;
  document.getElementById('stat-vid').textContent   = vids;
  document.getElementById('stat-aud').textContent   = auds;
  renderRecentList();
  renderChart();
  updateConnectionStatus();
}


function renderRecentList() {
  const list = document.getElementById('recent-list');
  if (!uploadHistory.length) {
    list.innerHTML = '<div class="empty-state"><div class="em">📭</div>No uploads yet.</div>';
    return;
  }
  list.innerHTML = uploadHistory.slice(0, 10).map((f, i) => {
    const icon    = fileIcon(f.type);
    const date    = new Date(f.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const isMedia = f.type.startsWith('video/') || f.type.startsWith('audio/');
    const clickFn = isMedia
      ? `openMediaModal('${f.url}','${f.name.replace(/'/g,"\\'")}','${f.type}')`
      : `window.open('${f.url}','_blank')`;
    return `<div class="file-item" onclick="${clickFn}">
      <div class="file-thumb">${icon}</div>
      <div class="file-info">
        <div class="file-name">${f.name}</div>
        <div class="file-meta">${fmtSize(f.size)} · ${date}</div>
      </div>
      <span class="file-status status-ok">✓ Live</span>
      <button class="dot-btn" onclick="event.stopPropagation();toggleDropdown(event,'dd-r-${i}','${f.url}','${f.name}',${i})">⋯</button>
      <div class="dropdown-menu" id="dd-r-${i}" style="display:none"></div>
    </div>`;
  }).join('');
}

// ============================================================
//  GALLERY
// ============================================================

function loadGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!uploadHistory.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="em">🖼️</div>No files yet.</div>';
    return;
  }
  grid.innerHTML = uploadHistory.map((f, i) => {
    const isImg  = f.type.startsWith('image/');
    const isVid  = f.type.startsWith('video/');
    const isAud  = f.type.startsWith('audio/');
    const icon   = fileIcon(f.type);
    const thumb  = isImg
      ? `<img src="${f.url}" style="width:100%;height:120px;object-fit:cover;border-radius:10px 10px 0 0" loading="lazy" onerror="this.style.display='none'">`
      : isVid
      ? `<div style="height:120px;display:flex;align-items:center;justify-content:center;font-size:36px;background:rgba(124,58,237,0.08);border-radius:10px 10px 0 0;position:relative">🎬<span style="position:absolute;bottom:6px;right:8px;font-size:10px;background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:4px;color:#fff">▶ Play</span></div>`
      : isAud
      ? `<div style="height:120px;display:flex;align-items:center;justify-content:center;font-size:36px;background:rgba(124,58,237,0.08);border-radius:10px 10px 0 0;position:relative">🎵<span style="position:absolute;bottom:6px;right:8px;font-size:10px;background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:4px;color:#fff">▶ Play</span></div>`
      : `<div style="height:120px;display:flex;align-items:center;justify-content:center;font-size:36px;background:rgba(124,58,237,0.08);border-radius:10px 10px 0 0">${icon}</div>`;
    const clickFn = (isVid || isAud)
      ? `openMediaModal('${f.url}','${f.name.replace(/'/g,"\\'")}','${f.type}')`
      : `window.open('${f.url}','_blank')`;
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:all 0.2s;position:relative"
      onmouseover="this.style.transform='translateY(-3px)';this.style.borderColor='rgba(124,58,237,0.4)'"
      onmouseout="this.style.transform='';this.style.borderColor='var(--border)'"
      onclick="${clickFn}">
      ${thumb}
      <div style="padding:10px 12px">
        <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:3px">${fmtSize(f.size)}</div>
      </div>
      <button class="dot-btn" style="position:absolute;top:6px;right:6px;background:rgba(10,10,15,0.7);backdrop-filter:blur(4px)"
        onclick="event.stopPropagation();toggleDropdown(event,'dd-g-${i}','${f.url}','${f.name}',${i})">⋯</button>
      <div class="dropdown-menu" id="dd-g-${i}" style="display:none;top:34px;right:6px"></div>
    </div>`;
  }).join('');
}


function openMediaModal(url, name, type) {
  // tutup modal lama kalau ada
  const old = document.getElementById('media-modal-overlay');
  if (old) old.remove();

  const isVid = type.startsWith('video/');
  const mediaEl = isVid
    ? `<video controls autoplay style="width:100%;max-height:320px;display:block;background:#000">
        <source src="${url}" type="${type}">
       </video>`
    : `<div style="padding:20px 16px;display:flex;align-items:center;gap:14px">
        <div style="font-size:40px">🎵</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
          <audio controls autoplay style="width:100%">
            <source src="${url}" type="${type}">
          </audio>
        </div>
       </div>`;

  const overlay = document.createElement('div');
  overlay.id = 'media-modal-overlay';
  overlay.className = 'media-modal-overlay';
  overlay.innerHTML = `
    <div class="media-modal">
      <div class="media-modal-header">
        <div class="media-modal-title">${name}</div>
        <button class="media-modal-close" onclick="closeMediaModal()">✕</button>
      </div>
      <div class="media-modal-body">${mediaEl}</div>
      <div class="media-modal-footer">
        <button class="tt-dl-btn primary" style="flex:1;justify-content:center" onclick="forceDownload('${url}','${name}')">⬇️ Download</button>
        <button class="tt-dl-btn ghost" onclick="copyLink('${url}',this)">📋 Copy Link</button>
        <a class="tt-dl-btn ghost" href="${url}" target="_blank">↗ Open</a>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeMediaModal(); });
  document.body.appendChild(overlay);
}

function closeMediaModal() {
  const overlay = document.getElementById('media-modal-overlay');
  if (!overlay) return;
  // stop media sebelum hapus
  overlay.querySelectorAll('video, audio').forEach(el => { el.pause(); el.src = ''; });
  overlay.remove();
}

// close modal on Escape
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMediaModal(); });


function renderChart() {
  const bars   = document.getElementById('chart-bars');
  const days   = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
  const counts = new Array(7).fill(0);
  const now    = new Date();
  uploadHistory.forEach(f => {
    const diff = Math.floor((now - new Date(f.date)) / 86400000);
    if (diff < 7) counts[6 - diff]++;
  });
  const max = Math.max(...counts, 1);
  bars.innerHTML = days.map((d, i) => {
    const h = Math.round((counts[i] / max) * 72) + 4;
    return `<div class="bar-wrap"><div class="bar" style="height:${h}px"></div><div class="bar-label">${d}</div></div>`;
  }).join('');
}


function updateConnectionStatus() {
  const ok = isConfigured();
  const dot    = document.getElementById('sidebar-dot');
  const status = document.getElementById('sidebar-status');
  if (dot)    { dot.style.color    = ok ? 'var(--success)' : 'var(--muted)'; }
  if (status) { status.textContent = ok ? 'Connected' : 'Not connected'; status.style.color = ok ? 'var(--success)' : 'var(--muted)'; }

  const el = document.getElementById('repo-info');
  if (!el) return;
  if (ok) {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;font-size:13px">
        <span style="width:10px;height:10px;border-radius:50%;background:var(--success);box-shadow:0 0 6px var(--success);display:inline-block;flex-shrink:0"></span>
        <span style="color:var(--success);font-weight:600">Connected</span>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:8px">
        Repo: <b style="color:var(--text)">${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}</b><br>
        Branch: <b style="color:var(--text)">${GITHUB_CONFIG.branch}</b> · Folder: <b style="color:var(--text)">${GITHUB_CONFIG.folder}</b>
      </div>`;
  } else {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;font-size:13px">
        <span style="width:10px;height:10px;border-radius:50%;background:var(--muted);display:inline-block;flex-shrink:0"></span>
        <span style="color:var(--muted);font-weight:600">Not connected</span>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:8px">Edit <code style="color:var(--lavender)">GITHUB_CONFIG</code> di source code.</div>`;
  }
}

// ============================================================
//  SETTINGS (hanya bg & cosmetics, bukan GitHub config)
// ============================================================

function loadSettings() {
  const bg = localStorage.getItem('suika_bg') || '';
  document.getElementById('bg-url-input').value = bg;
  if (bg) {
    document.getElementById('bg-preview').style.backgroundImage = `url(${bg})`;
    document.getElementById('bg-preview').innerHTML = '';
  }
  const title = localStorage.getItem('suika_title') || 'SuikaUploader';
  document.getElementById('app-title-input').value = title;
}

function previewBg() {
  const url = document.getElementById('bg-url-input').value.trim();
  if (!url) return toast('Enter a URL first', 'error');
  document.getElementById('bg-preview').style.backgroundImage = `url(${url})`;
  document.getElementById('bg-preview').innerHTML = '';
}
function applyBg() {
  const url = document.getElementById('bg-url-input').value.trim();
  localStorage.setItem('suika_bg', url);
  document.getElementById('bg-layer').style.backgroundImage = url ? `url(${url})` : '';
  previewBg();
  toast('Background applied!', 'success');
}
function clearBg() {
  localStorage.removeItem('suika_bg');
  document.getElementById('bg-url-input').value = '';
  document.getElementById('bg-layer').style.backgroundImage = '';
  document.getElementById('bg-preview').style.backgroundImage = '';
  document.getElementById('bg-preview').innerHTML = '<span>No background set</span>';
  toast('Background cleared', 'info');
}
function applyOverlay() {
  localStorage.setItem('suika_overlay', document.getElementById('overlay-input').value || 0.88);
  toast('Overlay updated', 'success');
}
function applyAppTitle() {
  const t = document.getElementById('app-title-input').value.trim() || 'SuikaUploader';
  document.title = t + ' — Media Hub';
  localStorage.setItem('suika_title', t);
  toast('Title updated!', 'success');
}
function clearAllData() {
  if (!confirm('Reset semua data? Ini menghapus history upload.')) return;
  localStorage.clear();
  uploadHistory = [];
  queue = [];
  toast('All data cleared', 'info');
  refreshStats();
}

// ============================================================
//  UTILITIES
// ============================================================

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}
function fileIcon(type) {
  if (!type) return '📄';
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  return '📄';
}
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className   = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ============================================================
//  INIT
// ============================================================

(function init() {
  const bg = localStorage.getItem('suika_bg');
  if (bg) document.getElementById('bg-layer').style.backgroundImage = `url(${bg})`;
  const title = localStorage.getItem('suika_title');
  if (title) document.title = title + ' — Media Hub';
  refreshStats();
})();

