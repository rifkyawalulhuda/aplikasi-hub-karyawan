import ExcelJS from 'exceljs';

import { formatIndonesianNumber } from './b3WasteExport.js';

/**
 * Format tanggal ke format DD/MM/YYYY
 * @param {Date|string} date
 * @returns {string}
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

const COLUMNS = [
	{ header: 'No', width: 6 },
	{ header: 'Jenis Limbah Non-B3', width: 32 },
	{ header: 'Tanggal Masuk', width: 15 },
	{ header: 'Tanggal Keluar', width: 15 },
	{ header: 'Jumlah (kg)', width: 14 },
	{ header: 'Pengelola Pihak Ketiga', width: 30 },
	{ header: 'Nopol Kendaraan', width: 16 },
	{ header: 'No. Dokumen', width: 20 },
	{ header: 'Surat Jalan', width: 22 },
	{ header: 'Petugas Penanggung Jawab', width: 24 },
];

function applyBorder(cell) {
	cell.border = {
		top: { style: 'thin' },
		left: { style: 'thin' },
		bottom: { style: 'thin' },
		right: { style: 'thin' },
	};
}

/**
 * Generate Excel workbook untuk ekspor data pencatatan limbah non-B3
 * @param {Array} records
 * @returns {ExcelJS.Workbook}
 */
export async function generateNonB3WasteExcel(records) {
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Pencatatan Limbah Non-B3');

	const lastColumn = worksheet.getColumn(COLUMNS.length).letter;

	// Row 1: Judul
	worksheet.mergeCells(`A1:${lastColumn}1`);
	const titleCell = worksheet.getCell('A1');
	titleCell.value = 'CATATAN PENGELOLAAN LIMBAH NON-B3';
	titleCell.font = { bold: true, size: 12 };
	titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

	// Row 2: Header kolom
	const headerRow = worksheet.getRow(2);
	COLUMNS.forEach((column, index) => {
		const cell = headerRow.getCell(index + 1);
		cell.value = column.header;
		cell.font = { bold: true };
		cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
		applyBorder(cell);
	});

	worksheet.columns = COLUMNS.map((column) => ({ width: column.width }));

	let currentRow = 3;
	let totalKg = 0;

	records.forEach((record, index) => {
		const row = worksheet.getRow(currentRow);
		const jumlahKg = Number(record.jumlahKg) || 0;
		totalKg += jumlahKg;

		row.getCell(1).value = index + 1;
		row.getCell(2).value = record.jenisLimbah
			? `${record.jenisLimbah.kode} — ${record.jenisLimbah.nama}`
			: '';
		row.getCell(3).value = formatDate(record.tanggalMasuk);
		row.getCell(4).value = formatDate(record.tanggalKeluar);
		row.getCell(5).value = formatIndonesianNumber(jumlahKg);
		row.getCell(6).value = record.vendor?.vendorName || '';
		row.getCell(7).value = record.nopolKendaraan || '';
		row.getCell(8).value = record.nomorDokumen || '';
		row.getCell(9).value = record.nomorSuratJalan || '';
		row.getCell(10).value = record.petugasPenanggungJawab || '';

		for (let col = 1; col <= COLUMNS.length; col += 1) {
			applyBorder(row.getCell(col));
		}
		row.getCell(5).alignment = { horizontal: 'right' };

		currentRow += 1;
	});

	// Baris TOTAL
	const totalRow = worksheet.getRow(currentRow);
	worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
	totalRow.getCell(1).value = 'TOTAL';
	totalRow.getCell(5).value = formatIndonesianNumber(totalKg);

	for (let col = 1; col <= COLUMNS.length; col += 1) {
		const cell = totalRow.getCell(col);
		cell.font = { bold: true };
		applyBorder(cell);
	}
	totalRow.getCell(1).alignment = { horizontal: 'center' };
	totalRow.getCell(5).alignment = { horizontal: 'right' };

	return workbook;
}
