import { describe, it, expect } from 'vitest';
import { formatIndonesianNumber, generateB3WasteExcel } from './b3WasteExport.js';

describe('formatIndonesianNumber', () => {
	it('should format integer with thousands separator', () => {
		expect(formatIndonesianNumber(1250)).toBe('1.250,00');
	});

	it('should format decimal with comma separator', () => {
		expect(formatIndonesianNumber(1250.5)).toBe('1.250,50');
	});

	it('should format number with exact 2 decimal places', () => {
		expect(formatIndonesianNumber(1250.75)).toBe('1.250,75');
	});

	it('should format zero', () => {
		expect(formatIndonesianNumber(0)).toBe('0,00');
	});

	it('should format small number without thousands separator', () => {
		expect(formatIndonesianNumber(50.25)).toBe('50,25');
	});

	it('should format large number with multiple thousands separators', () => {
		expect(formatIndonesianNumber(1234567.89)).toBe('1.234.567,89');
	});

	it('should handle negative numbers', () => {
		expect(formatIndonesianNumber(-150.5)).toBe('-150,50');
	});

	it('should handle string input', () => {
		expect(formatIndonesianNumber('1250.50')).toBe('1.250,50');
	});

	it('should return empty string for NaN', () => {
		expect(formatIndonesianNumber('abc')).toBe('');
		expect(formatIndonesianNumber(NaN)).toBe('');
	});

	it('should round to 2 decimal places', () => {
		expect(formatIndonesianNumber(100.999)).toBe('101,00');
	});
});

describe('generateB3WasteExcel', () => {
	it('should generate workbook with correct header and columns', async () => {
		const records = [];
		const workbook = await generateB3WasteExcel(records);

		const worksheet = workbook.getWorksheet('Pencatatan Limbah B3');
		expect(worksheet).toBeDefined();

		// Row 1: Header nomor izin
		const headerCell = worksheet.getCell('A1');
		expect(headerCell.value).toBe('660.3/Per.TPLB3 144/VII/P3LH/DLH/2020');
		expect(headerCell.font.bold).toBe(true);

		// Row 2: Column headers
		const expectedColumns = [
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
		expectedColumns.forEach((col, index) => {
			expect(headerRow.getCell(index + 1).value).toBe(col);
		});
	});

	it('should add data rows for records without outRecords', async () => {
		const records = [
			{
				jenisLimbah: { kode: 'A338-1', nama: 'Bahan kimia kedaluwarsa' },
				tanggalMasuk: new Date('2024-01-15'),
				sumberLimbah: 'Warehouse',
				jumlahMasuk: 150.75,
				maksimalPenyimpanan: 90,
				tanggalBatas: new Date('2024-04-14'),
				outRecords: [],
				sisaLimbah: 150.75,
				sisaHari: 45,
			},
		];

		const workbook = await generateB3WasteExcel(records);
		const worksheet = workbook.getWorksheet('Pencatatan Limbah B3');
		const dataRow = worksheet.getRow(3);

		expect(dataRow.getCell(1).value).toBe('A338-1 — Bahan kimia kedaluwarsa');
		expect(dataRow.getCell(2).value).toBe('15/01/2024');
		expect(dataRow.getCell(3).value).toBe('Warehouse');
		expect(dataRow.getCell(4).value).toBe('150,75');
		expect(dataRow.getCell(5).value).toBe('90 hari');
		expect(dataRow.getCell(6).value).toBe('14/04/2024');
		expect(dataRow.getCell(7).value).toBe('');
		expect(dataRow.getCell(8).value).toBe('');
		expect(dataRow.getCell(9).value).toBe('');
		expect(dataRow.getCell(10).value).toBe('');
		expect(dataRow.getCell(11).value).toBe('150,75');
		expect(dataRow.getCell(12).value).toBe('45');
	});

	it('should add multiple rows for records with outRecords', async () => {
		const records = [
			{
				jenisLimbah: { kode: 'A338-1', nama: 'Bahan kimia kedaluwarsa' },
				tanggalMasuk: new Date('2024-01-15'),
				sumberLimbah: 'Warehouse',
				jumlahMasuk: 150.75,
				maksimalPenyimpanan: 90,
				tanggalBatas: new Date('2024-04-14'),
				outRecords: [
					{
						tanggalKeluar: new Date('2024-02-01'),
						jumlahKeluar: 50.0,
						tujuanPenyerahan: 'Pengolahan',
						nomorDokumen: 'MNF/2024/001',
					},
					{
						tanggalKeluar: new Date('2024-03-01'),
						jumlahKeluar: 30.5,
						tujuanPenyerahan: 'Incinerator',
						nomorDokumen: 'MNF/2024/002',
					},
				],
				sisaLimbah: 70.25,
				sisaHari: 14,
			},
		];

		const workbook = await generateB3WasteExcel(records);
		const worksheet = workbook.getWorksheet('Pencatatan Limbah B3');

		// First out record row — should show all data
		const row1 = worksheet.getRow(3);
		expect(row1.getCell(1).value).toBe('A338-1 — Bahan kimia kedaluwarsa');
		expect(row1.getCell(2).value).toBe('15/01/2024');
		expect(row1.getCell(7).value).toBe('01/02/2024');
		expect(row1.getCell(8).value).toBe('50,00');
		expect(row1.getCell(9).value).toBe('Pengolahan');
		expect(row1.getCell(10).value).toBe('MNF/2024/001');

		// Second out record row — waste-in columns should be empty
		const row2 = worksheet.getRow(4);
		expect(row2.getCell(1).value).toBe('');
		expect(row2.getCell(2).value).toBe('');
		expect(row2.getCell(3).value).toBe('');
		expect(row2.getCell(4).value).toBe('');
		expect(row2.getCell(5).value).toBe('');
		expect(row2.getCell(6).value).toBe('');
		expect(row2.getCell(7).value).toBe('01/03/2024');
		expect(row2.getCell(8).value).toBe('30,50');
		expect(row2.getCell(9).value).toBe('Incinerator');
		expect(row2.getCell(10).value).toBe('MNF/2024/002');
		expect(row2.getCell(11).value).toBe('70,25');
		expect(row2.getCell(12).value).toBe('14');
	});

	it('should format numbers using Indonesian format in data rows', async () => {
		const records = [
			{
				jenisLimbah: { kode: 'B101', nama: 'Oli bekas' },
				tanggalMasuk: new Date('2024-06-01'),
				sumberLimbah: 'Workshop',
				jumlahMasuk: 5000.0,
				maksimalPenyimpanan: 180,
				tanggalBatas: new Date('2024-11-28'),
				outRecords: [
					{
						tanggalKeluar: new Date('2024-07-15'),
						jumlahKeluar: 1250.5,
						tujuanPenyerahan: 'Recycling',
						nomorDokumen: 'DOC/001',
					},
				],
				sisaLimbah: 3749.5,
				sisaHari: 120,
			},
		];

		const workbook = await generateB3WasteExcel(records);
		const worksheet = workbook.getWorksheet('Pencatatan Limbah B3');
		const dataRow = worksheet.getRow(3);

		expect(dataRow.getCell(4).value).toBe('5.000,00');
		expect(dataRow.getCell(8).value).toBe('1.250,50');
		expect(dataRow.getCell(11).value).toBe('3.749,50');
	});
});
