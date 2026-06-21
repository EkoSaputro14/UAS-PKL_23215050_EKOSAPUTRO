# WhatsApp Cloud API — Setup Guide from Scratch

## Step 1: Create Meta Developer Account

1. Buka **https://developers.facebook.com**
2. Login dengan Facebook account kamu
3. Klik **"Get Started"** → Accept terms
4. Developer account sudah aktif

## Step 2: Create Meta App

1. Buka **https://developers.facebook.com/apps/create**
2. Pilih **"Business"** → klik **Next**
3. Isi:
   - **App Name:** `MimoNotes WhatsApp Bot`
   - **App Contact Email:** email kamu
4. Klik **Create App**
5. Masukkan password Facebook jika diminta

## Step 3: Add WhatsApp Product

1. Di dashboard app, klik **"Add Products"**
2. Cari **"WhatsApp"** → klik **"Set up"**
3. Pilih **"Create a new WhatsApp Business account"** (atau pilih yang existing kalau ada)
4. Klik **Continue**

## Step 4: Get Temporary Token (untuk testing)

1. Di sidebar kiri, klik **WhatsApp** → **API Setup**
2. Kamu akan melihat:
   - **Temporary access token** — copy ini (berlaku 24 jam)
   - **Phone number ID** — copy ini
   - **WhatsApp Business Account ID** — copy ini
3. Ada nomor test dari Meta: **+1 (555) 025-XXXX** — ini nomor test yang sudah disediakan

## Step 5: Add Your Phone Number (for testing)

1. Di API Setup, klik **"To"** → **"Manage phone number"**
2. Atau: **WhatsApp** → **Configuration** → **Phone Numbers**
3. Klik **"Add Phone Number"**
4. Isi:
   - **Display Name:** nama bisnis kamu
   - **Phone Number:** nomor HP kamu (format: +62xxx)
   - **Category:** pilih yang sesuai
5. Verifikasi nomor via SMS/voice call
6. Setelah verified, copy **Phone Number ID**

## Step 6: Generate Permanent Access Token

Temporary token hanya 24 jam. Untuk permanent:

1. Buka **Business Settings** di **https://business.facebook.com/settings**
2. Di sidebar: **Users** → **System Users**
3. Klik **"Add"** → beri nama: `mimotes-whatsapp`
4. Role: **Admin**
5. Klik **"Create System User"**
6. Klik **"Generate New Token"**
7. Pilih app: `MimoNotes WhatsApp Bot`
8. Check permissions:
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
9. Klik **"Generate Token"**
10. **COPY TOKEN INI SEKARANG** — hanya ditampilkan sekali!

## Step 7: Get App Secret

1. Buka **https://developers.facebook.com/apps/** → pilih app kamu
2. **Settings** → **Basic**
3. Klik **"Show"** di **App Secret**
4. Copy

## Step 8: Configure Webhook

1. Di Meta App dashboard: **WhatsApp** → **Configuration**
2. Di bagian **Webhook**:
   - **Callback URL:** `https://mimotes.ekohomelab.online/api/whatsapp/webhook`
   - **Verify Token:** `mimotes_whatsapp_verify` (atau custom)
3. Klik **"Verify and save"**
4. Subscribe to webhook fields:
   - ✅ `messages`
   - ✅ `message_deliveries`
   - ✅ `message_reads`

## Step 9: Configure in MimoNotes

1. Buka **https://mimotes.ekohomelab.online/settings/whatsapp**
2. Isi form:
   - **Phone Number ID:** dari Step 4/5
   - **Access Token:** dari Step 6 (permanent token)
   - **Verify Token:** sama dengan yang di Step 8
   - **App Secret:** dari Step 7 (opsional)
3. Klik **"Simpan Konfigurasi"**
4. Klik **"Test Koneksi"** — harusnya muncul info nomor

## Step 10: Test!

1. Kirim pesan dari HP kamu ke nomor WhatsApp Business
2. Cek dashboard MimoNotes → WhatsApp → percakapan muncul
3. AI harusnya merespon otomatis

---

## Quick Reference

| Item | Where to Find |
|------|---------------|
| Phone Number ID | developers.facebook.com → App → WhatsApp → API Setup |
| Access Token | business.facebook.com → Settings → System Users → Generate Token |
| App Secret | developers.facebook.com → App → Settings → Basic |
| Verify Token | Custom — you set this in webhook config |
| Webhook URL | `https://mimotes.ekohomelab.online/api/whatsapp/webhook` |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Verify failed" | Pastikan Verify Token di Meta = yang di MimoNotes |
| "Invalid access token" | Gunakan permanent token dari System User, bukan temporary |
| "Phone number not found" | Pastikan Phone Number ID benar, nomor sudah verified |
| Webhook not receiving | Pastikan webhook URL bisa diakses dari internet (cek Cloudflare tunnel) |
| "Permissions denied" | Pastikan System User punya `whatsapp_business_management` + `whatsapp_business_messaging` |

---

*Guide by Hermes Agent — Ikuti step 1-10 secara berurutan.*
