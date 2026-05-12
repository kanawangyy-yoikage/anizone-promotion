<div align="center">

# 🎌 AniZone 2026 — Revised

**Platform streaming anime modern — bebas iklan, kualitas HD, PWA-ready**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kanawangyy-yoikage/anizone-landing)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase)
![Vercel](https://img.shields.io/badge/deployed-Vercel-black?style=flat-square&logo=vercel)

</div>

---

## 📁 Struktur File (Revised)

```
anizone-landing/
├── index.html              # Halaman utama
├── admin.html              # Panel admin moderasi komentar
├── vercel.json             # Konfigurasi Vercel
├── README.md
│
├── css/
│   └── style.css           # Semua styling (Liquid Glass UI + fitur baru)
│
├── js/
│   ├── firebase-config.js  # Config Firebase & ADMIN_PASSWORD
│   ├── comments.js         # Logika komentar (Edit, Likes, Draft, dll.)
│   ├── admin.js            # Logika admin panel
│   └── main.js             # Animasi & efek visual
│
└── assets/                 # Gambar: bg.jpg, pp.png, screenshot-*.png
```

---

## ✨ Fitur Baru (Revised)

### A. Logika (CRUD Lengkap)
| Fitur | Deskripsi |
|-------|-----------|
| ✏️ **Edit Komentar** | Tombol edit muncul saat hover; hanya pemilik komentar (by deviceId) yang bisa edit |
| ❤️ **Likes / Rating** | Tombol like per komentar; atomic `increment(1)` di Firestore; sorted by likes |
| 🔄 **Sorting** | Urutkan komentar: Terbaru / Terlama / Terpopuler |
| 👤 **User Profil di Firestore** | Username + deviceId disimpan ke koleksi `users` |
| 🆔 **Device ID Unik** | Setiap perangkat punya ID unik di localStorage — mencegah penyamaran |
| 📝 **Draft Otomatis** | Komentar yang sedang diketik otomatis tersimpan di localStorage |
| 🕐 **Audit Trail** | Label "(disunting)" muncul di komentar yang sudah diedit + `lastEditedAt` di DB |

### B. Tampilan
| Fitur | Deskripsi |
|-------|-----------|
| 🦴 **Skeleton Screen** | Loading berupa shimmer placeholder mengikuti bentuk kartu komentar |
| 🎨 **Color-coded CRUD** | Create=cyan/purple glow, Update=gold/amber, Delete=crimson/rose |
| 🌀 **Micro-interactions** | Hover reveal tombol, active scale, disabled state lengkap |
| ✨ **Create/Delete Animations** | Slide-in dari bawah saat tambah; shrink+slide-out saat hapus |
| 🔍 **Dimming saat Edit** | Kartu lain redup saat mode edit aktif; border emas animated |
| 🏜️ **Empty State** | Ilustrasi terapung + teks puitis bila belum ada komentar |
| 📱 **Responsive Typography** | Text ellipsis di admin panel; fluid columns untuk semua ukuran layar |

### C. Tambahan
| Fitur | Deskripsi |
|-------|-----------|
| 📊 **Pagination + Sorting** | Load More per 10 komentar; 3 opsi urutan |
| 🔔 **Toast Informatif** | Pesan spesifik dengan timestamp: "Dikirim pukul 14:05" |
| 📈 **Admin: 4 Stats** | Total komentar, Hari ini, Pengguna unik, Total likes |
| 🛡️ **Security** | Delete hanya bisa dilakukan oleh pemilik (deviceId match) atau admin |

---

## 🔥 Setup Firebase

Isi **`js/firebase-config.js`** dengan config proyekmu:

```javascript
export const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
export const ADMIN_PASSWORD = 'password_baru_kamu';
```

### Firestore Security Rules (Recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.resource.data.text.size() <= 500
                    && request.resource.data.username.size() >= 3;
      allow update: if resource.data.deviceId == request.resource.data.deviceId;
      allow delete: if false;
    }
    match /users/{userId} {
      allow read, write: if true;
    }
  }
}
```

---

## 🌐 Deploy ke Vercel

```bash
vercel --prod
```

Admin panel: `/admin.html` atau `/admin`  
Default password: `bagus4399` — **ganti sebelum deploy!**

---

## 👨‍💻 Developer

**KanaWangyy (YoiKage)** · [GitHub](https://github.com/kanawangyy-yoikage)

Made with 💜 · AniZone 2026 Revised
