# 📘 Front-End Developer Workflow — TactIQ Platform
**Role**: Front-End Engineer (Ferrel)  
**Territory**: Murni di `apps/web/`  
**Repository**: [github.com/LuthfiMirza/TactIQ](https://github.com/LuthfiMirza/TactIQ)  
**Lead / Reviewer**: Luthfi Mirza

---

## 🚨 Golden Rules
1. **Teritori Eksklusif**: Hanya buat atau ubah file di dalam folder `apps/web/` (dan file tipe frontend jika diperlukan). Dilarang menyentuh `apps/api/` atau `services/ml/`.
2. **Dilarang Direct Push ke `main`**: Semua fitur baru wajib dibuat di branch terpisah dengan format `feat/fe-<nama-fitur>`.
3. **Alur Merge**: Push branch ke remote -> Buat Pull Request (PR) ke `main` -> Minta review ke Luthfi.

---

## 💻 1. Menjalankan Front-End di Lokal
Jalankan perintah ini dari root folder project:
```bash
npm run dev --workspace=apps/web
```
Aplikasi Front-End akan berjalan di: **`http://localhost:3000`**

*(Catatan: Endpoint backend API berjalan di port `4000`, dan ML FastAPI di port `8000`).*

---

## 🌿 2. Alur Pengerjaan Fitur Baru (Step-by-Step)

### Step 1: Tarik Pembaruan Terbaru dari `main`
Sebelum membuat branch baru, pastikan branch `main` lokal Anda sudah paling mutakhir:
```bash
git checkout main
git pull origin main
```

### Step 2: Buat Branch Fitur Baru
Gunakan format nama branch khusus Front-End:
```bash
git checkout -b feat/fe-<nama-fitur>
```
*Contoh:*
* `git checkout -b feat/fe-scouting-radar-filter`
* `git checkout -b feat/fe-match-center-h2h`
* `git checkout -b feat/fe-minimap-solid-theme`

### Step 3: Kerjakan Fitur
* Kerjakan **hanya** di `apps/web/`.
* Pastikan desain mematuhi aturan: **Flat / Solid Matte, Zero Gradient, High Contrast**.
* Uji coba tampilan di browser (`http://localhost:3000`).

### Step 4: Commit Perubahan
Gunakan format Conventional Commits yang rapi:
```bash
git add apps/web/
git commit -m "feat(web): deskripsi perubahan fitur yang jelas"
```
*Contoh commit:*
* `git commit -m "feat(scouting): implement flat solid radar chart and player filter"`
* `git commit -m "feat(tracker): integrate 60fps html5 canvas overlay without gradients"`

### Step 5: Push Branch ke GitHub
Kirim branch Anda ke remote repository:
```bash
git push -u origin feat/fe-<nama-fitur>
```

### Step 6: Buat Pull Request (PR)
1. Buka browser ke: [https://github.com/LuthfiMirza/TactIQ](https://github.com/LuthfiMirza/TactIQ)
2. Klik tombol **"Compare & pull request"**.
3. Pastikan base branch mengarah ke **`main`**.
4. Tulis ringkasan singkat perubahan yang dibuat pada deskripsi PR.
5. Submit PR dan kabari **Luthfi** untuk direview dan di-merge ke branch `main`.

---

## ⚡ Quick Reference Command Card

| Kebutuhan | Perintah |
| :--- | :--- |
| **Run Dev Server** | `npm run dev --workspace=apps/web` |
| **Update Main** | `git checkout main && git pull origin main` |
| **Buat Branch FE** | `git checkout -b feat/fe-<nama-fitur>` |
| **Cek Perubahan** | `git status` atau `git diff` |
| **Commit FE** | `git add apps/web/ && git commit -m "feat(web): ..."` |
| **Push Branch** | `git push -u origin <nama-branch>` |
