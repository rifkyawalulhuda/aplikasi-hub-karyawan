---
id: data-unit
title: Modul Data Unit
sidebar_label: Data Unit
---

# Modul Data Unit

Pengelolaan lisensi dan sertifikasi untuk unit/alat berat.

---

## Lisensi & Sertifikasi Unit

**Route:** `/data-unit/lisensi-sertifikasi-unit`

Manajemen dokumen lisensi dan sertifikasi untuk setiap unit/alat berat (forklift, crane, excavator, dll).

### Field Utama

| Field | Keterangan |
|-------|-----------|
| Unit | Relasi ke master_units (dropdown menampilkan Nama Unit + Serial Number) |
| Asset No | Nomor aset perusahaan |
| Nomor Dokumen | Nomor sertifikat/lisensi |
| Diterbitkan Oleh | Vendor/lembaga penerbit |
| Vendor | Relasi ke master_vendors |
| Tanggal Kadaluarsa | Tanggal expired |
| Catatan | Opsional |

### Dropdown Nama Unit

Dropdown pemilihan unit menampilkan:
```
Nama Unit — Serial Number
Contoh: Forklift Reach Truck — RT-2023-001
```

Ini memudahkan identifikasi unit yang memiliki nama sama tapi serial number berbeda.

### Notifikasi Kadaluarsa

Sistem dapat mengirim email otomatis saat lisensi/sertifikasi mendekati kadaluarsa. Konfigurasi di [Pengaturan Email →](/modules/pengaturan-email).

**Threshold default:** 90 hari, 60 hari, 30 hari, dan hari H.

### Filter & Pencarian

Admin dapat memfilter data berdasarkan:
- Nama unit / serial number
- Status kadaluarsa (aktif, akan kadaluarsa, sudah kadaluarsa)
- Vendor
- Tanggal range

### Export & Import

- **Export Excel:** Ekspor semua data lisensi unit ke file `.xlsx`
- **Tambah manual:** Form dialog dengan validasi
