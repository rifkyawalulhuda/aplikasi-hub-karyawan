# Analisis Alur & Aturan Persetujuan Cuti

Dokumen ini menjelaskan alur kerja (*Workflow*) dan aturan (*Rules*) pengajuan cuti yang saat ini diterapkan di sistem Hub Karyawan.

## 1. Tahapan Persetujuan (Approval Stages)

Sistem menggunakan urutan tingkatan jabatan (*Job Level*) untuk menentukan siapa yang harus menyetujui pengajuan. Urutan standarnya adalah sebagai berikut:

| Urutan | Tahap Approval | Jabatan (Job Level) |
| :--- | :--- | :--- |
| 1 | **Foreman** | Foreman |
| 2 | **General Foreman** | General Foreman |
| 3 | **Section Chief** | Section Chief |
| 4 | **Dy. Dept. Manager** | Dy. Dept. Manager |
| 5 | **Dept. Manager** | Dept. Manager |
| 6 | **Site/Div. Manager** | Site/Div. Manager |

### Kasus Khusus: Foreman Group Shift
Jika karyawan yang mengajukan memiliki **Group Shift**, maka tahap pertama adalah **Foreman Group Shift** (bukan Foreman Departemen). Tahap ini melibatkan Foreman yang ditugaskan khusus pada Group Shift karyawan tersebut.

## 2. Cara Kerja Penentuan Alur (Logic Resolve)

Alur persetujuan ditentukan secara dinamis saat pengajuan dibuat berdasarkan jabatan pengaju:

1.  **Titik Awal**: Persetujuan dimulai dari satu tingkat **di atas** jabatan pengaju.
    *   *Contoh*: Jika pengaju adalah seorang **Foreman**, maka tahap pertama adalah **General Foreman**.
2.  **Lingkup Departemen**: Sistem mencari Approver (pemberi persetujuan) yang berada di **Departemen yang sama** dengan pengaju.
3.  **Approver Tersedia**: Jika pada tingkat jabatan tertentu di departemen tersebut tidak ada orang (kosong), sistem akan melompati tahap tersebut dan lanjut ke tingkat berikutnya.
4.  **Validasi Akhir**: Jika setelah dicek tidak ditemukan satu pun Approver yang tersedia di departemen tersebut, pengajuan akan ditolak oleh sistem dengan pesan error.

## 3. Aturan & Validasi Pengajuan (Rules)

Beberapa aturan ketat yang harus dipenuhi sebelum pengajuan diproses:

-   **Saldo Cuti**: Pengaju harus memiliki saldo cuti yang cukup di "Database Cuti" untuk tahun terkait.
-   **Batas Pengganti**: Wajib memilih minimal **1 orang** dan maksimal **4 orang** pengganti selama cuti.
-   **Bentrokan (Overlap)**: Pengajuan tidak boleh bentrok (tanggal bersinggungan) dengan pengajuan lain yang statusnya masih aktif (*Submitted*, *In Approval*) atau sudah disetujui (*Approved*).
-   **Alamat & Alasan**: Wajib mengisi alamat selama cuti dan alasan cuti secara lengkap.

## 4. Status Pengajuan & Persetujuan

### Status Pengajuan (Request Status)
-   `SUBMITTED`: Baru diajukan.
-   `IN_APPROVAL`: Dalam proses persetujuan berjenjang.
-   `APPROVED`: Sudah disetujui oleh semua tahap.
-   `REJECTED`: Ditolak oleh salah satu Approver.
-   `CANCELLED`: Dibatalkan oleh pengaju.

### Status di Tiap Tahap (Approval Status)
-   `WAITING`: Menunggu giliran (belum saatnya tahap ini bertindak).
-   `PENDING`: Sedang menunggu tindakan dari Approver di tahap ini.
-   `APPROVED`: Sudah disetujui di tahap ini.
-   `REJECTED`: Sudah ditolak di tahap ini.
-   `LOCKED`: Tahap yang tidak lagi aktif (misal karena ditolak di tahap sebelumnya).

---
> [!NOTE]
> Jika sebuah pengajuan ditolak (*Rejected*), pengaju dapat melakukan **Resubmit** (Revisi) yang akan memulai alur persetujuan dari awal lagi (Revision No bertambah).
