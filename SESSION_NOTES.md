# MySkin Frontend Session Notes

Tanggal ringkasan: 2026-06-07
Project: `melanoma-FE`
Stack utama: React, Vite, Tailwind, Motion.dev, Axios, Vitest

## Cara Lanjut Di Desktop Lain

1. Pull atau copy project terbaru.
2. Jalankan dependency:
   ```bash
   npm install
   ```
3. Pastikan file env tersedia:
   ```bash
   .env
   .env.local
   ```
4. Jalankan frontend:
   ```bash
   npm run dev
   ```
5. Validasi build:
   ```bash
   npm run build
   ```

Token dan data login sudah dipindahkan dari `localStorage` ke `sessionStorage`, jadi user perlu login ulang saat membuka browser/session baru.

## Status Terakhir

Build terakhir:
```bash
npm.cmd run build
```
Status: passed.

Test terakhir:
```bash
npm.cmd test -- doctorService
```
Status: passed, 7 tests.

Catatan build: Vite masih memberi warning chunk size besar, tetapi build tidak gagal.

## Fitur Yang Sudah Dikerjakan

### Admin

- Dashboard admin diperbaiki:
  - Storage usage card diganti dengan pending doctor approval dan clinic request.
  - Grafik diperbaiki memakai chart library.
  - Fetching system logs dan audit logs diarahkan ke endpoint backend.
- System Activity page dibuat/diintegrasikan:
  - System logs: `GET /api/v1/admin/system/logs`
  - Audit logs: `GET /api/v1/admin/audit-logs`
  - Cleanup system logs: `POST /api/v1/admin/system/logs/cleanup`
  - Cleanup audit logs: `POST /api/v1/admin/settings/operations/audit-log-cleanup`
- Admin settings dirombak:
  - Hapus 2FA.
  - Hapus privacy settings.
  - Tambah notifications, operational defaults, workspace preferences.
  - Maintenance mode sudah dibuat agar admin tetap bisa masuk dan bisa mematikan ulang.
- Admin profile:
  - Card "Verified Administrator" dihapus.
  - Clinic ID dihapus.
  - Profile photo sudah disesuaikan dengan update backend.
- User management dipecah:
  - Admin users.
  - Patient users.
  - Doctor management.
  - Doctor approval.
- Setiap role user:
  - Tambah data.
  - Edit data.
  - Delete data.
  - Reset password.
  - Email validation disesuaikan dengan backend.
- Doctor management:
  - Filter doctor berdasarkan clinic.
  - Edit status doctor.
  - Lihat pasien dari doctor.
  - Delete doctor memakai konfirmasi ketat.
- Clinic management:
  - Tambah clinic.
  - Edit clinic.
  - Delete clinic hard delete sesuai backend.
  - Approval clinic request menjadi bagian dari clinic management.
- Admin notification:
  - Doctor approval queue.
  - Clinic request queue.
  - Critical system alerts.

### Doctor

- Doctor dashboard diperbaiki:
  - Share/menu icons yang tidak dipakai dihapus.
  - Sidebar sticky/fixed saat scroll.
  - Navigasi antar page dibuat lebih smooth dengan View Transition.
  - Float window/modal diberi animasi Motion.dev.
- Doctor messages:
  - Crash `consultationId` null diperbaiki.
  - Chat realtime/polling diperbaiki agar tidak perlu refresh manual.
  - AI chatbot dihapus karena aplikasi tidak memakai AI chatbot.
  - Prescribe dihapus.
  - Close case diubah menjadi modal dengan:
    - caseDisposition
    - finalClinicalNotes
    - emailClinicalSummary
  - Attachment message memakai tombol plus.
  - Message area dibuat scroll overflow.
  - Delete chat hanya untuk consultation CLOSED, dengan confirmation modal.
- Historical case:
  - Filter search, diagnosis, status, date range aktif.
  - Pagination aktif.
  - Download case history PDF aktif.
  - Generate/download case report PDF aktif.
  - Layout diperkecil agar lebih fit di layar 100%.
  - Lesion evolution dibuat scroll overflow dengan fade.
- Doctor settings:
  - Privacy settings dihapus.
  - 2FA dihapus.
  - Notification settings disesuaikan dengan backend.
- Doctor profile:
  - Clinic ID diganti menjadi nama clinic.
  - Photo upload diperbaiki.

### Patient

- Patient dashboard:
  - Request verification ke doctor memakai `doctorId` yang benar dari doctor profile.
  - Report download diperbaiki agar tidak membuka PDF rusak.
  - Sidebar sticky/fixed saat scroll.
- Register:
  - Input tanggal diperbaiki agar manual typing tahun `2004` tidak berubah menjadi `0004`.
  - Password validation mengikuti error backend.
  - Error password ditampilkan lebih rapi sebagai list.
  - Password dan confirm password punya eye button.
- Google auth callback:
  - Parsing token dibuat lebih fleksibel.
  - Mendukung beberapa bentuk token dari backend.

## Fitur Grad-CAM / Doctor Annotation

Fitur terbaru yang sedang/baru ditambahkan:

- Doctor dapat melihat gambar klinis, Grad-CAM heatmap, dan hasil annotation dokter.
- Doctor dapat membuka editor annotation:
  - Brush.
  - Eraser.
  - Brush size.
  - Grad-CAM opacity.
  - Undo.
  - Reset.
  - Save annotation.
- Hasil save dibuat sebagai PNG dan dikirim ke backend dengan `FormData`.
- Field form-data wajib:
  ```text
  annotationImage
  ```
- Jangan set `Content-Type` manual saat memakai `FormData`.
- Setelah upload sukses, frontend sekarang langsung membaca:
  ```js
  response.data.annotatedImageUrl
  ```
- Jika response lama tidak membawa URL, frontend tetap fallback dengan refetch:
  ```text
  GET /api/v1/doctor/cases/:caseId
  ```

Endpoint annotation:
```text
POST /api/v1/doctor/cases/:caseId/annotation
Authorization: Bearer <doctor_token>
Content-Type: multipart/form-data
```

Success response baru:
```json
{
  "status": "success",
  "message": "Coretan dokter berhasil disimpan pada data Scan",
  "data": {
    "annotatedImageUrl": "/uploads/annotations/annotation_1780799040949_g01h9k28f.png"
  }
}
```

File terkait Grad-CAM/annotation:

- `src/services/endpoints.js`
  - Tambah `ENDPOINTS.DOCTOR.CASE_ANNOTATION`.
- `src/features/doctor/services/doctorService.js`
  - Tambah `uploadCaseAnnotation(caseId, annotationImage)`.
- `src/features/doctor/pages/DoctorDashboardPage.jsx`
  - Setelah upload, update `clinicalImage.annotatedImageUrl` langsung dari response backend.
- `src/features/doctor/components/dashboard/GradcamAnnotationModal.jsx`
  - Modal canvas editor untuk annotation.
- `src/features/doctor/components/dashboard/ClinicalImageCard.jsx`
  - Menampilkan annotation image jika ada.
  - Fallback ke original clinical image + Grad-CAM overlay.
- `src/features/doctor/components/dashboard/AiPredictionCard.jsx`
  - Menampilkan Grad-CAM heatmap reference.
- `src/features/doctor/services/doctorService.test.js`
  - Test upload annotation response baru dan response lama.

## Endpoint Backend Penting

### Auth

- Login hanya boleh jika `User.status === "active"` untuk semua role.
- Inactive user ditolak dengan 403:
  ```text
  Akun Anda tidak aktif. Silakan hubungi administrator.
  ```
- Google login juga tidak boleh bypass inactive status.

### Admin Settings

```text
GET /api/v1/admin/settings
PATCH /api/v1/admin/settings/account
PATCH /api/v1/admin/settings/notifications
PATCH /api/v1/admin/settings/operations
PATCH /api/v1/admin/settings/preferences
GET /api/v1/admin/settings/operations
POST /api/v1/admin/settings/operations/audit-log-cleanup
```

### Admin Logs

System logs:
```text
GET /api/v1/admin/system/logs
POST /api/v1/admin/system/logs/cleanup
```

Audit logs:
```text
GET /api/v1/admin/audit-logs
POST /api/v1/admin/settings/operations/audit-log-cleanup
```

### Admin Reports

```text
POST /api/v1/admin/dashboard/report/generate
GET /api/v1/admin/dashboard/report/export
```

### Doctor Cases

```text
GET /api/v1/doctor/cases/assigned
GET /api/v1/doctor/cases/:caseId
POST /api/v1/doctor/cases/:caseId/observation
PATCH /api/v1/doctor/cases/:caseId/approve
PATCH /api/v1/doctor/cases/:caseId/reject
POST /api/v1/doctor/cases/:caseId/annotation
GET /api/v1/doctor/cases/history
GET /api/v1/doctor/cases/history/download
POST /api/v1/doctor/cases/:caseId/report/generate
GET /api/v1/doctor/cases/:caseId/report/download
```

### Doctor Consultation / Chat

```text
GET /api/v1/doctor/consultations
GET /api/v1/doctor/consultations/:consultationId
GET /api/v1/doctor/consultations/:consultationId/messages
POST /api/v1/doctor/consultations/:consultationId/messages
PATCH /api/v1/doctor/consultations/:consultationId/read-all
PATCH /api/v1/doctor/consultations/:consultationId/close
DELETE /api/v1/doctor/consultations/:consultationId
```

Delete consultation hanya untuk status CLOSED.

Close consultation body:
```json
{
  "caseDisposition": "case_resolved",
  "finalClinicalNotes": "Clinical review completed.",
  "emailClinicalSummary": true
}
```

### Patient Consultation / Chat

```text
GET /api/v1/patient/consultations
POST /api/v1/patient/consultations/initiate
GET /api/v1/patient/consultations/:consultationId
GET /api/v1/patient/consultations/:consultationId/messages
POST /api/v1/patient/consultations/:consultationId/messages
PATCH /api/v1/patient/consultations/:consultationId/read-all
```

## Catatan UI/UX

- Motion.dev sudah dipakai untuk beberapa modal/popover.
- Navigasi dashboard admin/doctor/patient memakai View Transition jika browser mendukung.
- Jangan pakai global CSS selector modal yang terlalu luas karena sebelumnya menyebabkan modal blur/posisi bermasalah.
- Sidebar admin/doctor/patient dibuat sticky/fixed agar tetap terlihat saat scroll.
- Hindari komponen terlalu besar di layar 100%, terutama historical case.

## Catatan Penting Backend Yang Pernah Diberikan

- DELETE doctor sudah hard delete dengan cleanup relasi.
- DELETE clinic sudah hard delete, bukan deactivate.
- Admin notification sudah dikontrol oleh AdminSettings notifications.
- Doctor notification sudah dikontrol oleh DoctorSettings notifications.
- System logs producer backend sudah ditambahkan:
  - global error 500
  - failed login
  - maintenance mode changed
  - audit log cleanup
  - AI/scan needs review
- Audit log duplicate `auditId` sudah diperbaiki dengan UUID + retry.
- Report PDF backend doctor sudah diperbaiki agar file valid.

## Akun Demo / Seeder

File yang pernah dibuka:

- `prisma/seed.js`
- `prisma/seed-doctor.js`
- `prisma/demo-seed.js`

Password demo yang pernah terlihat:
```text
Str0ng!Pass2026
```

Email doctor yang pernah dipakai:
```text
elenaaris@icloud.com
```

Catatan: pastikan backend database sudah menjalankan seed terbaru sebelum demo.

## Checklist Sebelum Demo

- Backend running di port yang sesuai env frontend.
- Frontend running dengan `npm run dev`.
- Login admin berhasil.
- Login doctor berhasil.
- Login patient berhasil.
- Maintenance mode off sebelum demo user non-admin.
- Doctor approval punya minimal satu pending doctor.
- Clinic request punya minimal satu pending clinic.
- Doctor historical case punya minimal satu case dengan gambar.
- Doctor dashboard punya assigned case untuk testing Grad-CAM annotation.
- Patient punya scan/report/consultation demo.
- Notification bell dicek setelah create doctor/clinic request.
- Report PDF dicek dengan viewer browser atau download langsung.

## Perintah Cepat

Frontend:
```bash
npm install
npm run dev
npm run build
npm test
```

Targeted test:
```bash
npm.cmd test -- doctorService
```

Git:
```bash
git status
git add .
git commit -m "Update MySkin frontend session work"
git push
```
