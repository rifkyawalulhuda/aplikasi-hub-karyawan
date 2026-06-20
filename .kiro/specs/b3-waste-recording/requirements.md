# Requirements Document

## Introduction

Modul Pencatatan Limbah B3 (Bahan Berbahaya dan Beracun) adalah fitur baru dalam Aplikasi Hub Karyawan yang digunakan untuk mencatat, melacak, dan mengelola limbah B3 yang masuk dan keluar dari TPS (Tempat Penyimpanan Sementara). Modul ini memastikan kepatuhan terhadap izin penyimpanan limbah B3 (Nomor 660.3/Per.TPLB3 144/VII/P3LH/DLH/2020) dengan memantau batas maksimal penyimpanan (90 atau 180 hari) dan menyediakan pencatatan dokumen manifest serta bukti penyerahan limbah.

## Glossary

- **Sistem_Pencatatan_Limbah_B3**: Modul pencatatan limbah B3 dalam Aplikasi Hub Karyawan yang mengelola data masuk dan keluar limbah di TPS
- **TPS**: Tempat Penyimpanan Sementara untuk limbah B3 sesuai regulasi
- **Limbah_B3**: Bahan Berbahaya dan Beracun yang tercatat dalam sistem pencatatan
- **Admin**: Pengguna admin portal yang memiliki hak akses untuk mengelola data pencatatan limbah B3
- **Petugas_TPS**: Petugas yang bertanggung jawab atas pencatatan dan pengelolaan limbah di TPS
- **Manifest**: Dokumen resmi yang menyertai pengiriman limbah B3 dari TPS ke tempat pengolahan
- **Jenis_Limbah_B3**: Klasifikasi limbah berdasarkan kode dan jenis limbah B3 (contoh: A338-1 — Bahan kimia kedaluwarsa), dikelola melalui tab pada halaman Master Data Dokumen
- **Master_Data_Dokumen**: Halaman master data yang sudah ada di aplikasi, berisi beberapa tab untuk mengelola berbagai jenis data dokumen
- **Sumber_Limbah**: Lokasi atau departemen asal limbah B3 (contoh: Warehouse)
- **Tujuan_Penyerahan**: Tujuan akhir pengolahan limbah B3 (contoh: Pengolahan)
- **DataGrid**: Komponen tabel interaktif MUI yang digunakan untuk menampilkan daftar data pencatatan

## Requirements

### Requirement 1: Pencatatan Limbah B3 Masuk

**User Story:** Sebagai Admin, saya ingin mencatat limbah B3 yang masuk ke TPS, sehingga saya dapat melacak semua limbah yang tersimpan beserta tanggal masuk dan batas penyimpanannya.

#### Acceptance Criteria

1. WHEN Admin mengisi form pencatatan limbah masuk dengan data lengkap (jenis limbah, tanggal masuk, sumber limbah, jumlah limbah, maksimal penyimpanan) dan menekan tombol simpan, THE Sistem_Pencatatan_Limbah_B3 SHALL menyimpan data pencatatan limbah masuk ke database dengan status tersimpan dan menampilkan notifikasi sukses bahwa data berhasil disimpan
2. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field jenis limbah B3 sebagai dropdown yang berisi daftar jenis limbah dari master data
3. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field tanggal masuk sebagai date picker dengan default tanggal hari ini, dengan batas minimum tanggal 1 Januari 2020 dan batas maksimum tanggal hari ini
4. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field sumber limbah B3 sebagai text input dengan panjang maksimum 200 karakter
5. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field jumlah limbah B3 masuk sebagai numeric input dengan satuan kilogram, nilai minimum 0.01, nilai maksimum 999999.99, dan presisi 2 angka desimal
6. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field maksimal penyimpanan sebagai dropdown dengan pilihan 90 hari atau 180 hari
7. IF Admin mengisi form dengan data yang tidak lengkap, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan validasi pada field yang belum terisi dan tidak menyimpan data ke database
8. WHEN data limbah masuk berhasil disimpan, THE Sistem_Pencatatan_Limbah_B3 SHALL menghitung dan menyimpan tanggal batas penyimpanan berdasarkan tanggal masuk ditambah maksimal penyimpanan yang dipilih
9. IF Admin memasukkan jumlah limbah di luar rentang 0.01–999999.99 atau memasukkan lebih dari 2 angka desimal, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan validasi yang menunjukkan batas nilai yang diperbolehkan dan tidak menyimpan data ke database

### Requirement 2: Pencatatan Limbah B3 Keluar

**User Story:** Sebagai Admin, saya ingin mencatat limbah B3 yang keluar dari TPS, sehingga saya dapat melacak penyerahan limbah ke pihak pengolah beserta dokumen pendukungnya.

#### Acceptance Criteria

1. WHEN Admin memilih record limbah masuk dari daftar limbah yang masih memiliki sisa di TPS dan mengisi form pencatatan limbah keluar dengan data lengkap (tanggal keluar, jumlah limbah keluar, tujuan penyerahan, nomor dokumen bukti), THE Sistem_Pencatatan_Limbah_B3 SHALL menyimpan data pencatatan limbah keluar yang terkait dengan record limbah masuk yang dipilih
2. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field tanggal keluar sebagai date picker yang tidak mengizinkan tanggal sebelum tanggal masuk dari record limbah masuk yang dipilih dan tidak mengizinkan tanggal setelah hari ini
3. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field jumlah limbah B3 keluar sebagai numeric input dengan satuan kilogram, nilai minimum 0.01, nilai maksimum sesuai sisa limbah yang tersedia untuk record tersebut, dan presisi hingga 2 angka desimal
4. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field tujuan penyerahan sebagai text input dengan panjang maksimum 200 karakter
5. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field bukti nomor dokumen sebagai text input dengan panjang maksimum 100 karakter untuk mencatat nomor manifest atau dokumen internal
6. IF jumlah limbah keluar melebihi sisa limbah yang tersedia di TPS untuk record limbah masuk yang dipilih, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan error yang menyatakan jumlah limbah keluar tidak boleh melebihi sisa limbah di TPS dan tidak menyimpan data
7. WHEN data limbah keluar berhasil disimpan, THE Sistem_Pencatatan_Limbah_B3 SHALL memperbarui sisa limbah di TPS dengan mengurangi jumlah limbah keluar dari sisa limbah sebelumnya pada record limbah masuk yang terkait
8. IF Admin mengirim form dengan salah satu field wajib (tanggal keluar, jumlah limbah keluar, tujuan penyerahan, nomor dokumen bukti) tidak diisi, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan validasi pada field yang kosong dan tidak menyimpan data

### Requirement 3: Perhitungan Sisa Limbah di TPS

**User Story:** Sebagai Admin, saya ingin melihat sisa limbah B3 yang masih tersimpan di TPS, sehingga saya dapat memantau kapasitas penyimpanan dan kepatuhan regulasi.

#### Acceptance Criteria

1. THE Sistem_Pencatatan_Limbah_B3 SHALL menghitung sisa limbah di TPS sebagai selisih antara total limbah masuk dan total limbah keluar untuk setiap jenis limbah dalam cakupan siteId yang aktif, dengan hasil ditampilkan dalam presisi 2 angka desimal (contoh: 150.75 kg)
2. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan kolom "Sisa Limbah Yang Ada di TPS" pada tabel pencatatan dengan nilai yang selalu terkalkulasi otomatis berdasarkan seluruh data kumulatif (semua periode) untuk jenis limbah tersebut
3. WHEN terdapat perubahan data limbah masuk atau limbah keluar (penambahan, pengeditan, atau penghapusan record), THE Sistem_Pencatatan_Limbah_B3 SHALL memperbarui nilai sisa limbah pada tampilan tabel tanpa memerlukan reload halaman secara manual
4. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan sisa limbah dalam satuan kilogram (kg) dengan pemisah ribuan titik dan pemisah desimal koma (contoh: 1.250,50 kg)
5. IF hasil perhitungan sisa limbah bernilai negatif (total keluar melebihi total masuk), THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan nilai tersebut dengan indikator visual peringatan dan tetap menampilkan angka negatif agar Admin dapat mengidentifikasi ketidaksesuaian data

### Requirement 4: Monitoring Batas Penyimpanan

**User Story:** Sebagai Admin, saya ingin mendapat peringatan ketika limbah B3 mendekati atau melewati batas maksimal penyimpanan, sehingga saya dapat segera mengambil tindakan untuk menyerahkan limbah ke pihak pengolah.

#### Acceptance Criteria

1. THE Sistem_Pencatatan_Limbah_B3 SHALL menghitung sisa hari penyimpanan dengan rumus: (tanggal masuk + batas maksimal penyimpanan dalam hari) dikurangi tanggal hari ini, dimana batas maksimal penyimpanan adalah 90 atau 180 hari sesuai konfigurasi jenis limbah
2. WHILE sisa hari penyimpanan bernilai 1 sampai dengan 14 hari, THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan indikator visual berwarna kuning (warning) pada baris record tersebut
3. WHILE sisa hari penyimpanan bernilai 0 atau negatif, THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan indikator visual berwarna merah (overdue) pada baris record tersebut
4. WHILE sisa hari penyimpanan bernilai lebih dari 14 hari, THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan baris record tersebut tanpa indikator warning atau overdue
5. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan kolom "Sisa Hari" pada tabel yang menunjukkan jumlah hari tersisa sebelum batas penyimpanan, termasuk nilai negatif untuk record yang telah melewati batas (contoh: -5 hari)
6. THE Sistem_Pencatatan_Limbah_B3 SHALL menerapkan indikator visual warning dan overdue hanya pada record yang masih memiliki sisa limbah (sisa lebih dari 0 kg)

### Requirement 5: Daftar Pencatatan Limbah B3

**User Story:** Sebagai Admin, saya ingin melihat daftar seluruh pencatatan limbah B3 dalam format tabel, sehingga saya dapat memantau dan mengelola semua data limbah dengan mudah.

#### Acceptance Criteria

1. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan halaman daftar pencatatan limbah B3 menggunakan komponen DataGrid dengan kolom: Jenis Limbah B3, Tanggal Masuk, Sumber Limbah, Jumlah Masuk, Maksimal Penyimpanan, Tanggal Batas, Tanggal Keluar, Jumlah Keluar, Tujuan Penyerahan, Nomor Dokumen, Sisa Limbah, Sisa Hari
2. THE Sistem_Pencatatan_Limbah_B3 SHALL mendukung server-side pagination pada tabel daftar pencatatan dengan ukuran halaman default 25 baris dan pilihan ukuran halaman [25, 50, 100]
3. THE Sistem_Pencatatan_Limbah_B3 SHALL mendukung server-side sorting berdasarkan kolom Tanggal Masuk dan Tanggal Batas, dengan default sorting Tanggal Masuk secara descending pada pemuatan awal
4. THE Sistem_Pencatatan_Limbah_B3 SHALL memfilter data berdasarkan siteId sesuai site yang aktif pada sesi Admin
5. WHEN Admin mengakses halaman daftar pencatatan, THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan indikator loading selama proses pengambilan data dari server, kemudian menampilkan data pencatatan dalam DataGrid setelah data berhasil dimuat
6. IF pengambilan data pencatatan dari server gagal, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan error yang menginformasikan kegagalan pemuatan data dan menyediakan opsi untuk mencoba memuat ulang
7. IF tidak terdapat data pencatatan limbah B3 untuk site yang aktif, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan kosong yang menginformasikan bahwa belum ada data pencatatan limbah

### Requirement 6: Edit dan Hapus Pencatatan

**User Story:** Sebagai Admin, saya ingin dapat mengedit atau menghapus pencatatan limbah B3, sehingga saya dapat memperbaiki kesalahan input data.

#### Acceptance Criteria

1. WHEN Admin menekan tombol edit pada baris record, THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan form edit dalam dialog modal dengan semua field terisi sesuai data record yang dipilih
2. WHEN Admin menyimpan perubahan pada form edit dengan data yang valid, THE Sistem_Pencatatan_Limbah_B3 SHALL memperbarui data record di database, memperbarui tampilan tabel, dan menampilkan notifikasi sukses
3. IF Admin menyimpan perubahan pada form edit dengan data yang tidak valid, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan validasi pada field yang bermasalah dan tidak menyimpan perubahan ke database
4. WHEN Admin menekan tombol hapus pada baris record, THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan dialog konfirmasi yang berisi identitas record yang akan dihapus serta tombol konfirmasi dan tombol batal
5. WHEN Admin mengkonfirmasi penghapusan, THE Sistem_Pencatatan_Limbah_B3 SHALL menghapus record dari database, memperbarui tampilan tabel, dan menampilkan notifikasi sukses
6. IF record limbah masuk yang akan dihapus masih memiliki data limbah keluar terkait, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan error yang mengindikasikan bahwa data limbah masuk tidak dapat dihapus karena masih memiliki pencatatan keluar terkait
7. IF record yang akan diedit atau dihapus sudah tidak ditemukan di database, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan error yang mengindikasikan bahwa record tidak ditemukan dan memperbarui tampilan tabel

### Requirement 7: Master Data Jenis Limbah B3

**User Story:** Sebagai Admin, saya ingin mengelola daftar jenis limbah B3 melalui tab baru di halaman Master Data Dokumen yang sudah ada, sehingga data jenis limbah konsisten dan dapat digunakan di seluruh pencatatan.

#### Acceptance Criteria

1. THE Sistem_Pencatatan_Limbah_B3 SHALL menyediakan tab baru bernama "Jenis Limbah B3" pada halaman Master Data Dokumen yang sudah ada, dengan kolom: Kode Limbah (maksimal 20 karakter), Jenis Limbah B3 (maksimal 200 karakter)
2. WHEN Admin memilih tab "Jenis Limbah B3" pada halaman Master Data Dokumen, THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan daftar jenis limbah B3 menggunakan komponen DataGrid dengan pagination default 25 baris per halaman, hanya menampilkan data sesuai siteId aktif
3. WHEN Admin menambahkan jenis limbah baru dengan kode dan jenis limbah B3 yang valid, THE Sistem_Pencatatan_Limbah_B3 SHALL menyimpan data jenis limbah ke database dengan site isolation sesuai siteId aktif
4. WHEN Admin mengedit jenis limbah yang sudah ada, THE Sistem_Pencatatan_Limbah_B3 SHALL memperbarui field Jenis Limbah B3 di database dan Kode Limbah tidak dapat diubah setelah disimpan
5. IF Admin mencoba menambahkan jenis limbah dengan kode yang sudah ada dalam site yang sama, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan error yang mengindikasikan kode limbah sudah terdaftar dan tidak menyimpan data duplikat
6. IF Admin mengirim form tambah atau edit jenis limbah dengan Kode Limbah atau Jenis Limbah B3 kosong, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan validasi yang mengindikasikan field wajib belum diisi dan tidak menyimpan data
7. IF Admin mencoba menghapus jenis limbah yang sudah digunakan pada pencatatan limbah, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menolak penghapusan dan menampilkan pesan error yang mengindikasikan data masih digunakan oleh record lain

### Requirement 8: Paraf/Tanda Tangan Petugas

**User Story:** Sebagai Admin, saya ingin mencatat nama petugas yang bertanggung jawab pada setiap pencatatan, sehingga terdapat akuntabilitas dan jejak audit.

#### Acceptance Criteria

1. WHEN Admin membuka form pencatatan limbah masuk atau keluar, THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan field petugas penanggung jawab yang otomatis terisi dengan nama lengkap Admin yang sedang login dan bersifat wajib diisi (tidak boleh kosong, maksimal 100 karakter)
2. THE Sistem_Pencatatan_Limbah_B3 SHALL menyimpan nama petugas penanggung jawab bersama dengan setiap record pencatatan secara permanen dan tidak dapat diubah setelah record tersimpan
3. IF field petugas penanggung jawab dikosongkan atau melebihi 100 karakter pada saat submit, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan error validasi dan mencegah penyimpanan record
4. THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan kolom petugas penanggung jawab pada tabel daftar pencatatan limbah masuk dan keluar

### Requirement 9: Ekspor Data Pencatatan

**User Story:** Sebagai Admin, saya ingin mengekspor data pencatatan limbah B3 ke format Excel, sehingga saya dapat membuat laporan dan dokumentasi untuk keperluan audit regulasi.

#### Acceptance Criteria

1. WHEN Admin menekan tombol "Ekspor Excel" pada halaman daftar pencatatan, THE Sistem_Pencatatan_Limbah_B3 SHALL mengunduh file dalam format .xlsx yang berisi seluruh data pencatatan limbah B3 sesuai filter aktif, dengan nama file mengikuti format "Pencatatan_Limbah_B3_{YYYY-MM-DD}.xlsx" berdasarkan tanggal ekspor
2. THE Sistem_Pencatatan_Limbah_B3 SHALL menyertakan informasi nomor izin (660.3/Per.TPLB3 144/VII/P3LH/DLH/2020) pada baris pertama file Excel sebagai header dokumen sebelum baris judul kolom
3. THE Sistem_Pencatatan_Limbah_B3 SHALL memformat file Excel dengan kolom yang sesuai dengan urutan dan judul kolom pada tampilan tabel daftar pencatatan di aplikasi
4. IF tidak terdapat data pencatatan yang sesuai dengan filter aktif, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menampilkan pesan bahwa tidak ada data untuk diekspor dan tidak mengunduh file

### Requirement 10: Isolasi Data per Site

**User Story:** Sebagai Admin, saya ingin data pencatatan limbah B3 terisolasi per site, sehingga setiap site hanya dapat melihat dan mengelola data limbah miliknya sendiri.

#### Acceptance Criteria

1. THE Sistem_Pencatatan_Limbah_B3 SHALL menyimpan siteId pada setiap record pencatatan limbah B3 secara otomatis berdasarkan siteId yang aktif pada sesi Admin saat record dibuat
2. WHEN Admin mengakses data pencatatan (daftar atau detail), THE Sistem_Pencatatan_Limbah_B3 SHALL hanya menampilkan record yang memiliki siteId sesuai dengan siteId aktif pada sesi Admin
3. THE Sistem_Pencatatan_Limbah_B3 SHALL memfilter data master jenis limbah B3 berdasarkan siteId yang aktif, sehingga hanya jenis limbah milik site tersebut yang tersedia untuk dipilih
4. IF Admin melakukan operasi update atau delete terhadap record pencatatan limbah B3 yang memiliki siteId berbeda dari siteId aktif pada sesi Admin, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menolak operasi tersebut dan mengembalikan respons error yang menunjukkan akses tidak diizinkan
5. IF siteId tidak tersedia pada sesi Admin saat mengakses data pencatatan limbah B3, THEN THE Sistem_Pencatatan_Limbah_B3 SHALL menolak request dan mengembalikan respons error yang menunjukkan siteId diperlukan
