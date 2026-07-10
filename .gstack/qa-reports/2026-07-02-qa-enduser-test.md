# 🔍 QA End-End User Journey Test — Mimotes

**Date:** 2026-07-02  
**Tester:** Hermes Agent (berpindah sebagai end-user awam)  
**URL:** http://localhost:3100  
**Browser:** Playwright Chromium (1280x800)

---

## Ringkasan Hasil

| Test | Status | Temuan |
|------|--------|--------|
| Homepage | ⚠️ | Tidak ada tombol Login |
| Register Form | ⚠️ | Tidak ada client-side validation |
| Login Form | ⚠️ | Error message tidak muncul |
| Login Flow | ✅ | Berhasil redirect ke dashboard |
| Dashboard | ✅ | Loads correctly |

**Total Issues:** 3 (0 Critical, 3 Medium)

---

## Detailed Findings

### 🔵 Issue 1: Tidak Ada Tombol Login di Homepage

**Severity:** Medium  
**Location:** Homepage (`/`)

**Description:**  
Sebagai user awam yang sudah punya akun, aku tidak melihat tombol "Login" di homepage. Yang ada hanya tombol "Get started free" yang mengarah ke register.

**Impact:**  
User yang sudah punya akun harus manual ketik `/login` di browser.

**Recommendation:**  
Tambah tombol "Login" di navigation bar atau di sebelah "Get started free".

---

### 🔵 Issue 2: Register Form Tidak Ada Client-Side Validation

**Severity:** Medium  
**Location:** Register page (`/register`)

**Description:**  
Ketika submit form dengan:
- Email invalid (`invalid-email`)
- Form kosong

Tidak ada error message yang muncul. Form di-submit tanpa validasi.

**Impact:**  
User tidak tahu input-nya salah sampai server response (yang juga tidak terlihat).

**Recommendation:**  
Tambah HTML5 validation (`required`, `type="email"`) atau JavaScript validation sebelum submit.

---

### 🔵 Issue 3: Login Error Message Tidak Muncul

**Severity:** Medium  
**Location:** Login page (`/login`)

**Description:**  
Ketika login dengan password salah:
- Tidak ada error message
- Tidak ada redirect
- Form tetap di halaman yang sama

**Impact:**  
User tidak tahu apakah login gagal atau masih loading.

**Recommendation:**  
Tampilkan error message seperti "Email atau password salah" di bawah form.

---

## Screenshots

| Halaman | Path |
|---------|------|
| Homepage | `qa-test-01-homepage.png` |
| Register | `qa-test-02-register.png` |
| Login | `qa-test-03-login.png` |
| Dashboard | `qa-test-04-dashboard.png` |

---

## Yang Sudah Berjalan Baik

1. ✅ **Homepage** — Content jelas, CTA buttons ada
2. ✅ **Register Form** — Fields lengkap (Nama, Email, Password, Confirm)
3. ✅ **Login Form** — Clean design, ada "Lupa password?" link
4. ✅ **Login Flow** — Redirect ke /dashboard berhasil
5. ✅ **Dashboard** — Stats cards, navigation sidebar berfungsi

---

## Prioritas Perbaikan

| Priority | Issue | Effort |
|----------|-------|--------|
| 1 | Tambah tombol Login di homepage | Low |
| 2 | Tambah error message di login | Low |
| 3 | Tambah validation di register form | Medium |

---

**STATUS:** DONE_WITH_CONCERNS  
**REASON:** 3 medium UX issues found. No critical bugs. Core flows work correctly.
