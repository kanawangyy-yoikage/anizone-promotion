// ═══════════════════════════════════════════════════
//  🛡️ admin.js — AniZone 2026 (Revised)
//  Kelola komentar: hapus, search, stats, sorting
// ═══════════════════════════════════════════════════

import { initializeApp }  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, getDocs, deleteDoc, doc,
  query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { firebaseConfig, ADMIN_PASSWORD } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Helpers ──────────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg,#6c63ff,#a78bfa)',
  'linear-gradient(135deg,#00e5ff,#0ea5e9)',
  'linear-gradient(135deg,#ff6b6b,#ff4444)',
  'linear-gradient(135deg,#ffd700,#ff8c00)',
  'linear-gradient(135deg,#4ade80,#22c55e)',
  'linear-gradient(135deg,#f472b6,#ec4899)',
];

function getAvatarColor(n) {
  let h = 0;
  for (const c of (n || 'x')) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatDate(ts) {
  if (!ts || !ts.toMillis) return '—';
  return new Date(ts.toMillis()).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function sanitize(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

function showToast(msg, type = 'info') {
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${{ success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[type] || 'ℹ️'}</span><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 320);
  }, 3000);
}

// ── Skeleton ──────────────────────────────────────────
function showAdminSkeletons(count = 5) {
  const el = document.getElementById('adminCommentsList');
  el.innerHTML = Array(count).fill(0).map(() => `
    <div class="admin-comment-card" style="opacity:0.7">
      <div class="skeleton-avatar skeleton-pulse" style="width:36px;height:36px;border-radius:50%;flex-shrink:0"></div>
      <div class="admin-comment-body">
        <div class="skeleton-line skeleton-pulse" style="width:28%;height:13px;margin-bottom:8px;border-radius:6px"></div>
        <div class="skeleton-line skeleton-pulse" style="width:90%;height:11px;margin-bottom:5px;border-radius:6px"></div>
        <div class="skeleton-line skeleton-pulse" style="width:65%;height:11px;border-radius:6px"></div>
      </div>
    </div>
  `).join('');
}

// ── Auth ─────────────────────────────────────────────
let isLoggedIn = sessionStorage.getItem('az_admin') === '1';

function showLoginPage() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('adminPage').style.display = 'none';
}
function showAdminPage() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminPage').style.display = 'block';
  loadAllComments();
}

if (isLoggedIn) showAdminPage();

document.getElementById('loginBtn').addEventListener('click', () => {
  const pw    = document.getElementById('adminPasswordInput').value;
  const errEl = document.getElementById('loginError');
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem('az_admin', '1');
    showToast('Login berhasil! Selamat datang, Admin.', 'success');
    showAdminPage();
  } else {
    errEl.textContent = 'Password salah. Coba lagi.';
    errEl.classList.add('show');
    document.getElementById('adminPasswordInput').value = '';
    setTimeout(() => errEl.classList.remove('show'), 3000);
  }
});

document.getElementById('adminPasswordInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('az_admin');
  showLoginPage();
  showToast('Berhasil keluar dari panel admin.', 'info');
});

// ── Load semua komentar ───────────────────────────────
let allComments = [];

async function loadAllComments() {
  document.getElementById('adminLoading').style.display = 'none';
  showAdminSkeletons(5);

  try {
    const q    = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    allComments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateStats();
    renderAdmin(allComments);
  } catch (e) {
    document.getElementById('adminCommentsList').innerHTML = '';
    console.error(e);
    showToast('Gagal memuat data. Cek Firebase config.', 'error');
  }
}

function updateStats() {
  document.getElementById('statTotal').textContent = allComments.length;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayCount = allComments.filter(
    c => c.createdAt && c.createdAt.toMillis() >= todayStart.getTime()
  ).length;
  document.getElementById('statToday').textContent = todayCount;
  const users = new Set(allComments.map(c => c.username)).size;
  document.getElementById('statUsers').textContent = users;
  const totalLikes = allComments.reduce((s, c) => s + (c.likes || 0), 0);
  document.getElementById('statLikes').textContent = totalLikes;
}

function renderAdmin(data) {
  const el = document.getElementById('adminCommentsList');
  if (!data.length) {
    el.innerHTML = `
      <div class="admin-empty">
        <div style="font-size:3rem;margin-bottom:1rem;opacity:0.3">🌸</div>
        <div style="font-size:1rem;font-weight:700;margin-bottom:0.4rem">Tidak ada komentar</div>
        <div style="font-size:0.82rem;color:var(--text2);font-weight:400">Database masih sepi seperti desa di anime isekai...</div>
      </div>`;
    return;
  }
  el.innerHTML = data.map(c => `
    <div class="admin-comment-card" id="acard-${c.id}">
      <div class="comment-avatar" style="background:${getAvatarColor(c.username)};width:36px;height:36px;min-width:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:900;color:#fff;flex-shrink:0">
        ${(c.username || '?')[0].toUpperCase()}
      </div>
      <div class="admin-comment-body">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-weight:800;font-size:0.88rem">@${sanitize(c.username || 'anonymous')}</span>
          <span style="color:var(--text2);font-size:0.72rem;font-family:var(--font-mono);font-weight:400">${formatDate(c.createdAt)}</span>
          ${c.lastEditedAt ? `<span style="font-size:0.68rem;color:var(--gold);font-weight:600;opacity:0.8">(disunting)</span>` : ''}
          ${c.likes ? `<span style="font-size:0.72rem;color:#f472b6;font-weight:700">❤️ ${c.likes}</span>` : ''}
        </div>
        <div class="admin-comment-text">${sanitize(c.text || '')}</div>
      </div>
      <div class="admin-comment-actions">
        <button class="btn-admin-delete" onclick="window.__deleteComment('${c.id}')">🗑️ Hapus</button>
      </div>
    </div>
  `).join('');
}

// ── Search ────────────────────────────────────────────
document.getElementById('adminSearch').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  const filtered = allComments.filter(c =>
    (c.username || '').toLowerCase().includes(q) ||
    (c.text     || '').toLowerCase().includes(q)
  );
  renderAdmin(filtered);
});

// ── Delete ────────────────────────────────────────────
let pendingDeleteId = null;
const confirmOverlay = document.getElementById('confirmOverlay');

window.__deleteComment = function (id) {
  pendingDeleteId = id;
  confirmOverlay.classList.add('active');
};

document.getElementById('confirmYes').addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  confirmOverlay.classList.remove('active');
  try {
    await deleteDoc(doc(db, 'comments', pendingDeleteId));
    const card = document.getElementById(`acard-${pendingDeleteId}`);
    if (card) {
      card.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => card.remove(), 320);
    }
    allComments = allComments.filter(c => c.id !== pendingDeleteId);
    updateStats();
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    showToast(`Komentar dihapus pukul ${now}.`, 'success');
  } catch (e) {
    console.error(e);
    showToast('Gagal menghapus komentar.', 'error');
  }
  pendingDeleteId = null;
});

document.getElementById('confirmNo').addEventListener('click', () => {
  confirmOverlay.classList.remove('active');
  pendingDeleteId = null;
});

document.getElementById('refreshBtn').addEventListener('click', loadAllComments);
