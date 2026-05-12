// ═══════════════════════════════════════════════════
//  💬 comments.js — AniZone 2026 (Revised)
//  Fitur: Edit, Likes, Draft, Profil User, Sorting,
//         Device ID, Audit Trail, Skeleton Loading,
//         CRUD animations, Color-coded actions
// ═══════════════════════════════════════════════════

import { initializeApp }    from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, addDoc, getDocs, getDoc,
  updateDoc, deleteDoc, doc, query, orderBy, limit,
  startAfter, serverTimestamp, onSnapshot, increment,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { firebaseConfig } from './firebase-config.js';

// ── Init Firebase ────────────────────────────────────
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Device ID (sesi unik per perangkat) ──────────────
function getDeviceId() {
  let id = localStorage.getItem('az_device_id');
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('az_device_id', id);
  }
  return id;
}
const DEVICE_ID = getDeviceId();

// ── Helpers ──────────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg,#6c63ff,#a78bfa)',
  'linear-gradient(135deg,#00e5ff,#0ea5e9)',
  'linear-gradient(135deg,#ff6b6b,#ff4444)',
  'linear-gradient(135deg,#ffd700,#ff8c00)',
  'linear-gradient(135deg,#4ade80,#22c55e)',
  'linear-gradient(135deg,#f472b6,#ec4899)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
  'linear-gradient(135deg,#38bdf8,#0284c7)',
];

function getAvatarColor(name) {
  let h = 0;
  for (const c of (name || 'x')) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function timeAgo(ts) {
  if (!ts || !ts.toMillis) return 'baru saja';
  const s = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (s < 60)    return `${s}d lalu`;
  if (s < 3600)  return `${Math.floor(s / 60)}m lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)}j lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
}

function formatTimestamp(ts) {
  if (!ts || !ts.toMillis) return '';
  return new Date(ts.toMillis()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function showToast(msg, type = 'info') {
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 320);
  }, 3200);
}

function sanitize(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

// ── Username & Auth ──────────────────────────────────
let currentUsername = localStorage.getItem('az_username') || '';

function updateUIUsername() {
  const av     = document.getElementById('composeAvatar');
  const lb     = document.getElementById('composeUsernameName');
  const pill   = document.getElementById('userPillWrap');
  const pillAv = document.getElementById('userPillAvatar');
  const pillNm = document.getElementById('userPillName');

  if (currentUsername) {
    const init = currentUsername[0].toUpperCase();
    const clr  = getAvatarColor(currentUsername);
    av.textContent = init;
    av.style.background = clr;
    lb.textContent = currentUsername;
    if (pill) {
      pill.style.display = 'block';
      pillAv.textContent = init;
      pillAv.style.background = clr;
      pillNm.textContent = currentUsername;
    }
  } else {
    av.textContent = '?';
    av.style.background = '';
    lb.textContent = 'Belum ada username';
    if (pill) pill.style.display = 'none';
  }
}
updateUIUsername();

// ── Draft Otomatis ────────────────────────────────────
const DRAFT_KEY = 'az_comment_draft';
const textarea  = document.getElementById('commentTextarea');
const charEl    = document.getElementById('charCounter');

// Restore draft
const savedDraft = localStorage.getItem(DRAFT_KEY);
if (savedDraft && textarea) {
  textarea.value = savedDraft;
  charEl.textContent = `${savedDraft.length} / 500`;
  charEl.classList.toggle('warn', savedDraft.length > 450);
}

// Auto-save draft
textarea.addEventListener('input', () => {
  const l = textarea.value.length;
  charEl.textContent = `${l} / 500`;
  charEl.classList.toggle('warn', l > 450);
  localStorage.setItem(DRAFT_KEY, textarea.value);
  const di = document.getElementById('draftIndicator');
  if (di) di.style.display = textarea.value.length > 0 ? 'inline-flex' : 'none';
});

// ── Modal Username ────────────────────────────────────
const modal   = document.getElementById('usernameModal');
const input   = document.getElementById('usernameInput');
const errEl   = document.getElementById('usernameError');
const saveBtn = document.getElementById('saveUsernameBtn');
let pendingAction = null;

function openModal(force = false) {
  if (!force && currentUsername) return;
  modal.classList.add('active');
  setTimeout(() => input.focus(), 200);
  if (currentUsername) input.value = currentUsername;
}
function closeModal() {
  modal.classList.remove('active');
  input.value = '';
  errEl.classList.remove('show');
}
window.__openModal = openModal;

function validateUsername(v) {
  v = v.trim();
  if (!v) return 'Username tidak boleh kosong.';
  if (v.length < 3) return 'Minimal 3 karakter.';
  if (v.length > 30) return 'Maksimal 30 karakter.';
  if (!/^[a-zA-Z0-9_.\-]+$/.test(v)) return 'Hanya huruf, angka, _ . - diperbolehkan.';
  return null;
}

saveBtn.addEventListener('click', async () => {
  const v = input.value.trim();
  const err = validateUsername(v);
  if (err) { errEl.textContent = err; errEl.classList.add('show'); return; }

  const isNew = !currentUsername || v !== currentUsername;
  currentUsername = v;
  localStorage.setItem('az_username', v);

  // Simpan/update user ke Firestore
  try {
    await setDoc(doc(db, 'users', DEVICE_ID), {
      username: v,
      deviceId: DEVICE_ID,
      avatarColor: getAvatarColor(v),
      updatedAt: serverTimestamp(),
      ...(isNew ? { joinedAt: serverTimestamp() } : {})
    }, { merge: true });
  } catch (e) { /* non-critical */ }

  closeModal();
  updateUIUsername();
  showToast(`Username @${v} disimpan! 🎉`, 'success');
  if (pendingAction) { pendingAction(); pendingAction = null; }
});
input.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); });
modal.addEventListener('click', e => { if (e.target === modal && currentUsername) closeModal(); });

// ── Sorting ──────────────────────────────────────────
let currentSort = 'newest'; // 'newest' | 'oldest' | 'popular'

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    loadComments();
  });
});

// ── Skeleton Loading ─────────────────────────────────
function showSkeletons(count = 3) {
  const list = document.getElementById('commentsList');
  list.innerHTML = Array(count).fill(0).map(() => `
    <div class="comment-card skeleton-card">
      <div class="skeleton-avatar skeleton-pulse"></div>
      <div class="skeleton-body">
        <div class="skeleton-line skeleton-pulse" style="width:30%;height:14px;margin-bottom:8px"></div>
        <div class="skeleton-line skeleton-pulse" style="width:100%;height:12px;margin-bottom:6px"></div>
        <div class="skeleton-line skeleton-pulse" style="width:75%;height:12px"></div>
      </div>
    </div>
  `).join('');
}

// ── Render Komentar ───────────────────────────────────
const PAGE_SIZE = 10;
let lastVisible = null;
let likedComments = JSON.parse(localStorage.getItem('az_liked') || '{}');

function saveLikes() {
  localStorage.setItem('az_liked', JSON.stringify(likedComments));
}

function renderComment(data, id, prepend = false) {
  const list = document.getElementById('commentsList');
  const init = (data.username || '?')[0].toUpperCase();
  const clr  = getAvatarColor(data.username || '?');
  const isOwner = data.deviceId === DEVICE_ID || data.username === currentUsername;
  const liked = !!likedComments[id];
  const likeCount = data.likes || 0;
  const isEdited = !!data.lastEditedAt;

  const card = document.createElement('div');
  card.className = 'comment-card';
  card.dataset.id = id;
  card.dataset.deviceId = data.deviceId || '';
  card.innerHTML = `
    <div class="comment-head">
      <div class="comment-head-left">
        <div class="comment-avatar" style="background:${clr}">${init}</div>
        <div class="comment-meta">
          <div class="comment-username">@${sanitize(data.username || 'anonymous')}</div>
          <div class="comment-time">${timeAgo(data.createdAt)}${isEdited ? ' <span class="edited-badge">(disunting)</span>' : ''}</div>
        </div>
      </div>
      <div class="comment-actions">
        <button class="btn-like ${liked ? 'liked' : ''}" onclick="window.__likeComment('${id}', this)">
          <span class="like-icon">${liked ? '❤️' : '🤍'}</span>
          <span class="like-count">${likeCount}</span>
        </button>
        ${isOwner ? `
          <button class="btn-edit-comment" onclick="window.__editComment('${id}', this)" title="Edit komentar">✏️</button>
          <button class="btn-delete-comment" onclick="window.__deleteCommentUser('${id}', this)" title="Hapus komentar">🗑️</button>
        ` : ''}
      </div>
    </div>
    <div class="comment-text" id="ctext-${id}">${sanitize(data.text || '')}</div>
    <div class="comment-edit-area" id="cedit-${id}" style="display:none">
      <textarea class="edit-textarea" id="etextarea-${id}" maxlength="500">${sanitize(data.text || '')}</textarea>
      <div class="edit-actions">
        <button class="btn-edit-save" onclick="window.__saveEdit('${id}')">💾 Simpan</button>
        <button class="btn-edit-cancel" onclick="window.__cancelEdit('${id}')">✕ Batal</button>
      </div>
    </div>
  `;

  if (prepend) {
    card.style.animation = 'commentSlideIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both';
    list.prepend(card);
  } else {
    list.appendChild(card);
  }
}

// ── Load Komentar ─────────────────────────────────────
async function loadComments(more = false) {
  if (!more) {
    showSkeletons(3);
    document.getElementById('commentsLoading').style.display = 'none';
    lastVisible = null;
  }
  try {
    let sortField = 'createdAt';
    let sortDir   = 'desc';
    if (currentSort === 'oldest') sortDir = 'asc';
    if (currentSort === 'popular') sortField = 'likes';

    let q = query(collection(db, 'comments'), orderBy(sortField, 'desc'), limit(PAGE_SIZE));
    if (currentSort === 'oldest') {
      q = query(collection(db, 'comments'), orderBy('createdAt', 'asc'), limit(PAGE_SIZE));
    }
    if (more && lastVisible) {
      q = query(collection(db, 'comments'), orderBy(sortField, 'desc'),
        startAfter(lastVisible), limit(PAGE_SIZE));
    }

    const snap = await getDocs(q);
    if (!more) document.getElementById('commentsList').innerHTML = '';

    if (snap.empty && !more) {
      document.getElementById('commentsList').innerHTML = `
        <div class="comments-empty">
          <div class="comments-empty-icon">💬</div>
          <div class="comments-empty-text">Belum ada komentar di sini.<br><span style="color:var(--accent3);font-weight:700">Jadilah samurai pertama yang berkomentar!</span></div>
        </div>`;
      document.getElementById('loadMoreBtn').style.display = 'none';
      return;
    }

    snap.docs.forEach(d => renderComment(d.data(), d.id));
    lastVisible = snap.docs[snap.docs.length - 1];
    document.getElementById('loadMoreBtn').style.display =
      snap.docs.length < PAGE_SIZE ? 'none' : 'block';
  } catch (e) {
    document.getElementById('commentsList').innerHTML = '';
    console.error(e);
    showToast('Gagal memuat komentar. Cek Firebase config.', 'error');
  }
}

// Realtime badge jumlah komentar
onSnapshot(collection(db, 'comments'), snap => {
  document.getElementById('commentsCountBadge').textContent = `${snap.size} komentar`;
});

loadComments();
document.getElementById('loadMoreBtn').addEventListener('click', () => loadComments(true));
textarea.addEventListener('focus', () => { if (!currentUsername) openModal(); });

// ── Submit Komentar ───────────────────────────────────
async function submitComment() {
  const text = textarea.value.trim();
  if (!text) { showToast('Komentar tidak boleh kosong.', 'error'); return; }
  if (text.length > 500) { showToast('Komentar terlalu panjang (maks 500).', 'error'); return; }

  const btn = document.getElementById('submitCommentBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.innerHTML = '<span class="btn-spinner"></span> Mengirim...';

  try {
    const ref = await addDoc(collection(db, 'comments'), {
      username: currentUsername,
      deviceId: DEVICE_ID,
      text,
      likes: 0,
      createdAt: serverTimestamp()
    });

    const emptyEl = document.getElementById('commentsList').querySelector('.comments-empty');
    if (emptyEl) emptyEl.remove();

    renderComment(
      { username: currentUsername, deviceId: DEVICE_ID, text, likes: 0,
        createdAt: { toMillis: () => Date.now() } },
      ref.id,
      true
    );

    textarea.value = '';
    charEl.textContent = '0 / 500';
    localStorage.removeItem(DRAFT_KEY);
    const di = document.getElementById('draftIndicator');
    if (di) di.style.display = 'none';

    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    showToast(`Komentar berhasil dikirim pukul ${now}! 🎉`, 'success');
  } catch (e) {
    console.error(e);
    showToast('Koneksi bermasalah, mencoba lagi...', 'warning');
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22,2 15,22 11,13 2,9"/>
      </svg> Kirim Komentar`;
  }
}

document.getElementById('submitCommentBtn').addEventListener('click', () => {
  if (!currentUsername) { pendingAction = submitComment; openModal(); return; }
  submitComment();
});

// ── Like Komentar ─────────────────────────────────────
window.__likeComment = async function(id, btn) {
  if (likedComments[id]) return; // sudah di-like

  likedComments[id] = true;
  saveLikes();

  const countEl = btn.querySelector('.like-count');
  const iconEl  = btn.querySelector('.like-icon');
  const current = parseInt(countEl.textContent) || 0;
  countEl.textContent = current + 1;
  iconEl.textContent = '❤️';
  btn.classList.add('liked');
  btn.style.transform = 'scale(1.3)';
  setTimeout(() => btn.style.transform = '', 300);

  try {
    await updateDoc(doc(db, 'comments', id), { likes: increment(1) });
  } catch (e) {
    // Rollback visual jika gagal
    likedComments[id] = false;
    saveLikes();
    countEl.textContent = current;
    iconEl.textContent = '🤍';
    btn.classList.remove('liked');
    showToast('Gagal memberi like.', 'error');
  }
};

// ── Edit Komentar ─────────────────────────────────────
window.__editComment = function(id, btn) {
  const textEl = document.getElementById(`ctext-${id}`);
  const editEl = document.getElementById(`cedit-${id}`);
  const card   = btn.closest('.comment-card');

  // Efek dimming kartu lain
  document.querySelectorAll('.comment-card').forEach(c => {
    if (c !== card) c.classList.add('dimmed');
  });
  card.classList.add('editing');

  textEl.style.display = 'none';
  editEl.style.display = 'block';
  const ta = document.getElementById(`etextarea-${id}`);
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
};

window.__cancelEdit = function(id) {
  const textEl = document.getElementById(`ctext-${id}`);
  const editEl = document.getElementById(`cedit-${id}`);
  textEl.style.display = '';
  editEl.style.display = 'none';

  document.querySelectorAll('.comment-card').forEach(c => c.classList.remove('dimmed'));
  document.querySelector(`[data-id="${id}"]`)?.classList.remove('editing');
};

window.__saveEdit = async function(id) {
  const ta   = document.getElementById(`etextarea-${id}`);
  const text = ta.value.trim();
  if (!text) { showToast('Komentar tidak boleh kosong.', 'error'); return; }
  if (text.length > 500) { showToast('Terlalu panjang (maks 500).', 'error'); return; }

  const saveBtn = ta.closest('.comment-edit-area').querySelector('.btn-edit-save');
  saveBtn.disabled = true;
  saveBtn.textContent = '⏳ Menyimpan...';

  try {
    await updateDoc(doc(db, 'comments', id), {
      text,
      lastEditedAt: serverTimestamp()
    });

    // Update tampilan
    const textEl = document.getElementById(`ctext-${id}`);
    textEl.textContent = text;
    window.__cancelEdit(id);

    // Tandai "(disunting)"
    const card = document.querySelector(`[data-id="${id}"]`);
    const timeEl = card?.querySelector('.comment-time');
    if (timeEl && !timeEl.innerHTML.includes('disunting')) {
      timeEl.innerHTML += ' <span class="edited-badge">(disunting)</span>';
    }

    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    showToast(`Komentar berhasil diperbarui pukul ${now} 📝`, 'success');
  } catch (e) {
    console.error(e);
    showToast('Gagal menyimpan perubahan.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Simpan';
  }
};

// ── Delete oleh User ──────────────────────────────────
let pendingDeleteId = null;
const confirmOverlay = document.getElementById('confirmOverlay');

window.__deleteCommentUser = function(id, btn) {
  pendingDeleteId = id;
  confirmOverlay.classList.add('active');
};

document.getElementById('confirmYes')?.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  confirmOverlay.classList.remove('active');
  const card = document.querySelector(`[data-id="${pendingDeleteId}"]`);
  if (card) {
    card.style.animation = 'commentSlideOut 0.35s ease forwards';
    setTimeout(() => card.remove(), 350);
  }
  try {
    await deleteDoc(doc(db, 'comments', pendingDeleteId));
    showToast('Komentar berhasil dihapus.', 'success');
  } catch (e) {
    showToast('Gagal menghapus komentar.', 'error');
  }
  pendingDeleteId = null;
});

document.getElementById('confirmNo')?.addEventListener('click', () => {
  confirmOverlay.classList.remove('active');
  pendingDeleteId = null;
});
