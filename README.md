<div align="center">

# 🎌 AniZone 2026

**Platform streaming anime modern — bebas iklan, kualitas HD, PWA-ready**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kanawangyy-yoikage/anizone-landing)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase)
![Vercel](https://img.shields.io/badge/deployed-Vercel-black?style=flat-square&logo=vercel)

[🌐 Live Demo](https://anizone-yoikage.vercel.app) · [👤 GitHub](https://github.com/kanawangyy-yoikage)

</div>

---

## 📁 Struktur Folder

```
anizone-landing/
├── index.html              # Halaman utama
├── admin.html              # Panel admin
├── vercel.json             # Konfigurasi Vercel
├── README.md
│
├── css/
│   └── style.css           # Semua styling
│
├── js/
│   ├── firebase-config.js  # Config Firebase + password admin
│   ├── comments.js         # Logika komentar (Edit, Like, Draft, dll)
│   ├── admin.js            # Logika admin panel
│   └── main.js             # Animasi & UI (particles, cursor, tilt)
│
└── assets/
    ├── bg.jpg                      # Background / banner
    ├── pp.png                      # Avatar developer
    ├── screenshot-desktop.png      # Screenshot 1366x768 (isi manual)
    └── screenshot-mobile.png       # Screenshot 1080x2460 (isi manual)
```

---

## 🔥 Setup Firebase

1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Buat project → aktifkan Firestore (test mode)
3. Buka `js/firebase-config.js` dan isi config + password admin

---

## 🛡️ Admin Panel

Akses di `/admin` atau `/admin.html`

**Default password:** `bagus4399` → ganti di `js/firebase-config.js`

---

## 💬 Fitur Komentar (Baru)

| Fitur | Keterangan |
|-------|-----------|
| ✏️ Edit | Pemilik komentar bisa edit teks |
| ❤️ Like | Like dengan atomik increment |
| 🗑️ Hapus | Pemilik bisa hapus komentarnya |
| 📅 Sort | Terbaru / Terlama / Terpopuler |
| 💾 Draft | Auto-save draft ke localStorage |
| 🔖 Edited | Badge "(disunting)" setelah diedit |
| 🖼️ Skeleton | Loading skeleton screen |
| 📱 Responsif | Optimal di desktop & mobile |

---

## 📸 Screenshot

Taruh screenshot di folder `assets/`:
- `screenshot-desktop.png` — resolusi 1366×768
- `screenshot-mobile.png` — resolusi 1080×2460

---

Made with 💜 by **KanaWangyy** · AniZone 2026
