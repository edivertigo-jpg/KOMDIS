# Dashboard Komite Medis SHND 2026
**RSU Surya Husadha Nusa Dua** — Dashboard Tertib Administrasi Komite Medis

---

## 🚀 Cara Deploy ke GitHub Pages

### Langkah 1 — Buat Repository di GitHub
1. Buka [github.com](https://github.com) → klik **New repository**
2. Nama repo: `dashboard-komite-medis` (atau sesuai selera)
3. Set **Public** (diperlukan untuk GitHub Pages gratis)
4. Jangan centang apapun, langsung **Create repository**

### Langkah 2 — Upload File
Buka terminal / Git Bash di folder ini, lalu jalankan:

```bash
git init
git add .
git commit -m "Initial deploy: Dashboard Komite Medis SHND PWA"
git branch -M main
git remote add origin https://github.com/USERNAME/dashboard-komite-medis.git
git push -u origin main
```

> Ganti `USERNAME` dengan username GitHub kamu

### Langkah 3 — Aktifkan GitHub Pages
1. Di repo GitHub → klik tab **Settings**
2. Scroll ke bagian **Pages** (menu kiri)
3. Source: **Deploy from a branch**
4. Branch: **main** → folder **/ (root)**
5. Klik **Save**

Setelah beberapa menit, dashboard live di:
```
https://USERNAME.github.io/dashboard-komite-medis/
```

---

## 📲 Fitur PWA

Dashboard ini sudah mendukung **Progressive Web App (PWA)**:

| Fitur | Keterangan |
|-------|------------|
| 📲 Install ke Home Screen | Tombol "Pasang App" otomatis muncul di browser |
| 📴 Mode Offline | Data terakhir tetap tampil saat tanpa internet |
| 🔄 Auto-update | SW otomatis cek versi baru setiap 60 detik |
| 🖥️ Standalone Mode | Berjalan seperti aplikasi native (tanpa browser bar) |
| 🍎 iOS Support | Compatible dengan Safari iOS (Add to Home Screen) |

### Cara Install di HP/Komputer:
- **Android Chrome**: Tap ikon menu → "Tambahkan ke Layar Utama" atau klik tombol "📲 Pasang App" di dashboard
- **iOS Safari**: Tap ikon Share → "Tambah ke Layar Utama"
- **Desktop Chrome/Edge**: Klik ikon install di address bar

---

## 📁 Struktur File

```
/
├── index.html          ← Dashboard utama
├── manifest.json       ← Konfigurasi PWA
├── sw.js               ← Service Worker (cache & offline)
├── .nojekyll           ← Bypass Jekyll di GitHub Pages
├── README.md           ← File ini
└── icons/
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png
```

---

## 🔧 Update Dashboard

Setiap kali ada perubahan, tinggal push ulang:

```bash
git add .
git commit -m "Update: deskripsi perubahan"
git push
```

GitHub Pages otomatis deploy dalam ~1 menit.

---

## ⚠️ Catatan Penting

- **Service Worker** path `sw.js` harus di **root domain**. Kalau GitHub Pages diakses via subfolder (mis. `/dashboard-komite-medis/`), ubah baris di `index.html`:
  ```javascript
  navigator.serviceWorker.register('/dashboard-komite-medis/sw.js')
  ```
  Dan di `manifest.json`, ubah `start_url` dan `scope`:
  ```json
  "start_url": "/dashboard-komite-medis/",
  "scope": "/dashboard-komite-medis/"
  ```

- Google Apps Script API tetap butuh internet — offline mode hanya menampilkan **data yang sudah ter-cache** sebelumnya
