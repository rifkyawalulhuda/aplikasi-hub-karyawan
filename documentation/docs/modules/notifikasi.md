---
id: notifikasi
title: Modul Notifikasi
sidebar_label: Notifikasi
---

# Modul Notifikasi

Hub Karyawan mendukung tiga saluran notifikasi: Email, WhatsApp, dan Push Notification browser.

## Email Notifikasi

Email dikirim secara otomatis pada event-event workflow cuti dan notifikasi kadaluarsa lisensi.

### Konfigurasi Provider

Dua mode pengiriman email didukung:

| Mode | Konfigurasi | Keterangan |
|------|------------|------------|
| **Brevo API** (direkomendasikan) | `BREVO_API_KEY=xkeysib-...` | Tidak terikat IP, lebih andal |
| **SMTP** (fallback) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Butuh whitelist IP di Brevo |

Jika `BREVO_API_KEY` diset, sistem otomatis menggunakan Brevo API. Jika tidak, fallback ke SMTP.

:::info Sender Verification
Sender email (`SMTP_FROM`) **harus diverifikasi** di dashboard Brevo sebelum bisa mengirim email. Tanpa verifikasi, email akan diterima API (status 201) tapi langsung ditolak saat delivery.
:::

### HTML Email Templates

Email dikirim dalam format HTML responsive dengan template di `server/lib/emailTemplates.js`:

| Template | Event | Penerima |
|----------|-------|---------|
| `buildSubmittedEmail` | Pengajuan cuti terkirim | Karyawan |
| `buildStageActivationEmail` | Tahap approval aktif | Approver |
| `buildRejectedEmail` | Cuti ditolak | Karyawan |
| `buildApprovedEmail` | Cuti disetujui penuh | Karyawan |
| `buildExpiryNotificationEmail` | Lisensi/sertifikasi kadaluarsa | Admin penerima |

Semua template menggunakan inline CSS, email-client-safe, dengan `textBody` sebagai fallback.

### Email Outbox

Setiap email yang dikirim dicatat di tabel `email_outbox` dengan status:
- `PENDING` — sedang dalam antrian
- `SENT` — berhasil dikirim
- `FAILED` — gagal dikirim (detail error tersimpan)

Log kegagalan tersedia di menu admin **Email Workflow Failures**.

---

## WhatsApp Notifikasi

WhatsApp dikirim bersamaan dengan email untuk event workflow cuti.

### Provider yang Didukung

| Provider | Env Var | Keterangan |
|----------|---------|------------|
| **Fonnte** (default/production) | `FONNTE_TOKEN` | REST API `https://api.fonnte.com/send` |
| **WAHA** (self-hosted/dev) | `WAHA_URL`, `WAHA_API_KEY`, `WAHA_SESSION` | WAHA v2+ self-hosted |

Pilih provider via `WHATSAPP_PROVIDER=fonnte` atau `WHATSAPP_PROVIDER=waha`.

### Format Nomor Telepon

Nomor telepon dari database otomatis dinormalisasi:
- `08xxxxxxxxxx` → `628xxxxxxxxxx`
- `+628xxxxxxxxxx` → `628xxxxxxxxxx`
- `628xxxxxxxxxx` → tetap

### WAHA Self-Hosted

:::warning Session Name
`WAHA_SESSION` bersifat **case-sensitive**. Pastikan nama session persis sama dengan dashboard WAHA (contoh: `Default`, bukan `default`).
:::

---

## Push Notification

Push notification browser dikirim ke karyawan yang sudah mengaktifkan izin notifikasi di portal mobile.

### Setup VAPID Keys

Generate keys baru jika belum ada:

```bash
npx web-push generate-vapid-keys
```

Simpan di `.env`:
```env
PUSH_VAPID_PUBLIC_KEY=BDBjOA-...
PUSH_VAPID_PRIVATE_KEY=Mv3qLc2D...
PUSH_VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### Event Push Notification

| Event | Penerima |
|-------|---------|
| Pengajuan cuti terkirim | Karyawan |
| Approval stage aktif | Approver |
| Cuti ditolak | Karyawan |
| Cuti disetujui | Karyawan |

---

## Admin Notification Center

**Route:** `/notifikasi`

Pusat notifikasi admin yang menampilkan semua notifikasi sistem dengan:
- Badge jumlah notifikasi belum dibaca di header
- Daftar notifikasi dengan severity (info, warning, error)
- Tandai sudah dibaca (per item atau semua)
- Link ke halaman terkait

---

## Email Workflow Failures

**Route:** `/admin/email-workflow-failures`

Log kegagalan pengiriman email workflow (bukan expiry) yang dapat di-resolve secara manual setelah masalah diperbaiki.
