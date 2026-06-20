import ExcelJS from 'exceljs';

/**
 * Format angka menggunakan format Indonesia (titik ribuan, koma desimal)
 * @param {number|string} value - Nilai angka yang akan diformat
 * @returns {string} Angka terformat (contoh: 1250.5 → "1.250,50")
 */
export function formatIndonesianNumber(value) {
	const num = Number(value);
	if (isNaN(num)) return '';

	const fixed = num.toFixed(2);
	const [integerPart, decimalPart] = fixed.split('.');

	const isNegative = integerPart.startsWith('-');
	const absInteger = isNegative ? integerPart.slice(1) : integerPart;

	const withThousands = absInteger.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	return `${isNegative ? '-' : ''}${withThousands},${decimalPart}`;
}

/**
 * Format tanggal ke format DD/MM/YYYY
 * @param {Date|string} date - Tanggal yang akan diformat
 * @returns {string} Tanggal terformat (contoh: "15/01/2024")
 */
function formatDate(date) {
	if (!date) return '';
	const d = new Date(date);
	if (isNaN(d.getTime())) return '';

	const day = String(d.getDate()).padStart(2, '0');
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const year = d.getFullYear();

	return `${day}/${month}/${year}`;
}

/**
 * Generate Excel workbook untuk ekspor data pencatatan limbah B3
 * @param {Array} records - Array of waste records dengan computed fields (sisaLimbah, sisaHari)
 * @returns {ExcelJS.Workbook}
 */
export async function generateB3WasteExcel(records) {
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Pencatatan Limbah B3');

	// Row 1: Header nomor izin
	worksheet.mergeCells('A1:L1');
	const headerCell = worksheet.getCell('A1');
	headerCell.value = '660.3/Per.TPLB3 144/VII/P3LH/DLH/2020';
	headerCell.font = { bold: true, size: 12 };
	headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

	// Row 2: Judul kolom
	const columns = [
		'Jenis Limbah B3',
		'Tanggal Masuk',
		'Sumber Limbah',
		'Jumlah Masuk',
		'Maksimal Penyimpanan',
		'Tanggal Batas',
		'Tanggal Keluar',
		'Jumlah Keluar',
		'Tujuan Penyerahan',
		'Nomor Dokumen',
		'Sisa Limbah',
		'Sisa Hari',
	];

	const headerRow = worksheet.getRow(2);
	columns.forEach((col, index) => {
		const cell = headerRow.getCell(index + 1);
		cell.value = col;
		cell.font = { bold: true };
		cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
		cell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' },
		};
	});

	// Set column widths
	worksheet.columns = [
		{ width: 25 }, // Jenis Limbah B3
		{ width: 14 }, // Tanggal Masuk
		{ width: 18 }, // Sumber Limbah
		{ width: 14 }, // Jumlah Masuk
		{ width: 20 }, // Maksimal Penyimpanan
		{ width: 14 }, // Tanggal Batas
		{ width: 14 }, // Tanggal Keluar
		{ width: 14 }, // Jumlah Keluar
		{ width: 20 }, // Tujuan Penyerahan
		{ width: 18 }, // Nomor Dokumen
		{ width: 14 }, // Sisa Limbah
		{ width: 12 }, // Sisa Hari
	];

	// Data rows mulai dari row 3
	let currentRow = 3;

	for (const record of records) {
		const jenisLimbah = record.jenisLimbah ? `${record.jenisLimbah.kode} — ${record.jenisLimbah.nama}` : '';
		const tanggalMasuk = formatDate(record.tanggalMasuk);
		const sumberLimbah = record.sumberLimbah || '';
		const jumlahMasuk = formatIndonesianNumber(record.jumlahMasuk);
		const maksimalPenyimpanan = `${record.maksimalPenyimpanan} hari`;
		const tanggalBatas = formatDate(record.tanggalBatas);
		const sisaLimbah = formatIndonesianNumber(record.sisaLimbah);
		const sisaHari = record.sisaHari != null ? String(record.sisaHari) : '';

		const outRecords = record.outRecords || [];

		if (outRecords.length === 0) {
			// Record tanpa outRecords: tampilkan data masuk saja, kolom keluar kosong
			const row = worksheet.getRow(currentRow);
			row.getCell(1).value = jenisLimbah;
			row.getCell(2).value = tanggalMasuk;
			row.getCell(3).value = sumberLimbah;
			row.getCell(4).value = jumlahMasuk;
			row.getCell(5).value = maksimalPenyimpanan;
			row.getCell(6).value = tanggalBatas;
			row.getCell(7).value = '';
			row.getCell(8).value = '';
			row.getCell(9).value = '';
			row.getCell(10).value = '';
			row.getCell(11).value = sisaLimbah;
			row.getCell(12).value = sisaHari;
			applyDataRowBorder(row, columns.length);
			currentRow++;
		} else {
			// Record dengan outRecords
			for (let i = 0; i < outRecords.length; i++) {
				const outRecord = outRecords[i];
				const row = worksheet.getRow(currentRow);

				if (i === 0) {
					// Baris pertama: tampilkan semua data
					row.getCell(1).value = jenisLimbah;
					row.getCell(2).value = tanggalMasuk;
					row.getCell(3).value = sumberLimbah;
					row.getCell(4).value = jumlahMasuk;
					row.getCell(5).value = maksimalPenyimpanan;
					row.getCell(6).value = tanggalBatas;
				} else {
					// Baris selanjutnya: kolom masuk kosong
					row.getCell(1).value = '';
					row.getCell(2).value = '';
					row.getCell(3).value = '';
					row.getCell(4).value = '';
					row.getCell(5).value = '';
					row.getCell(6).value = '';
				}

				row.getCell(7).value = formatDate(outRecord.tanggalKeluar);
				row.getCell(8).value = formatIndonesianNumber(outRecord.jumlahKeluar);
				row.getCell(9).value = outRecord.tujuanPenyerahan || '';
				row.getCell(10).value = outRecord.nomorDokumen || '';
				row.getCell(11).value = sisaLimbah;
				row.getCell(12).value = sisaHari;

				applyDataRowBorder(row, columns.length);
				currentRow++;
			}
		}
	}

	return workbook;
}

/**
 * Apply border ke seluruh cell pada data row
 * @param {ExcelJS.Row} row
 * @param {number} colCount
 */
function applyDataRowBorder(row, colCount) {
	for (let i = 1; i <= colCount; i++) {
		row.getCell(i).border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' },
		};
	}
}
